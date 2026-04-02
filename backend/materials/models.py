from django.db import models


class NonProxyVariantManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(source_variant__isnull=True)


class Material(models.Model):
    id = models.AutoField(primary_key=True)
    description = models.CharField(max_length=512)
    tags = models.ManyToManyField("core.Tag", related_name="materials", blank=True)

    class Meta:
        db_table = 'api_material'

    def __str__(self) -> str:
        return self.description


class MaterialVariant(models.Model):
    id = models.AutoField(primary_key=True)
    material = models.ForeignKey(
        Material, on_delete=models.CASCADE, related_name="variants"
    )
    name = models.CharField(max_length=255, null=True, blank=True, default=None)
    unit = models.ForeignKey("core.Unit", on_delete=models.PROTECT, related_name="variants")
    source_variant = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="proxy_variants",
    )
    divisor = models.DecimalField(
        max_digits=10, decimal_places=4, null=True, blank=True
    )

    objects = models.Manager()
    non_proxy = NonProxyVariantManager()

    class Meta:
        db_table = 'api_materialvariant'

    def __str__(self) -> str:
        return f"'{self.name if self.name else 'Standard'}' for material '{self.material.description}'"


class PriceInfo(models.Model):
    id = models.AutoField(primary_key=True)
    store = models.ForeignKey("core.Store", on_delete=models.CASCADE, related_name="stores")
    variant = models.ForeignKey(
        MaterialVariant, on_delete=models.CASCADE, related_name="stores"
    )
    price = models.DecimalField(max_digits=10, decimal_places=2)
    sku = models.CharField(max_length=255, blank=True, default="")
    price_from_api = models.BooleanField(default=False)

    class Meta:
        db_table = 'api_priceinfo'
        constraints = [
            models.UniqueConstraint(
                fields=["store", "variant"], name="unique_store_variant_price"
            )
        ]


class RelatedMaterial(models.Model):
    pk = models.CompositePrimaryKey("material1_id", "material2_id")
    material1 = models.ForeignKey(
        Material, on_delete=models.CASCADE, related_name="related_from"
    )
    material2 = models.ForeignKey(
        Material, on_delete=models.CASCADE, related_name="related_to"
    )

    class Meta:
        db_table = 'api_relatedmaterial'


class MaterialImage(models.Model):
    id = models.AutoField(primary_key=True)
    material = models.ForeignKey(
        Material, on_delete=models.CASCADE, null=True, blank=True, related_name="images"
    )
    variant = models.ForeignKey(
        MaterialVariant,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="images",
    )
    store = models.ForeignKey(
        "core.Store", on_delete=models.CASCADE, null=True, blank=True, related_name="images"
    )
    image = models.ImageField(upload_to="materials/")

    class Meta:
        db_table = 'api_materialimage'
        constraints = [
            models.CheckConstraint(
                condition=(
                    models.Q(material__isnull=False, variant__isnull=True)
                    | models.Q(material__isnull=True, variant__isnull=False)
                ),
                name="material_or_variant_not_null",
            )
        ]
