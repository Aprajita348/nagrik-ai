from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (("Nagrik AI", {"fields": ("role", "department", "phone")}),)
    list_display = ("username", "email", "role", "department", "is_staff")