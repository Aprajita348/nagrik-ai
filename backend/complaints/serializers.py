from rest_framework import serializers

from .models import Category, Complaint, ComplaintUpdate


class CategorySerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source="department.name", read_only=True)

    class Meta:
        model = Category
        fields = ["id", "name", "department", "department_name"]


class ComplaintUpdateSerializer(serializers.ModelSerializer):
    updated_by_name = serializers.CharField(source="updated_by.username", read_only=True, default=None)

    class Meta:
        model = ComplaintUpdate
        fields = ["id", "old_status", "new_status", "comment", "updated_by_name", "created_at"]


class ComplaintSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    department_name = serializers.CharField(source="department.name", read_only=True)
    updates = ComplaintUpdateSerializer(many=True, read_only=True)

    class Meta:
        model = Complaint
        fields = [
            "id", "title", "description", "image", "latitude", "longitude", "address",
            "category", "category_name", "department", "department_name",
            "priority", "ai_confidence", "status", "expected_resolution", "due_at",
            "acknowledged_at", "resolved_at", "created_at", "updates",
        ]
        read_only_fields = [
            "department", "priority", "ai_confidence", "status", "expected_resolution",
            "due_at", "acknowledged_at", "resolved_at", "created_at",
        ]
        extra_kwargs = {"category": {"required": False}}


class StatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Complaint.Status.choices)
    comment = serializers.CharField(required=False, allow_blank=True)
    expected_resolution = serializers.DateTimeField(required=False)