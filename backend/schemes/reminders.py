from datetime import timedelta

from django.utils import timezone

from .models import Bookmark, Notification

REMIND_DAYS = 7


def create_due_reminders(user):
    """Saved schemes ki last date 7 din ke andar ho to ek baar reminder notification banao."""
    today = timezone.localdate()
    limit = today + timedelta(days=REMIND_DAYS)
    marks = Bookmark.objects.filter(
        user=user, scheme__is_active=True,
        scheme__last_date__isnull=False,
        scheme__last_date__gte=today, scheme__last_date__lte=limit,
    ).select_related("scheme")

    for m in marks:
        msg = f"Reminder: {m.scheme.name} application closes on {m.scheme.last_date:%d %b %Y}"
        if not Notification.objects.filter(user=user, message=msg).exists():
            Notification.objects.create(user=user, message=msg, link="/schemes")