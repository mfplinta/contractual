from rest_framework import serializers
from drf_writable_nested.serializers import WritableNestedModelSerializer
from drf_spectacular.utils import extend_schema_field

from core.models import Store, Unit, Tag
from core.serializers import StoreSerializer, GetOrCreateSlugRelatedField
from .models import Material, MaterialVariant, PriceInfo, MaterialImage


class MaterialImageSerializer(serializers.ModelSerializer):

    class Meta:
        model = MaterialImage
        fields = ["id", "material_id", "variant_id", "store_id", "image"]


class StoreNestedSerializer(serializers.ModelSerializer):
    store_id = serializers.PrimaryKeyRelatedField(
        queryset=Store.objects.all(), source="store", write_only=True, required=False
    )
    store_name = GetOrCreateSlugRelatedField(
        source="store",
        queryset=Store.objects.all(),
        slug_field="name",
        write_only=True,
        required=False,
    )
    store = StoreSerializer(read_only=True)
    images = MaterialImageSerializer(many=True, read_only=True)
    sku = serializers.CharField(allow_blank=True, required=False)

    def validate(self, data):
        if "store" not in data:
            raise serializers.ValidationError(
                "Either store_id or store_name is required."
            )
        return data

    class Meta:
        model = PriceInfo
        fields = [
            "id",
            "store_id",
            "store_name",
            "store",
            "sku",
            "price",
            "price_from_api",
            "images",
        ]


class ProxyVariantWriteSerializer(serializers.Serializer):
    id = serializers.IntegerField(required=False)
    unit = serializers.CharField(required=True)
    divisor = serializers.DecimalField(max_digits=10, decimal_places=4, required=True)


class MaterialVariantNestedSerializer(WritableNestedModelSerializer):
    name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    stores = StoreNestedSerializer(many=True)
    unit = GetOrCreateSlugRelatedField(queryset=Unit.objects.all(), slug_field="name")
    images = MaterialImageSerializer(many=True, read_only=True)
    is_proxy = serializers.SerializerMethodField(read_only=True)
    source_variant_id = serializers.SerializerMethodField(read_only=True)
    divisor = serializers.DecimalField(
        max_digits=10, decimal_places=4, read_only=True, allow_null=True
    )
    proxy_variants = ProxyVariantWriteSerializer(many=True, required=False, write_only=True)

    @extend_schema_field(serializers.BooleanField())
    def get_is_proxy(self, obj):
        return obj.source_variant_id is not None

    @extend_schema_field(serializers.IntegerField(allow_null=True))
    def get_source_variant_id(self, obj):
        return obj.source_variant_id

    def validate_name(self, value):
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None

    def create(self, validated_data):
        validated_data.pop("proxy_variants", None)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data.pop("proxy_variants", None)
        return super().update(instance, validated_data)

    class Meta:
        model = MaterialVariant
        fields = [
            "id",
            "name",
            "unit",
            "stores",
            "images",
            "is_proxy",
            "source_variant_id",
            "divisor",
            "proxy_variants",
        ]


class MaterialNestedSerializer(WritableNestedModelSerializer):
    variants = MaterialVariantNestedSerializer(many=True)
    tags = GetOrCreateSlugRelatedField(
        queryset=Tag.objects.all(), slug_field="name", many=True
    )
    images = MaterialImageSerializer(many=True, read_only=True)

    class Meta:
        model = Material
        fields = ["id", "description", "variants", "tags", "images"]

    def delete_reverse_relations_if_need(self, instance, reverse_relations):
        """Override to protect proxy variants from deletion by drf-writable-nested."""
        from collections import OrderedDict
        from django.contrib.contenttypes.fields import GenericRelation
        from django.db.models import ProtectedError

        reverse_relations = OrderedDict(
            reversed(list(reverse_relations.items()))
        )

        for field_name, (related_field, field, field_source) in reverse_relations.items():
            model_class = field.Meta.model
            related_data = self.get_initial()[field_name]

            if related_field.one_to_one:
                related_data = [related_data]

            if related_field.many_to_many:
                related_field_lookup = {
                    related_field.remote_field.name: instance,
                }
            elif isinstance(related_field, GenericRelation):
                related_field_lookup = self._get_generic_lookup(
                    instance, related_field
                )
            else:
                related_field_lookup = {
                    related_field.name: instance,
                }

            current_ids = self._extract_related_pks(field, related_data)

            try:
                qs = model_class.objects.filter(**related_field_lookup).exclude(
                    pk__in=current_ids
                )
                if model_class is MaterialVariant:
                    qs = qs.filter(source_variant__isnull=True)

                pks_to_delete = list(qs.values_list("pk", flat=True))
                self.perform_nested_delete_or_update(
                    pks_to_delete,
                    model_class,
                    instance,
                    related_field,
                    field_source,
                )
            except ProtectedError as e:
                instances = e.args[1]
                self.fail(
                    "cannot_delete_protected",
                    instances=", ".join(
                        [str(inst) for inst in instances]
                    ),
                )

    def _save_proxy_variants(self, material, variants_data, saved_variants):
        all_proxy_ids_to_keep = set()
        for idx, variant_data in enumerate(variants_data):
            proxy_list = variant_data.pop("proxy_variants", [])
            if idx >= len(saved_variants):
                continue
            source_variant = saved_variants[idx]
            for proxy_data in proxy_list:
                proxy_id = proxy_data.get("id")
                unit_name = proxy_data["unit"]
                divisor = proxy_data["divisor"]
                unit_obj, _ = Unit.objects.get_or_create(name=unit_name)
                if proxy_id:
                    try:
                        proxy = MaterialVariant.objects.get(
                            pk=proxy_id,
                            source_variant=source_variant,
                            material=material,
                        )
                        proxy.unit = unit_obj
                        proxy.divisor = divisor
                        proxy.save(update_fields=["unit", "divisor"])
                        all_proxy_ids_to_keep.add(proxy.pk)
                    except MaterialVariant.DoesNotExist:
                        proxy = MaterialVariant.objects.create(
                            material=material,
                            source_variant=source_variant,
                            unit=unit_obj,
                            divisor=divisor,
                        )
                        all_proxy_ids_to_keep.add(proxy.pk)
                else:
                    proxy = MaterialVariant.objects.create(
                        material=material,
                        source_variant=source_variant,
                        unit=unit_obj,
                        divisor=divisor,
                    )
                    all_proxy_ids_to_keep.add(proxy.pk)

        MaterialVariant.objects.filter(
            material=material,
            source_variant__isnull=False,
        ).exclude(pk__in=all_proxy_ids_to_keep).delete()

    def create(self, validated_data):
        variants_data = validated_data.get("variants", [])
        proxy_map = []
        for v in variants_data:
            proxy_map.append(v.pop("proxy_variants", []))

        instance = super().create(validated_data)

        saved_variants = list(
            instance.variants.filter(source_variant__isnull=True).order_by("id")
        )
        for idx, proxy_list in enumerate(proxy_map):
            if idx >= len(saved_variants):
                break
            source_variant = saved_variants[idx]
            for proxy_data in proxy_list:
                unit_name = proxy_data["unit"]
                divisor = proxy_data["divisor"]
                unit_obj, _ = Unit.objects.get_or_create(name=unit_name)
                MaterialVariant.objects.create(
                    material=instance,
                    source_variant=source_variant,
                    unit=unit_obj,
                    divisor=divisor,
                )
        return instance

    def update(self, instance, validated_data):
        variants_data = validated_data.get("variants", [])
        proxy_map = []
        for v in variants_data:
            proxy_map.append(v.pop("proxy_variants", []))

        instance = super().update(instance, validated_data)

        saved_variants = list(
            instance.variants.filter(source_variant__isnull=True).order_by("id")
        )
        all_proxy_ids_to_keep = set()
        for idx, proxy_list in enumerate(proxy_map):
            if idx >= len(saved_variants):
                break
            source_variant = saved_variants[idx]
            for proxy_data in proxy_list:
                proxy_id = proxy_data.get("id")
                unit_name = proxy_data["unit"]
                divisor = proxy_data["divisor"]
                unit_obj, _ = Unit.objects.get_or_create(name=unit_name)
                if proxy_id:
                    try:
                        proxy = MaterialVariant.objects.get(
                            pk=proxy_id,
                            source_variant=source_variant,
                            material=instance,
                        )
                        proxy.unit = unit_obj
                        proxy.divisor = divisor
                        proxy.save(update_fields=["unit", "divisor"])
                        all_proxy_ids_to_keep.add(proxy.pk)
                    except MaterialVariant.DoesNotExist:
                        proxy = MaterialVariant.objects.create(
                            material=instance,
                            source_variant=source_variant,
                            unit=unit_obj,
                            divisor=divisor,
                        )
                        all_proxy_ids_to_keep.add(proxy.pk)
                else:
                    proxy = MaterialVariant.objects.create(
                        material=instance,
                        source_variant=source_variant,
                        unit=unit_obj,
                        divisor=divisor,
                    )
                    all_proxy_ids_to_keep.add(proxy.pk)

        MaterialVariant.objects.filter(
            material=instance,
            source_variant__isnull=False,
        ).exclude(pk__in=all_proxy_ids_to_keep).delete()

        return instance

    def to_representation(self, instance):
        data = super().to_representation(instance)
        real_variants = [v for v in data.get("variants", []) if not v.get("is_proxy")]
        proxy_variants_qs = MaterialVariant.objects.filter(
            material=instance,
            source_variant__isnull=False,
        ).select_related("unit", "source_variant")

        source_data_map = {}
        for v in real_variants:
            source_data_map[v["id"]] = v

        from decimal import Decimal, ROUND_HALF_UP

        proxy_representations = []
        for proxy in proxy_variants_qs:
            source_id = proxy.source_variant_id
            source = source_data_map.get(source_id)
            if not source:
                continue
            divisor = proxy.divisor or Decimal("1")

            source_name = source.get("name") or ""
            unit_name = proxy.unit.name
            display_name = source_name

            computed_stores = []
            for store_info in source.get("stores", []):
                original_price = Decimal(str(store_info["price"]))
                divided_price = (original_price / divisor).quantize(
                    Decimal("0.01"), rounding=ROUND_HALF_UP
                )
                computed_stores.append({
                    **store_info,
                    "price": str(divided_price),
                })

            proxy_representations.append({
                "id": proxy.id,
                "name": display_name,
                "unit": unit_name,
                "stores": computed_stores,
                "images": source.get("images", []),
                "is_proxy": True,
                "source_variant_id": source_id,
                "divisor": str(proxy.divisor),
            })

        final_variants = []
        for v in real_variants:
            final_variants.append(v)
            for pv in proxy_representations:
                if pv["source_variant_id"] == v["id"]:
                    final_variants.append(pv)

        data["variants"] = final_variants
        return data
