from django.contrib import admin
from .models import Job, JobMaterial


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ('id', 'client', 'description', 'created_at', 'updated_at')


@admin.register(JobMaterial)
class JobMaterialAdmin(admin.ModelAdmin):
    list_display = ('id', 'group', 'variant', 'quantity', 'unit_price', 'total_price')
