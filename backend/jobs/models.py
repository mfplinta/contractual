from django.db import models


class Job(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        SAVED = "saved", "Saved"

    id = models.AutoField(primary_key=True)
    client = models.ForeignKey(
        "clients.Client", on_delete=models.PROTECT, related_name="jobs", blank=True, null=True
    )
    description = models.TextField()
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.DRAFT
    )
    created_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(null=True, blank=True)
    tax_rate = models.DecimalField(max_digits=6, decimal_places=4, default=0)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def recalculate_totals(self):
        from django.db.models import Sum

        agg = self.groups.aggregate(
            sub=Sum("subtotal"), tax=Sum("tax_total"), tot=Sum("total")
        )
        self.subtotal = agg["sub"] or 0
        self.tax_total = agg["tax"] or 0
        self.total = agg["tot"] or 0

    class Meta:
        db_table = 'api_job'


class JobGroup(models.Model):
    id = models.AutoField(primary_key=True)
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name="groups")
    name = models.CharField(max_length=255, null=True, blank=True)
    sort_order = models.IntegerField(default=0)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    labor_time_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    labor_cost_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    class Meta:
        db_table = 'api_jobgroup'
        ordering = ["sort_order", "id"]

    def recalculate_totals(self):
        from django.db.models import Sum

        agg = self.group_materials.filter(ignored=False).aggregate(
            tot=Sum("total_price"), tax=Sum("tax")
        )
        self.total = agg["tot"] or 0
        self.tax_total = agg["tax"] or 0
        self.subtotal = self.total - self.tax_total

        labor_agg = self.group_labor.aggregate(time=Sum("time"), cost=Sum("cost"))
        self.labor_time_total = labor_agg["time"] or 0
        self.labor_cost_total = labor_agg["cost"] or 0
    
    def __str__(self) -> str:
        return f"Group '{self.name if self.name else 'Unnamed'}' for job '{self.job.description[:30]}'"


class JobMaterial(models.Model):
    id = models.AutoField(primary_key=True)
    group = models.ForeignKey(
        JobGroup, on_delete=models.CASCADE, related_name="group_materials"
    )
    variant = models.ForeignKey(
        "materials.MaterialVariant", on_delete=models.PROTECT, related_name="job_materials"
    )
    store = models.ForeignKey(
        "core.Store",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="job_materials",
    )
    quantity = models.DecimalField(max_digits=10, decimal_places=4)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    notes = models.TextField(null=True, blank=True)
    was_price_edited = models.BooleanField(default=False)
    ignored = models.BooleanField(default=False)
    unit = models.CharField(max_length=100, null=True, blank=True)
    sort_order = models.IntegerField(default=0)

    class Meta:
        db_table = 'api_jobmaterial'
        ordering = ["sort_order", "id"]


class JobLabor(models.Model):
    id = models.AutoField(primary_key=True)
    group = models.ForeignKey(
        JobGroup, on_delete=models.CASCADE, related_name="group_labor"
    )
    description = models.TextField(default="")
    time = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    class Meta:
        db_table = 'api_joblabor'
