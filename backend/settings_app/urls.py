from django.urls import path
from . import viewsets
from . import views

urlpatterns = [
    path('settings/', viewsets.SettingsViewSet.as_view({'get': 'retrieve', 'put': 'save_settings'}), name='settings'),
    path('settings/companyLogo/', viewsets.SettingsViewSet.as_view({'put': 'upload_logo', 'delete': 'delete_logo'}), name='company-logo'),
    path('proxy-image/', views.proxy_image, name='proxy-image'),
    path('system/', views.system_info, name='system-info'),
]
