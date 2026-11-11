from django.urls import path

from .views import EligibilityView, SchemeListView

urlpatterns = [
    path("schemes/", SchemeListView.as_view()),
    path("schemes/check/", EligibilityView.as_view()),
]