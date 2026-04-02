from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.parsers import FormParser, MultiPartParser
from djangorestframework_camel_case.parser import CamelCaseJSONParser
from djangorestframework_camel_case.render import CamelCaseJSONRenderer
from django.db.models.deletion import ProtectedError
from django.db import IntegrityError

from .models import Material
from .serializers import MaterialNestedSerializer
from .mixins import MaterialImageMixin


class MaterialViewSet(MaterialImageMixin, viewsets.ModelViewSet):
    queryset = Material.objects.all().prefetch_related(
        "variants__stores__store__images",
        "variants__images",
        "variants__stores",
        "variants__unit",
        "variants__source_variant__unit",
        "variants__proxy_variants__unit",
        "tags",
        "images",
    )
    serializer_class = MaterialNestedSerializer
    parser_classes = [CamelCaseJSONParser, FormParser, MultiPartParser]
    renderer_classes = [CamelCaseJSONRenderer]

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {"error": "Cannot delete material because it is referenced by other records."},
                status=status.HTTP_409_CONFLICT,
            )
        except IntegrityError:
            return Response(
                {"error": "Cannot delete material because it is referenced by other records."},
                status=status.HTTP_409_CONFLICT,
            )

    def create(self, request, *args, **kwargs):
        payload = self._material_payload(request)
        serializer = self.get_serializer(data=payload)
        serializer.is_valid(raise_exception=True)
        material = serializer.save()

        if request.FILES:
            self._attach_images_to_material(material, request.FILES)

        material = self.get_queryset().get(pk=material.pk)
        return Response(
            self.get_serializer(material).data,
            status=status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        payload = self._material_payload(request)
        serializer = self.get_serializer(instance, data=payload, partial=partial)
        serializer.is_valid(raise_exception=True)
        material = serializer.save()

        for key in self._deleted_image_keys(request):
            self._remove_image_by_key(material, key)

        if request.FILES:
            self._attach_images_to_material(material, request.FILES, replace_existing=True)

        material = self.get_queryset().get(pk=material.pk)
        return Response(self.get_serializer(material).data)

    def partial_update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)
