from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import viewsets
from . import views

router = DefaultRouter()
router.register(r'materials', viewsets.MaterialViewSet, basename='material')

urlpatterns = [
    path('', include(router.urls)),
    path('scrape/<str:scraper_id>/', views.get_scraper_price, name='scraper-price'),
]
