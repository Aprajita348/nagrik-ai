from rest_framework.response import Response
from rest_framework.views import APIView

from .services import ask_scheme_assistant


class AskView(APIView):
    def post(self, request):
        message = (request.data.get("message") or "").strip()
        if not message:
            return Response({"detail": "Message is required."}, status=400)
        return Response(ask_scheme_assistant(message, request.data.get("history")))