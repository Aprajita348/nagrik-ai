from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Announcement, Bookmark, Notification, Office, Scheme
from .serializers import (
    AnnouncementSerializer, NotificationSerializer, OfficeSerializer, SchemeSerializer,
)


class SchemeListView(generics.ListAPIView):
    serializer_class = SchemeSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None

    def get_queryset(self):
        qs = Scheme.objects.filter(is_active=True)
        p = self.request.query_params
        if p.get("category"):
            qs = qs.filter(category=p["category"])
        if p.get("level"):
            qs = qs.filter(level=p["level"])
        if p.get("q"):
            qs = qs.filter(Q(name__icontains=p["q"]) | Q(description__icontains=p["q"]))
        return qs.order_by("name")


class EligibilityView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        profile = {}
        try:
            if request.data.get("age") not in (None, ""):
                profile["age"] = int(request.data["age"])
            if request.data.get("annual_income") not in (None, ""):
                profile["annual_income"] = int(request.data["annual_income"])
        except (TypeError, ValueError):
            return Response({"detail": "Age and income must be numbers."}, status=400)

        profile["occupation"] = request.data.get("occupation") or None
        profile["gender"] = request.data.get("gender") or None

        matched = [s for s in Scheme.objects.filter(is_active=True) if s.matches(profile)]
        return Response({
            "count": len(matched),
            "schemes": SchemeSerializer(matched, many=True).data,
            "note": "Guidance only. Please confirm eligibility on the official website.",
        })


class BookmarkListView(APIView):
    def get(self, request):
        schemes = Scheme.objects.filter(bookmarks__user=request.user, is_active=True)
        return Response(SchemeSerializer(schemes, many=True).data)


class BookmarkToggleView(APIView):
    def post(self, request, pk):
        scheme = get_object_or_404(Scheme, pk=pk)
        obj, created = Bookmark.objects.get_or_create(user=request.user, scheme=scheme)
        if not created:
            obj.delete()
        return Response({"bookmarked": created})


class AnnouncementListView(generics.ListAPIView):
    queryset = Announcement.objects.filter(is_active=True)[:10]
    serializer_class = AnnouncementSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None


class OfficeListView(generics.ListAPIView):
    serializer_class = OfficeSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None

    def get_queryset(self):
        qs = Office.objects.all().order_by("name")
        q = self.request.query_params.get("q")
        if q:
            qs = qs.filter(
                Q(name__icontains=q) | Q(address__icontains=q)
                | Q(district__icontains=q) | Q(department__icontains=q)
            )
        return qs


class NotificationListView(APIView):
    def get(self, request):
        items = Notification.objects.filter(user=request.user)[:30]
        return Response(NotificationSerializer(items, many=True).data)


class NotificationReadView(APIView):
    def post(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({"ok": True})