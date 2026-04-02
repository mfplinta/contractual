from django.contrib import admin
from .models import Material, MaterialVariant, MaterialImage


@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    list_display = ('id', 'description')
    search_fields = ('description',)


@admin.register(MaterialVariant)
class MaterialVariantAdmin(admin.ModelAdmin):
    list_display = ('id', 'material', 'name', 'unit')
    list_filter = ('unit',)


@admin.register(MaterialImage)
class MaterialImageAdmin(admin.ModelAdmin):
    list_display = ('id', 'material', 'variant', 'store', 'image')
