from dj_rest_auth.views import (
    LoginView as DJLoginView,
    LogoutView as DJLogoutView,
    PasswordChangeView as DJPasswordChangeView,
    UserDetailsView as DJUserDetailsView,
)
from dj_rest_auth.serializers import UserDetailsSerializer
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from django.middleware.csrf import get_token


class UserSerializer(UserDetailsSerializer):
    class Meta(UserDetailsSerializer.Meta):
        fields = ('pk', 'username', 'first_name', 'last_name')
        read_only_fields = ('pk',)


class CSRFView(APIView):
    """Return a CSRF token so the SPA can make POST requests."""
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        return Response({'csrfToken': get_token(request)})


class LoginView(DJLoginView):
    permission_classes = [AllowAny]
    authentication_classes = []


class LogoutView(DJLogoutView):
    permission_classes = [IsAuthenticated]


class PasswordChangeView(DJPasswordChangeView):
    permission_classes = [IsAuthenticated]


class UserView(DJUserDetailsView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer
