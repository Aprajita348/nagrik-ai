from django.urls import path

from .views import (
    AdminOverviewView, CategoryListView, ComplaintDetailView,
    ComplaintListCreateView, ComplaintStatusView,
)

urlpatterns = [
    path("categories/", CategoryListView.as_view()),
    path("complaints/", ComplaintListCreateView.as_view()),
    path("complaints/<int:pk>/", ComplaintDetailView.as_view()),
    path("complaints/<int:pk>/status/", ComplaintStatusView.as_view()),
    path("admin/overview/", AdminOverviewView.as_view()),
]