from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .services import analyze_case


class AnalyzeView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        description = (request.data.get("description") or "").strip()
        files = request.FILES.getlist("documents")
        if not description and not files:
            return Response({"detail": "Describe your situation or upload documents."}, status=400)
        return Response(analyze_case(description, files))