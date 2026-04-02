from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import viewsets

router = DefaultRouter()
router.register(r'stores', viewsets.StoreViewSet, basename='store')
router.register(r'tags', viewsets.TagViewSet, basename='tag')
router.register(r'units', viewsets.UnitViewSet, basename='unit')

urlpatterns = [
    path('', include(router.urls)),
]
