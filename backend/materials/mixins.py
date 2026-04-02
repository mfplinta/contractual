import os
import re
import json

from .models import MaterialImage, MaterialVariant


class MaterialImageMixin:
    """Mixin providing image upload/delete/attach logic for materials."""

    def _snake_case_keys(self, value):
        if isinstance(value, list):
            return [self._snake_case_keys(item) for item in value]
        if not isinstance(value, dict):
            return value

        converted = {}
        for key, item in value.items():
            snake_key = re.sub(r"(?<!^)(?=[A-Z])", "_", key).lower()
            converted[snake_key] = self._snake_case_keys(item)
        return converted

    def _material_payload(self, request):
        raw_payload = request.data.get("materialNested") or request.data.get("material_nested")
        if raw_payload:
            if isinstance(raw_payload, str):
                return self._snake_case_keys(json.loads(raw_payload))
            return raw_payload
        return request.data

    def _deleted_image_keys(self, request):
        raw = request.data.get("deleteImages") or request.data.get("delete_images")
        if not raw:
            return []
        if isinstance(raw, str):
            try:
                parsed = json.loads(raw)
            except json.JSONDecodeError:
                return []
            return parsed if isinstance(parsed, list) else []
        return raw if isinstance(raw, list) else []

    def _image_by_key(self, material, key):
        material_image = (
            MaterialImage.objects.filter(material=material, variant__isnull=True)
            .order_by("id")
            .first()
        )

        variants = list(material.variants.order_by("id"))

        if key == "image":
            return material_image

        if key.startswith("variant_image_"):
            try:
                variant_idx = int(key.split("_")[2])
            except (IndexError, ValueError):
                return None
            if variant_idx < 0 or variant_idx >= len(variants):
                return None
            variant = variants[variant_idx]
            return (
                MaterialImage.objects.filter(variant=variant, store__isnull=True)
                .order_by("id")
                .first()
            )

        if key.startswith("store_image_"):
            try:
                parts = key.split("_")
                variant_idx = int(parts[2])
                store_idx = int(parts[3])
            except (IndexError, ValueError):
                return None
            if variant_idx < 0 or variant_idx >= len(variants):
                return None
            variant = variants[variant_idx]
            variant_stores = list(variant.stores.select_related("store").order_by("id"))
            if store_idx < 0 or store_idx >= len(variant_stores):
                return None
            store = variant_stores[store_idx].store
            return (
                MaterialImage.objects.filter(variant=variant, store=store)
                .order_by("id")
                .first()
            )

        return None

    def _remove_image_by_key(self, material, key):
        image = self._image_by_key(material, key)
        if not image:
            return
        if image.image:
            image.image.delete(save=False)
        image.delete()

    def _attach_images_to_material(self, material, files, replace_existing=False):
        variants = list(material.variants.order_by("id"))

        for key, upload in files.items():
            if key == "image":
                if replace_existing:
                    self._remove_image_by_key(material, key)
                image = MaterialImage.objects.create(material=material)
            elif key.startswith("variant_image_"):
                try:
                    variant_idx = int(key.split("_")[2])
                except (IndexError, ValueError):
                    continue
                if variant_idx < 0 or variant_idx >= len(variants):
                    continue
                if replace_existing:
                    self._remove_image_by_key(material, key)
                image = MaterialImage.objects.create(variant=variants[variant_idx])
            elif key.startswith("store_image_"):
                try:
                    parts = key.split("_")
                    variant_idx = int(parts[2])
                    store_idx = int(parts[3])
                except (IndexError, ValueError):
                    continue
                if variant_idx < 0 or variant_idx >= len(variants):
                    continue
                variant = variants[variant_idx]
                variant_stores = list(variant.stores.select_related("store").order_by("id"))
                if store_idx < 0 or store_idx >= len(variant_stores):
                    continue
                price_info = variant_stores[store_idx]
                if replace_existing:
                    self._remove_image_by_key(material, key)
                image = MaterialImage.objects.create(
                    variant=variant,
                    store=price_info.store,
                )
            else:
                continue

            extension = os.path.splitext(upload.name)[1] or ".bin"
            image.image.save(f"{image.id}{extension}", upload, save=True)
