from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status, serializers
from drf_spectacular.utils import extend_schema, inline_serializer
from django.http import HttpResponse as DjangoHttpResponse
import requests as http_requests


@extend_schema(exclude=True)
@api_view(["GET"])
def proxy_image(request):
    """/proxy-image/?url=..."""
    url = request.query_params.get("url")
    if not url:
        return Response(
            {"error": "Missing url parameter"}, status=status.HTTP_400_BAD_REQUEST
        )
    try:
        resp = http_requests.get(
            url,
            timeout=15,
            stream=True,
            headers={
                "User-Agent": "Mozilla/5.0",
            },
        )
        resp.raise_for_status()
        content_type = resp.headers.get("Content-Type", "application/octet-stream")

        return DjangoHttpResponse(
            resp.content,
            content_type=content_type,
            status=resp.status_code,
        )
    except Exception as exc:
        return Response({"error": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)


@extend_schema(
    responses=inline_serializer("SystemInfoResponse", fields={"has_libre_office": serializers.BooleanField()})
)
@api_view(["GET"])
def system_info(request):
    """/system/"""
    import shutil

    has_libreoffice = (
        shutil.which("soffice") is not None or shutil.which("libreoffice") is not None
    )
    return Response(
        {
            "has_libre_office": has_libreoffice,
        }
    )
