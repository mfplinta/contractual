from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field

from core.models import Store
from core.serializers import GetOrCreateSlugRelatedField, StoreSerializer
from clients.models import Client
from clients.serializers import ClientSerializer
from materials.models import MaterialVariant, MaterialImage
from materials.serializers import MaterialImageSerializer, StoreNestedSerializer
from .models import Job, JobGroup, JobMaterial, JobLabor


class JobSerializer(serializers.ModelSerializer):
    client_id = serializers.PrimaryKeyRelatedField(
        queryset=Client.objects.all(), source="client", write_only=True, required=False
    )
    client_name = GetOrCreateSlugRelatedField(
        source="client",
        queryset=Client.objects.all(),
        slug_field="name",
        write_only=True,
        required=False,
    )
    client = ClientSerializer(read_only=True)
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    tax_total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Job
        fields = [
            "id",
            "client_id",
            "client_name",
            "client",
            "description",
            "created_at",
            "updated_at",
            "status",
            "tax_rate",
            "subtotal",
            "tax_total",
            "total",
        ]


class JobMaterialSerializer(serializers.ModelSerializer):
    variant_id = serializers.PrimaryKeyRelatedField(
        queryset=MaterialVariant.objects.all(),
        source="variant",
        required=True,
    )
    store_id = serializers.PrimaryKeyRelatedField(
        queryset=Store.objects.all(),
        source="store",
        required=True,
        allow_null=False,
    )
    quantity = serializers.DecimalField(max_digits=10, decimal_places=4, required=False)
    description = serializers.SerializerMethodField(read_only=True)
    price_info = serializers.SerializerMethodField(read_only=True)
    images = serializers.SerializerMethodField(read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request") if hasattr(self, "context") else None
        if request and request.method == "POST":
            for field_name in ["unit_price", "tax", "total_price"]:
                field = self.fields.get(field_name)
                if field is not None:
                    field.read_only = True
                    field.required = False

    class Meta:
        model = JobMaterial
        fields = [
            "id",
            "group_id",
            "variant_id",
            "store_id",
            "description",
            "price_info",
            "images",
            "quantity",
            "unit_price",
            "total_price",
            "subtotal",
            "tax",
            "notes",
            "was_price_edited",
            "ignored",
            "unit",
            "sort_order",
        ]
        read_only_fields = ["id"]

    @extend_schema_field(StoreNestedSerializer(allow_null=True))
    def get_price_info(self, obj):
        if not obj.variant_id or not obj.store_id:
            return None
        variant = obj.variant
        if variant.source_variant_id:
            source = variant.source_variant
            price = source.stores.filter(store_id=obj.store_id).first()
            if not price:
                return None
            data = StoreNestedSerializer(price).data
            from decimal import Decimal, ROUND_HALF_UP
            divisor = variant.divisor or Decimal("1")
            original = Decimal(str(data["price"]))
            data["price"] = str(
                (original / divisor).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            )
            return data
        price = variant.stores.filter(store_id=obj.store_id).first()
        if not price:
            return None
        return StoreNestedSerializer(price).data

    @extend_schema_field(serializers.CharField())
    def get_description(self, obj):
        if not obj.variant:
            return ""
        variant = obj.variant
        mat_desc = variant.material.description
        if variant.source_variant_id:
            source_name = variant.source_variant.name or ""
            if source_name:
                return f"{source_name} - {mat_desc}"
            return mat_desc
        if not variant.name:
            return mat_desc
        return f"{variant.name} - {mat_desc}"

    @extend_schema_field(MaterialImageSerializer(many=True))
    def get_images(self, obj):
        if not obj.variant:
            return []

        variant = obj.variant
        image_variant = variant.source_variant if variant.source_variant_id else variant

        images = []
        images.extend(
            [
                img
                for img in image_variant.material.images.all()
                if img.variant_id is None
            ]
        )
        images.extend(
            [img for img in image_variant.images.all() if img.store_id is None]
        )

        if obj.store_id:
            images.extend(
                [
                    img
                    for img in obj.store.images.all()
                    if img.variant_id == image_variant.id
                ]
            )

        deduped = list(dict.fromkeys(images))
        return MaterialImageSerializer(deduped, many=True).data


class JobGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobGroup
        fields = [
            "id",
            "job_id",
            "name",
            "sort_order",
            "subtotal",
            "tax_total",
            "total",
            "labor_time_total",
            "labor_cost_total",
        ]
        read_only_fields = [
            "id",
            "subtotal",
            "tax_total",
            "total",
            "labor_time_total",
            "labor_cost_total",
        ]


class JobLaborSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobLabor
        fields = ["id", "group_id", "description", "time", "cost"]
        read_only_fields = ["id"]
