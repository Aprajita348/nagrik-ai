from django.conf import settings
from django.db import models
from departments.models import Department


class Category(models.Model):
    name = models.CharField(max_length=100)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name="categories")

    class Meta:
        verbose_name_plural = "categories"

    def __str__(self):
        return f"{self.name} ({self.department.name})"


class Complaint(models.Model):
    class Status(models.TextChoices):
        SUBMITTED = "submitted", "Submitted"
        ACKNOWLEDGED = "acknowledged", "Acknowledged"
        IN_PROGRESS = "in_progress", "In Progress"
        RESOLVED = "resolved", "Resolved"
        CLOSED = "closed", "Closed"
        REJECTED = "rejected", "Rejected"

    class Priority(models.TextChoices):
        HIGH = "high", "High"
        MEDIUM = "medium", "Medium"
        LOW = "low", "Low"

    citizen = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="complaints")
    category = models.ForeignKey(Category, on_delete=models.PROTECT)
    department = models.ForeignKey(Department, on_delete=models.PROTECT, related_name="complaints")
    title = models.CharField(max_length=200)
    description = models.TextField()
    image = models.FileField(upload_to="complaints/", blank=True, null=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    address = models.CharField(max_length=255, blank=True)
    priority = models.CharField(max_length=10, choices=Priority.choices, default=Priority.MEDIUM)
    ai_confidence = models.FloatField(null=True, blank=True)
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.SUBMITTED)
    assigned_officer = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="assigned_complaints",
    )
    expected_resolution = models.DateTimeField(null=True, blank=True)
    due_at = models.DateTimeField(null=True, blank=True)
    acknowledged_at = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"#{self.id} {self.title}"


class ComplaintUpdate(models.Model):
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name="updates")
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL)
    old_status = models.CharField(max_length=15, blank=True)
    new_status = models.CharField(max_length=15)
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)