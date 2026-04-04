from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.parsers import FormParser, MultiPartParser
from djangorestframework_camel_case.parser import CamelCaseJSONParser
from djangorestframework_camel_case.render import CamelCaseJSONRenderer
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers
from django.core.files.storage import default_storage
import os

from core.models import Configuration
from jobs.viewsets import _get_or_create_draft
from .serializers import SettingsSerializer


class SettingsViewSet(viewsets.ViewSet):
    parser_classes = [CamelCaseJSONParser, FormParser, MultiPartParser]
    renderer_classes = [CamelCaseJSONRenderer]

    @extend_schema(
        responses={200: inline_serializer(
            "SettingsResponse",
            fields={
                "tax_rate": serializers.FloatField(),
                "materials_view_mode": serializers.CharField(),
                "accent_color": serializers.CharField(),
                "company_logo_url": serializers.CharField(allow_null=True),
                "default_export_format": serializers.CharField(),
                "default_export_show_labor_details": serializers.BooleanField(),
                "default_export_unify_groups": serializers.BooleanField(),
            },
        )}
    )
    def retrieve(self, request):
        configs = {c.key: c.value for c in Configuration.objects.all()}
        _get_or_create_draft()

        logo_path = configs.get("company_logo_url")
        company_logo_url = None
        if logo_path and default_storage.exists(logo_path):
            company_logo_url = default_storage.url(logo_path)

        return Response(
            {
                "tax_rate": float(configs.get("tax_rate", "0")),
                "materials_view_mode": configs.get("materials_view_mode", "grid"),
                "accent_color": configs.get("accent_color", "#4f46e5"),
                "company_logo_url": company_logo_url,
                "default_export_format": configs.get(
                    "default_export_format", "excel"
                ),
                "default_export_show_labor_details": configs.get(
                    "default_export_show_labor_details", "false"
                ).lower()
                == "true",
                "default_export_unify_groups": configs.get(
                    "default_export_unify_groups", "false"
                ).lower()
                == "true",
            }
        )

    @extend_schema(request=SettingsSerializer, responses={204: None})
    def save_settings(self, request):
        serializer = SettingsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        setting_keys = {
            "tax_rate": str,
            "materials_view_mode": str,
            "accent_color": str,
            "default_export_format": str,
            "default_export_show_labor_details": lambda v: str(v).lower(),
            "default_export_unify_groups": lambda v: str(v).lower(),
        }

        for key, transform in setting_keys.items():
            if key in data:
                Configuration.objects.update_or_create(
                    key=key, defaults={"value": transform(data[key])}
                )

        return Response(status=status.HTTP_204_NO_CONTENT)

    @extend_schema(
        request={"multipart/form-data": {"type": "object", "properties": {"logo": {"type": "string", "format": "binary"}}}},
        responses=inline_serializer("CompanyLogoResponse", fields={"company_logo_url": serializers.CharField()}),
    )
    def upload_logo(self, request):
        upload = request.FILES.get("logo")
        if not upload:
            return Response(
                {"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST
            )

        config = Configuration.objects.filter(key="company_logo_url").first()
        if config and config.value and default_storage.exists(config.value):
            default_storage.delete(config.value)

        extension = os.path.splitext(upload.name)[1] or ".png"
        filename = f"logo{extension}"
        stored_path = default_storage.save(filename, upload)

        Configuration.objects.update_or_create(
            key="company_logo_url", defaults={"value": stored_path}
        )

        return Response({"company_logo_url": default_storage.url(stored_path)})

    @extend_schema(responses={204: None})
    def delete_logo(self, request):
        config = Configuration.objects.filter(key="company_logo_url").first()
        if config and config.value:
            if default_storage.exists(config.value):
                default_storage.delete(config.value)
            config.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
