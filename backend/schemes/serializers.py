from rest_framework import serializers

from .models import Announcement, Notification, Office, Scheme


class SchemeSerializer(serializers.ModelSerializer):
    documents_list = serializers.SerializerMethodField()

    class Meta:
        model = Scheme
        fields = "__all__"

    def get_documents_list(self, obj):
        return [d.strip() for d in obj.documents.splitlines() if d.strip()]


class AnnouncementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Announcement
        fields = "__all__"


class OfficeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Office
        fields = "__all__"


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = "__all__"