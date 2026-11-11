from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        CITIZEN = "citizen", "Citizen"
        OFFICER = "officer", "Officer"
        ADMIN = "admin", "Admin"

    role = models.CharField(max_length=10, choices=Role.choices, default=Role.CITIZEN)
    department = models.ForeignKey(
        "departments.Department", null=True, blank=True,
        on_delete=models.SET_NULL, related_name="officers",
    )
    phone = models.CharField(max_length=15, blank=True)