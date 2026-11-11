from datetime import timedelta

from django.db.models import Avg, DurationField, ExpressionWrapper, F, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from schemes.models import Notification

from departments.models import Department

from .ai_service import classify
from .models import Category, Complaint, ComplaintUpdate
from .serializers import (
    CategorySerializer, ComplaintSerializer, StatusUpdateSerializer,
)


def complaints_for(user):
    """Har role ko sirf uski allowed complaints milti hain."""
    qs = Complaint.objects.select_related("category", "department").prefetch_related("updates")
    if user.role == "citizen":
        return qs.filter(citizen=user)
    if user.role == "officer":
        return qs.filter(department=user.department)
    return qs  # admin sab dekhta hai


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.select_related("department")
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None


class ComplaintListCreateView(generics.ListCreateAPIView):
    serializer_class = ComplaintSerializer

    def get_queryset(self):
        return complaints_for(self.request.user).order_by("-created_at")

    def perform_create(self, serializer):
        user = self.request.user
        if user.role != "citizen":
            raise PermissionDenied("Only citizens can file complaints.")

        data = serializer.validated_data
        ai = classify(f"{data['title']} {data['description']}")

        category = data.get("category")
        if category is None:
            category = Category.objects.filter(name=ai["category"]).first() if ai["category"] else None
            if category is None:
                raise ValidationError({"category": "Could not detect the category. Please select one."})

        dept = category.department
        priority = ai["priority"]
        hours = {
            "high": dept.sla_high_hours,
            "medium": dept.sla_medium_hours,
            "low": dept.sla_low_hours,
        }[priority]

        serializer.save(
            citizen=user, category=category, department=dept, priority=priority,
            ai_confidence=ai["confidence"] or None,
            due_at=timezone.now() + timedelta(hours=hours),
        )


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
        Notification.objects.create(
            user=complaint.citizen,
            message=f"Complaint #{complaint.id} is now {new_status.replace('_', ' ')}",
            link="/citizen",
        )
        return Response(ComplaintSerializer(complaint, context={"request": request}).data)


class AdminOverviewView(APIView):
    def get(self, request):
        if request.user.role != "admin":
            raise PermissionDenied("Admins only.")

        now = timezone.now()
        done = ["resolved", "closed", "rejected"]
        open_q = ~Q(status__in=done)
        qs = Complaint.objects.select_related("category", "department").prefetch_related("updates")

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