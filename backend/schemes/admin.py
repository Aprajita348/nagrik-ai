from django.contrib import admin

from .models import Scheme


@admin.register(Scheme)
class SchemeAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "level", "last_date", "is_active")
    list_filter = ("category", "level", "is_active")
    search_fields = ("name", "description")