from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema, inline_serializer, OpenApiParameter
from rest_framework import serializers

from .scrapers.hd import scraper


@extend_schema(
    parameters=[OpenApiParameter("sku", str, required=True)],
    responses=inline_serializer(
        "ScraperPriceResponse",
        fields={
            "price": serializers.CharField(),
            "image": serializers.CharField(allow_null=True),
            "sku": serializers.CharField(),
            "error": serializers.CharField(required=False),
        },
    )
)
@api_view(["GET"])
def get_scraper_price(request, scraper_id):
    """/scrape/<str:scraper_id>/?sku=..."""
    sku = request.query_params.get("sku")
    if not scraper_id or not sku:
        return Response(
            {"error": "Missing scraperId or sku parameter"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    data = scraper.get_product_data(sku)
    return Response(data)
