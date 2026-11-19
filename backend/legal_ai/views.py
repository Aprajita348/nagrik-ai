from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .services import analyze_case

MAX_FILES = 5
MAX_PDF_MB = 10


class AnalyzeView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        description = (request.data.get("description") or "").strip()
        files = request.FILES.getlist("documents")

        if not description and not files:
            return Response({"detail": "Describe your situation or upload documents."}, status=400)
        if len(files) > MAX_FILES:
            return Response({"detail": f"You can upload at most {MAX_FILES} files."}, status=400)
        for f in files:
            if not f.name.lower().endswith(".pdf"):
                return Response({"detail": f"{f.name}: only PDF files are allowed."}, status=400)
            if f.size > MAX_PDF_MB * 1024 * 1024:
                return Response({"detail": f"{f.name}: file must be smaller than {MAX_PDF_MB} MB."}, status=400)

        return Response(analyze_case(description, files))