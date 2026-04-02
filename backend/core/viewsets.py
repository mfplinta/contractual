from rest_framework import viewsets, status
from rest_framework.response import Response
from django.db.models.deletion import ProtectedError
from django.db import IntegrityError

from .models import Store, Unit, Tag
from .serializers import StoreSerializer, UnitSerializer, TagSerializer


class StoreViewSet(viewsets.ModelViewSet):
    queryset = Store.objects.all()
    serializer_class = StoreSerializer

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {"error": "Cannot delete store because it is referenced by other records."},
                status=status.HTTP_409_CONFLICT,
            )
        except IntegrityError:
            return Response(
                {"error": "Cannot delete store because it is referenced by other records."},
                status=status.HTTP_409_CONFLICT,
            )


class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer


class UnitViewSet(viewsets.ModelViewSet):
    queryset = Unit.objects.all()
    serializer_class = UnitSerializer
