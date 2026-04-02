from rest_framework import serializers
from .models import Store, Unit, Tag


class GetOrCreateSlugRelatedField(serializers.SlugRelatedField):
    def to_internal_value(self, data):
        try:
            obj, _ = self.get_queryset().get_or_create(**{self.slug_field: data})
            return obj
        except (TypeError, ValueError):
            self.fail("invalid")


class StoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Store
        fields = ["id", "name", "store_url"]


class UnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Unit
        fields = ["id", "name"]


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name"]
