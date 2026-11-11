from django.db import models


class Department(models.Model):
    name = models.CharField(max_length=100, unique=True)
    name_hi = models.CharField(max_length=100, blank=True)
    sla_high_hours = models.PositiveIntegerField(default=24)
    sla_medium_hours = models.PositiveIntegerField(default=72)
    sla_low_hours = models.PositiveIntegerField(default=168)

    def __str__(self):
        return self.name