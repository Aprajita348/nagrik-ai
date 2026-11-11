from django.urls import path

from .views import (
    AnnouncementListView, BookmarkListView, BookmarkToggleView, EligibilityView,
    NotificationListView, NotificationReadView, OfficeListView, SchemeListView,
)

urlpatterns = [
    path("schemes/", SchemeListView.as_view()),
    path("schemes/check/", EligibilityView.as_view()),
    path("schemes/bookmarks/", BookmarkListView.as_view()),
    path("schemes/<int:pk>/bookmark/", BookmarkToggleView.as_view()),
    path("announcements/", AnnouncementListView.as_view()),
    path("offices/", OfficeListView.as_view()),
    path("notifications/", NotificationListView.as_view()),
    path("notifications/read/", NotificationReadView.as_view()),
]