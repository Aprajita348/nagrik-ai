from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from rest_framework_simplejwt.views import TokenRefreshView

from accounts.views import LoginView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/login/", LoginView.as_view()),
    path("api/auth/refresh/", TokenRefreshView.as_view()),
    path("api/auth/", include("accounts.urls")),
    path("api/", include("complaints.urls")),
    path("api/", include("schemes.urls")),
    path("api/chatbot/", include("chatbot.urls")),
    path("api/legal/", include("legal_ai.urls")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)