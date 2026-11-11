from django.db.models import Q
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Scheme
from .serializers import SchemeSerializer


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