from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import viewsets

router = DefaultRouter()
router.register(r'clients', viewsets.ClientViewSet, basename='client')

urlpatterns = [
    path('', include(router.urls)),
]
