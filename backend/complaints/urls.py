from django.urls import path

from .views import (
    AdminOverviewView, CategoryListView, ComplaintAssignView, ComplaintDetailView,
    ComplaintFeedbackView, ComplaintListCreateView, ComplaintStatusView,
    ComplaintTransferView, OfficerListView,
)

urlpatterns = [
    path("categories/", CategoryListView.as_view()),
    path("complaints/", ComplaintListCreateView.as_view()),
    path("complaints/<int:pk>/", ComplaintDetailView.as_view()),
    path("complaints/<int:pk>/status/", ComplaintStatusView.as_view()),
    path("complaints/<int:pk>/transfer/", ComplaintTransferView.as_view()),
    path("complaints/<int:pk>/assign/", ComplaintAssignView.as_view()),
    path("complaints/<int:pk>/feedback/", ComplaintFeedbackView.as_view()),
    path("officers/", OfficerListView.as_view()),
    path("admin/overview/", AdminOverviewView.as_view()),
]