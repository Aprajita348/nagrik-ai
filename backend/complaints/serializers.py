from rest_framework import serializers

from .models import Category, Complaint, ComplaintUpdate

MAX_IMAGE_MB = 5
ALLOWED_IMAGE_EXT = {"jpg", "jpeg", "png", "webp"}


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
    assigned_officer_name = serializers.CharField(source="assigned_officer.username", read_only=True, default=None)
    duplicate_count = serializers.SerializerMethodField()
    updates = ComplaintUpdateSerializer(many=True, read_only=True)

    class Meta:
        model = Complaint
        fields = [
            "id", "title", "description", "image", "latitude", "longitude", "address",
            "category", "category_name", "department", "department_name",
            "assigned_officer", "assigned_officer_name",
            "priority", "ai_confidence", "status", "expected_resolution", "due_at",
            "acknowledged_at", "resolved_at", "rating", "feedback",
            "duplicate_of", "duplicate_count", "created_at", "updates",
        ]
        read_only_fields = [
            "department", "assigned_officer", "priority", "ai_confidence", "status",
            "expected_resolution", "due_at", "acknowledged_at", "resolved_at",
            "rating", "feedback", "duplicate_of", "created_at",
        ]
        extra_kwargs = {"category": {"required": False}}

    def get_duplicate_count(self, obj):
        return len(obj.duplicates.all())

    def validate_image(self, f):
        if f is None:
            return f
        if f.size > MAX_IMAGE_MB * 1024 * 1024:
            raise serializers.ValidationError(f"Image must be smaller than {MAX_IMAGE_MB} MB.")
        ext = f.name.lower().rsplit(".", 1)[-1] if "." in f.name else ""
        if ext not in ALLOWED_IMAGE_EXT:
            raise serializers.ValidationError("Only JPG, PNG or WEBP images are allowed.")
        return f


class StatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Complaint.Status.choices)
    comment = serializers.CharField(required=False, allow_blank=True)
    expected_resolution = serializers.DateTimeField(required=False)


class TransferSerializer(serializers.Serializer):
    category = serializers.IntegerField()
    comment = serializers.CharField(required=False, allow_blank=True)


class AssignSerializer(serializers.Serializer):
    officer = serializers.IntegerField()


class FeedbackSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=["close", "reopen"])
    rating = serializers.IntegerField(required=False, min_value=1, max_value=5)
    feedback = serializers.CharField(required=False, allow_blank=True)