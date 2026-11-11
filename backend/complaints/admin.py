from django.contrib import admin
from .models import Category, Complaint, ComplaintUpdate

admin.site.register(Category)
admin.site.register(Complaint)
admin.site.register(ComplaintUpdate)