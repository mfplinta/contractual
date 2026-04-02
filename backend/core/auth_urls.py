from django.urls import path
from .auth_views import LoginView, LogoutView, PasswordChangeView, UserView, CSRFView

urlpatterns = [
    path('csrf/', CSRFView.as_view(), name='auth-csrf'),
    path('login/', LoginView.as_view(), name='auth-login'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('password/change/', PasswordChangeView.as_view(), name='auth-password-change'),
    path('user/', UserView.as_view(), name='auth-user'),
]
