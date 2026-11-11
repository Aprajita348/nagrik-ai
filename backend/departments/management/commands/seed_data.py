from django.core.management.base import BaseCommand

from accounts.models import User
from complaints.models import Category
from departments.models import Department

DATA = {
    "PWD": ("लोक निर्माण विभाग", ["Pothole / Damaged road", "Broken bridge or culvert"]),
    "Nagar Palika": ("नगर पालिका", ["Garbage not collected", "Streetlight not working", "Drain / sewer blocked", "Stray animals"]),
    "Water Department": ("जल विभाग", ["Water leakage", "No water supply"]),
    "Electricity Department": ("बिजली विभाग", ["Power cut", "Damaged electric pole or wire"]),
    "Traffic Police": ("यातायात पुलिस", ["Illegal parking", "Traffic signal not working"]),
    "Forest Department": ("वन विभाग", ["Wild animal sighting", "Illegal tree cutting"]),
}


class Command(BaseCommand):
    help = "Seed departments, categories and demo users"

    def handle(self, *args, **options):
        for dept_name, (name_hi, categories) in DATA.items():
            dept, _ = Department.objects.get_or_create(name=dept_name, defaults={"name_hi": name_hi})
            for cat in categories:
                Category.objects.get_or_create(name=cat, department=dept)

            username = "officer_" + dept_name.split()[0].lower()
            if not User.objects.filter(username=username).exists():
                User.objects.create_user(
                    username=username, password="Officer@123",
                    role=User.Role.OFFICER, department=dept,
                )

        if not User.objects.filter(username="citizen1").exists():
            User.objects.create_user(username="citizen1", password="Citizen@123", role=User.Role.CITIZEN)

        User.objects.filter(is_superuser=True).update(role=User.Role.ADMIN)
        self.stdout.write(self.style.SUCCESS("Seed data ready"))