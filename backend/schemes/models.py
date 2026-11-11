from django.conf import settings
from django.db import models


class Scheme(models.Model):
    class Category(models.TextChoices):
        STUDENT = "student", "Student"
        FARMER = "farmer", "Farmer"
        WOMEN = "women", "Women"
        SENIOR = "senior", "Senior Citizen"
        HEALTH = "health", "Health"
        BUSINESS = "business", "Business"
        HOUSING = "housing", "Housing"
        OTHER = "other", "Other"

    class Level(models.TextChoices):
        CENTRAL = "central", "Central"
        STATE = "state", "Uttarakhand"

    class Gender(models.TextChoices):
        ANY = "any", "Any"
        FEMALE = "female", "Female"
        MALE = "male", "Male"

    name = models.CharField(max_length=200, unique=True)
    description = models.TextField()
    category = models.CharField(max_length=20, choices=Category.choices)
    level = models.CharField(max_length=10, choices=Level.choices)
    benefits = models.TextField(blank=True)
    eligibility_text = models.TextField(blank=True)
    documents = models.TextField(blank=True, help_text="One document per line")
    min_age = models.PositiveIntegerField(null=True, blank=True)
    max_age = models.PositiveIntegerField(null=True, blank=True)
    max_income = models.PositiveIntegerField(null=True, blank=True, help_text="Annual income limit in rupees")
    occupations = models.CharField(max_length=200, blank=True, help_text="Comma separated. Blank = any")
    gender = models.CharField(max_length=10, choices=Gender.choices, default=Gender.ANY)
    last_date = models.DateField(null=True, blank=True)
    official_link = models.URLField(default="https://www.myscheme.gov.in/")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    def occupation_list(self):
        return [o.strip() for o in self.occupations.split(",") if o.strip()]

    def matches(self, profile):
        """Sirf wahi criteria check hote hain jo user ne diye hain."""
        age = profile.get("age")
        income = profile.get("annual_income")
        occupation = profile.get("occupation")
        gender = profile.get("gender")

        if age is not None:
            if self.min_age is not None and age < self.min_age:
                return False
            if self.max_age is not None and age > self.max_age:
                return False
        if income is not None and self.max_income is not None and income > self.max_income:
            return False
        if occupation and self.occupations and occupation not in self.occupation_list():
            return False
        if gender and self.gender != "any" and gender != self.gender:
            return False
        return True


class Bookmark(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="bookmarks")
    scheme = models.ForeignKey(Scheme, on_delete=models.CASCADE, related_name="bookmarks")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "scheme")


class Announcement(models.Model):
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class Office(models.Model):
    name = models.CharField(max_length=200)
    department = models.CharField(max_length=100, blank=True)
    address = models.CharField(max_length=300)
    district = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=30, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    def __str__(self):
        return self.name


class Notification(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    message = models.CharField(max_length=255)
    link = models.CharField(max_length=100, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]