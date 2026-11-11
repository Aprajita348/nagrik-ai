from rest_framework import serializers

from .models import Scheme


class SchemeSerializer(serializers.ModelSerializer):
    documents_list = serializers.SerializerMethodField()

    class Meta:
        model = Scheme
        fields = "__all__"

    def get_documents_list(self, obj):
        return [d.strip() for d in obj.documents.splitlines() if d.strip()]