from datetime import timedelta
from math import asin, cos, radians, sin, sqrt

from django.core.paginator import Paginator
from django.db.models import Avg, DurationField, ExpressionWrapper, F, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from departments.models import Department
from schemes.models import Notification

from .ai_service import classify
from .models import Category, Complaint, ComplaintUpdate
from .serializers import (
    AssignSerializer, CategorySerializer, ComplaintSerializer, FeedbackSerializer,
    StatusUpdateSerializer, TransferSerializer,
)

DONE = ["resolved", "closed", "rejected"]
DUPLICATE_RADIUS_M = 100
DUPLICATE_DAYS = 30


def complaints_for(user):
    """Har role ko sirf uski allowed complaints milti hain."""
    qs = Complaint.objects.select_related("category", "department", "assigned_officer").prefetch_related(
        "updates", "duplicates"
    )
    if user.role == "citizen":
        return qs.filter(citizen=user)
    if user.role == "officer":
        return qs.filter(department=user.department)
    return qs  # admin sab dekhta hai


def sla_hours(dept, priority):
    return {
        "high": dept.sla_high_hours,
        "medium": dept.sla_medium_hours,
        "low": dept.sla_low_hours,
    }[priority]


def notify(users, message, link=""):
    Notification.objects.bulk_create([Notification(user=u, message=message, link=link) for u in users])


def serialized(complaint, request):
    return ComplaintSerializer(complaint, context={"request": request}).data


def distance_m(lat1, lon1, lat2, lon2):
    """Do GPS points ke beech ki doori meters mein (haversine)."""
    r = 6371000
    p1, p2 = radians(lat1), radians(lat2)
    dphi = p2 - p1
    dlam = radians(lon2 - lon1)
    a = sin(dphi / 2) ** 2 + cos(p1) * cos(p2) * sin(dlam / 2) ** 2
    return 2 * r * asin(sqrt(a))


def find_duplicate(category, lat, lon):
    """Same category ki, paas ki, khuli complaint dhundho (GPS ho tabhi)."""
    if lat is None or lon is None:
        return None
    since = timezone.now() - timedelta(days=DUPLICATE_DAYS)
    candidates = Complaint.objects.filter(
        category=category, created_at__gte=since,
        latitude__isnull=False, longitude__isnull=False, duplicate_of__isnull=True,
    ).exclude(status__in=DONE)
    best, best_d = None, DUPLICATE_RADIUS_M
    for c in candidates:
        d = distance_m(lat, lon, c.latitude, c.longitude)
        if d <= best_d:
            best, best_d = c, d
    return best


def register_duplicate(original):
    """Naya report judne par original complaint ko update karo; 3+ reports par priority high."""
    count = original.duplicates.count() + 1  # original + saare linked reports
    comment = f"{count} citizens have reported this issue."
    if count >= 3 and original.priority != "high":
        original.priority = "high"
        high_due = original.created_at + timedelta(hours=original.department.sla_high_hours)
        original.due_at = min(original.due_at, high_due) if original.due_at else high_due
        original.save()
        comment += " Priority raised to high."
    ComplaintUpdate.objects.create(
        complaint=original, updated_by=None,
        old_status=original.status, new_status=original.status, comment=comment,
    )
    notify(User.objects.filter(role="officer", department=original.department),
           f"Complaint #{original.id}: {count} citizens have now reported this issue", "/officer")


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.select_related("department")
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None


class ComplaintListCreateView(generics.ListCreateAPIView):
    serializer_class = ComplaintSerializer

    def get_queryset(self):
        return complaints_for(self.request.user).order_by("-created_at", "-id")

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()

        # ?page= na ho to pehle jaisa poora array (citizen page ke liye)
        if "page" not in request.query_params:
            return Response(self.get_serializer(qs, many=True).data)

        stats = {
            "total": qs.count(),
            "not_acknowledged": qs.filter(status="submitted").count(),
            "overdue": qs.filter(~Q(status__in=DONE), due_at__lt=timezone.now()).count(),
        }
        status_filter = request.query_params.get("status")
        if status_filter and status_filter != "all":
            qs = qs.filter(status=status_filter)

        try:
            page_size = max(1, min(int(request.query_params.get("page_size", 10)), 50))
        except ValueError:
            page_size = 10
        paginator = Paginator(qs, page_size)
        page_obj = paginator.get_page(request.query_params.get("page"))

        return Response({
            "count": paginator.count,
            "page": page_obj.number,
            "pages": paginator.num_pages,
            "stats": stats,
            "results": self.get_serializer(page_obj.object_list, many=True).data,
        })

    def create(self, request, *args, **kwargs):
        user = request.user
        if user.role != "citizen":
            raise PermissionDenied("Only citizens can file complaints.")

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        ai = classify(f"{data['title']} {data['description']}")
        category = data.get("category")
        if category is None:
            category = Category.objects.filter(name=ai["category"]).first() if ai["category"] else None
            if category is None:
                raise ValidationError({"category": "Could not detect the category. Please select one."})

        existing = find_duplicate(category, data.get("latitude"), data.get("longitude"))
        choice = str(request.data.get("duplicate_action", "")).lower()
        if existing and choice not in ("link", "separate"):
            return Response({
                "detail": "A similar complaint was reported very close to this location recently.",
                "existing": {
                    "id": existing.id,
                    "category_name": existing.category.name,
                    "department_name": existing.department.name,
                    "status": existing.status,
                },
            }, status=409)

        dept = category.department
        priority = ai["priority"]
        linked = existing if (existing and choice == "link") else None
        complaint = serializer.save(
            citizen=user, category=category, department=dept, priority=priority,
            ai_confidence=ai["confidence"] or None, duplicate_of=linked,
            due_at=timezone.now() + timedelta(hours=sla_hours(dept, priority)),
        )
        if linked:
            register_duplicate(linked)
        return Response(serialized(complaint, request), status=201)


class ComplaintDetailView(generics.RetrieveAPIView):
    serializer_class = ComplaintSerializer

    def get_queryset(self):
        return complaints_for(self.request.user)


class ComplaintStatusView(APIView):
    def post(self, request, pk):
        if request.user.role not in ("officer", "admin"):
            raise PermissionDenied("Only officers or admins can update status.")

        complaint = get_object_or_404(complaints_for(request.user), pk=pk)
        data = StatusUpdateSerializer(data=request.data)
        data.is_valid(raise_exception=True)

        old_status = complaint.status
        new_status = data.validated_data["status"]
        now = timezone.now()

        if new_status == "acknowledged" and not complaint.acknowledged_at:
            complaint.acknowledged_at = now
            complaint.assigned_officer = request.user
        if new_status == "resolved":
            complaint.resolved_at = now
        if "expected_resolution" in data.validated_data:
            complaint.expected_resolution = data.validated_data["expected_resolution"]

        complaint.status = new_status
        complaint.save()

        ComplaintUpdate.objects.create(
            complaint=complaint, updated_by=request.user,
            old_status=old_status, new_status=new_status,
            comment=data.validated_data.get("comment", ""),
        )
        notify([complaint.citizen], f"Complaint #{complaint.id} is now {new_status.replace('_', ' ')}", "/citizen")
        return Response(serialized(complaint, request))


class ComplaintTransferView(APIView):
    """Officer/admin galat department ki complaint sahi department ko bhejta hai."""

    def post(self, request, pk):
        if request.user.role not in ("officer", "admin"):
            raise PermissionDenied("Only officers or admins can transfer complaints.")

        complaint = get_object_or_404(complaints_for(request.user), pk=pk)
        data = TransferSerializer(data=request.data)
        data.is_valid(raise_exception=True)

        new_category = get_object_or_404(Category.objects.select_related("department"), pk=data.validated_data["category"])
        if new_category.department_id == complaint.department_id:
            raise ValidationError({"category": "Choose a category that belongs to a different department."})

        old_dept = complaint.department
        new_dept = new_category.department
        old_status = complaint.status
        reason = data.validated_data.get("comment", "")

        complaint.category = new_category
        complaint.department = new_dept
        complaint.assigned_officer = None
        complaint.status = "submitted"
        complaint.acknowledged_at = None
        complaint.due_at = timezone.now() + timedelta(hours=sla_hours(new_dept, complaint.priority))
        complaint.save()

        ComplaintUpdate.objects.create(
            complaint=complaint, updated_by=request.user,
            old_status=old_status, new_status="submitted",
            comment=f"Transferred from {old_dept.name} to {new_dept.name}. {reason}".strip(),
        )
        notify([complaint.citizen], f"Complaint #{complaint.id} was moved to {new_dept.name}", "/citizen")
        notify(User.objects.filter(role="officer", department=new_dept),
               f"New complaint #{complaint.id} transferred to your department", "/officer")
        return Response(serialized(complaint, request))


class ComplaintAssignView(APIView):
    """Admin complaint ko department ke ek officer ko assign karta hai."""

    def post(self, request, pk):
        if request.user.role != "admin":
            raise PermissionDenied("Only admins can assign officers.")

        complaint = get_object_or_404(Complaint, pk=pk)
        data = AssignSerializer(data=request.data)
        data.is_valid(raise_exception=True)

        officer = get_object_or_404(User, pk=data.validated_data["officer"], role="officer")
        if officer.department_id != complaint.department_id:
            raise ValidationError({"officer": "This officer does not belong to the complaint's department."})

        complaint.assigned_officer = officer
        complaint.save()

        ComplaintUpdate.objects.create(
            complaint=complaint, updated_by=request.user,
            old_status=complaint.status, new_status=complaint.status,
            comment=f"Assigned to {officer.username}",
        )
        notify([officer], f"Complaint #{complaint.id} has been assigned to you", "/officer")
        return Response(serialized(complaint, request))


class ComplaintFeedbackView(APIView):
    """Citizen resolved complaint ko close kare (rating ke saath) ya reopen kare."""

    def post(self, request, pk):
        if request.user.role != "citizen":
            raise PermissionDenied("Only the citizen who filed the complaint can do this.")

        complaint = get_object_or_404(complaints_for(request.user), pk=pk)
        if complaint.status != "resolved":
            raise ValidationError({"detail": "Feedback can be given only after the complaint is resolved."})

        data = FeedbackSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        action = data.validated_data["action"]
        text = data.validated_data.get("feedback", "").strip()
        old_status = complaint.status

        if action == "close":
            complaint.status = "closed"
            complaint.rating = data.validated_data.get("rating")
            complaint.feedback = text
            comment = "Citizen confirmed the resolution."
            if complaint.rating:
                comment += f" Rating: {complaint.rating}/5."
            if text:
                comment += f" {text}"
        else:
            if not text:
                raise ValidationError({"feedback": "Please tell us why you are reopening the complaint."})
            complaint.status = "reopened"
            complaint.resolved_at = None
            complaint.due_at = timezone.now() + timedelta(hours=sla_hours(complaint.department, complaint.priority))
            comment = f"Citizen reopened the complaint: {text}"
            notify(User.objects.filter(role="officer", department=complaint.department),
                   f"Complaint #{complaint.id} was reopened by the citizen", "/officer")

        complaint.save()
        ComplaintUpdate.objects.create(
            complaint=complaint, updated_by=request.user,
            old_status=old_status, new_status=complaint.status, comment=comment,
        )
        return Response(serialized(complaint, request))


class OfficerListView(APIView):
    def get(self, request):
        if request.user.role != "admin":
            raise PermissionDenied("Admins only.")
        qs = User.objects.filter(role="officer").select_related("department")
        dept = request.query_params.get("department")
        if dept:
            qs = qs.filter(department_id=dept)
        return Response([
            {
                "id": u.id, "username": u.username, "department": u.department_id,
                "department_name": u.department.name if u.department else None,
            }
            for u in qs
        ])


class AdminOverviewView(APIView):
    def get(self, request):
        if request.user.role != "admin":
            raise PermissionDenied("Admins only.")

        now = timezone.now()
        open_q = ~Q(status__in=DONE)
        qs = Complaint.objects.select_related("category", "department", "assigned_officer").prefetch_related(
            "updates", "duplicates"
        )

        overdue_qs = qs.filter(open_q, due_at__lt=now)
        # 4 ghante se zyada ho gaye aur kisi officer ne acknowledge nahi kiya
        stale_qs = qs.filter(status="submitted", created_at__lt=now - timedelta(hours=4))

        rows = []
        for d in Department.objects.all():
            dq = qs.filter(department=d)
            resolved = dq.filter(resolved_at__isnull=False)
            avg = resolved.aggregate(
                a=Avg(ExpressionWrapper(F("resolved_at") - F("created_at"), output_field=DurationField()))
            )["a"]
            rows.append({
                "department": d.name,
                "total": dq.count(),
                "open": dq.filter(open_q).count(),
                "overdue": dq.filter(open_q, due_at__lt=now).count(),
                "resolved": resolved.count(),
                "avg_resolution_hours": round(avg.total_seconds() / 3600, 1) if avg else None,
            })

        ctx = {"request": request}
        return Response({
            "totals": {
                "total": qs.count(),
                "open": qs.filter(open_q).count(),
                "overdue": overdue_qs.count(),
                "unacknowledged": stale_qs.count(),
                "resolved": qs.filter(status__in=["resolved", "closed"]).count(),
            },
            "departments": rows,
            "overdue": ComplaintSerializer(overdue_qs.order_by("due_at")[:50], many=True, context=ctx).data,
            "unacknowledged": ComplaintSerializer(stale_qs.order_by("created_at")[:50], many=True, context=ctx).data,
        })