from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import viewsets

router = DefaultRouter()
router.register(r'jobs', viewsets.JobViewSet, basename='job')

urlpatterns = [
    path('', include(router.urls)),
    path('jobs/<str:job_pk>/groups/', viewsets.JobGroupViewSet.as_view({'post': 'create'}), name='job-group-list'),
    path('jobs/<str:job_pk>/groups/<int:pk>/', viewsets.JobGroupViewSet.as_view({'patch': 'partial_update', 'delete': 'destroy'}), name='job-group-detail'),
    path('jobs/<str:job_pk>/groups/<int:group_pk>/materials/', viewsets.JobMaterialViewSet.as_view({'post': 'create'}), name='job-material-list'),
    path('jobs/<str:job_pk>/groups/<int:group_pk>/materials/<int:pk>/', viewsets.JobMaterialViewSet.as_view({'patch': 'partial_update', 'delete': 'destroy'}), name='job-material-detail'),
    path('jobs/<str:job_pk>/groups/<int:group_pk>/labor/', viewsets.JobLaborViewSet.as_view({'post': 'create'}), name='labor-item-list'),
    path('jobs/<str:job_pk>/groups/<int:group_pk>/labor/<int:pk>/', viewsets.JobLaborViewSet.as_view({'patch': 'partial_update', 'delete': 'destroy'}), name='labor-item-detail'),
]
