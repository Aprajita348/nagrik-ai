from django.contrib import admin

from accounts.models import User

from .models import Announcement, Notification, Office, Scheme


@admin.register(Scheme)
class SchemeAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "level", "last_date", "is_active")
    list_filter = ("category", "level", "is_active")
    search_fields = ("name", "description")

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        if not change and obj.is_active:
            Notification.objects.bulk_create([
                Notification(user=u, message=f"New scheme added: {obj.name}", link="/schemes")
                for u in User.objects.filter(role="citizen")
            ])


admin.site.register(Announcement)
admin.site.register(Office)
admin.site.register(Notification)