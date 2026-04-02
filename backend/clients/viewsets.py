from rest_framework import viewsets, status
from rest_framework.response import Response
from django.db.models.deletion import ProtectedError
from django.db import IntegrityError

from .models import Client
from .serializers import ClientSerializer


class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {"error": "Cannot delete client because it is referenced by one or more jobs."},
                status=status.HTTP_409_CONFLICT,
            )
        except IntegrityError:
            return Response(
                {"error": "Cannot delete client because it is referenced by one or more jobs."},
                status=status.HTTP_409_CONFLICT,
            )
