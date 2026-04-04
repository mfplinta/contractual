from rest_framework import viewsets, status, serializers as drf_serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from djangorestframework_camel_case.parser import CamelCaseJSONParser
from djangorestframework_camel_case.render import CamelCaseJSONRenderer
from drf_spectacular.utils import extend_schema, inline_serializer, OpenApiParameter
from django.db import transaction, models
from django.shortcuts import get_object_or_404
from django.core.serializers.json import DjangoJSONEncoder
from django.utils import timezone
import json
import os
from django.http import HttpResponse as DjangoHttpResponse
from decimal import Decimal, ROUND_HALF_UP

from core.models import Configuration
from materials.models import PriceInfo
from .models import Job, JobGroup, JobMaterial, JobLabor
from .serializers import JobSerializer, JobGroupSerializer, JobMaterialSerializer, JobLaborSerializer
from .export.export import build_job_workbook


def _get_or_create_draft():
    draft = Job.objects.filter(status=Job.Status.DRAFT).first()
    if not draft:
        draft = Job.objects.create(status=Job.Status.DRAFT)
    if not JobGroup.objects.filter(job=draft).exists():
        JobGroup.objects.create(job=draft, name=None, sort_order=0)
    return draft


def _resolve_job_reference(job_ref):
    if str(job_ref) in {"draft", "0"}:
        return _get_or_create_draft()
    return get_object_or_404(Job, pk=job_ref)


def _recalculate_group_and_job(group, job):
    group.recalculate_totals()
    group.save()
    job.recalculate_totals()
    job.save(update_fields=["subtotal", "tax_total", "total"])
    if job.status == Job.Status.SAVED:
        job.updated_at = timezone.now()
        job.save(update_fields=["updated_at"])


class JobViewSet(viewsets.ModelViewSet):
    queryset = Job.objects.all().select_related("client").prefetch_related()
    serializer_class = JobSerializer
    parser_classes = [CamelCaseJSONParser]
    renderer_classes = [CamelCaseJSONRenderer]

    def list(self, request, *args, **kwargs):
        queryset = Job.objects.select_related("client").filter(status=Job.Status.SAVED)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="id",
                location=OpenApiParameter.PATH,
                required=True,
                type=str,
                description="Job reference: numeric id or 'draft'.",
            )
        ]
    )
    def retrieve(self, request, *args, **kwargs):
        job = _resolve_job_reference(kwargs.get("pk"))
        return Response(self.get_serializer(job).data)

    @extend_schema(
        responses=inline_serializer(
            "JobCreateResponse",
            fields={
                "job": JobSerializer(),
            },
        )
    )
    def create(self, request, *args, **kwargs):
        draft_job = _get_or_create_draft()

        serializer = self.get_serializer(draft_job, data=request.data)
        serializer.is_valid(raise_exception=True)

        saved_job = serializer.save(
            status=Job.Status.SAVED,
            created_at=timezone.now(),
            updated_at=timezone.now(),
            tax_rate=float(Configuration.objects.filter(key="tax_rate").values_list("value", flat=True).first() or 0)
        )
        _get_or_create_draft()

        return Response({
            "job": JobSerializer(saved_job).data,
        }, status=status.HTTP_201_CREATED)

    @extend_schema(
        request=None,
        responses=inline_serializer("BeginEditResponse", fields={"ok": drf_serializers.BooleanField()}),
    )
    @action(detail=True, methods=["post"], url_path="begin-edit")
    def begin_edit(self, request, pk=None):
        job = get_object_or_404(Job, pk=pk, status=Job.Status.SAVED)
        groups = JobGroup.objects.filter(job=job)
        material_items = JobMaterial.objects.filter(group__job=job)
        labor_items = JobLabor.objects.filter(group__job=job)

        groups_snapshot = JobGroupSerializer(groups, many=True).data
        material_items_snapshot = JobMaterialSerializer(material_items, many=True).data
        labor_items_snapshot = JobLaborSerializer(labor_items, many=True).data
        snapshot = {
            "groups": groups_snapshot,
            "material_items": material_items_snapshot,
            "labor_items": labor_items_snapshot,
        }
        Configuration.objects.update_or_create(
            key=f"edit_snapshot_{pk}",
            defaults={"value": json.dumps(snapshot, cls=DjangoJSONEncoder)},
        )
        return Response({"ok": True})

    @extend_schema(
        request=None,
        responses=inline_serializer("CancelEditResponse", fields={"ok": drf_serializers.BooleanField()}),
    )
    @action(detail=True, methods=["post"], url_path="cancel-edit")
    def cancel_edit(self, request, pk=None):
        job = get_object_or_404(Job, pk=pk, status=Job.Status.SAVED)
        config = Configuration.objects.filter(key=f"edit_snapshot_{pk}").first()
        if not config:
            return Response(
                {"error": "No snapshot found"}, status=status.HTTP_404_NOT_FOUND
            )

        snapshot = json.loads(config.value)

        with transaction.atomic():
            JobMaterial.objects.filter(group__job=job).delete()
            JobLabor.objects.filter(group__job=job).delete()
            JobGroup.objects.filter(job=job).delete()

            groups_data = snapshot.get("groups", [])
            material_data = snapshot.get("material_items", [])
            labor_data = snapshot.get("labor_items", [])

            group_id_map = {}
            for g_data in groups_data:
                group = JobGroup.objects.create(
                    job=job,
                    name=g_data.get("name"),
                    sort_order=g_data.get("sort_order", 0),
                    subtotal=g_data.get("subtotal", 0),
                    tax_total=g_data.get("tax_total", 0),
                    total=g_data.get("total", 0),
                    labor_time_total=g_data.get("labor_time_total", 0),
                    labor_cost_total=g_data.get("labor_cost_total", 0),
                )
                group_id_map[str(g_data["id"])] = group

            for item in material_data:
                group = None
                if item.get("group_id") and str(item["group_id"]) in group_id_map:
                    group = group_id_map[str(item["group_id"])]

                JobMaterial.objects.create(
                    group=group,
                    variant_id=int(item["variant_id"])
                    if item.get("variant_id")
                    else None,
                    store_id=int(item["store_id"])
                    if item.get("store_id")
                    else None,
                    quantity=item["quantity"],
                    unit_price=item["unit_price"],
                    subtotal=item.get("subtotal", 0),
                    total_price=item["total_price"],
                    tax=item.get("tax", 0),
                    notes=item.get("notes") or "",
                    was_price_edited=item.get("was_price_edited", False),
                    unit=item.get("unit") or "",
                    sort_order=item.get("sort_order", 0),
                )

            for item in labor_data:
                group = None
                if item.get("group_id") and str(item["group_id"]) in group_id_map:
                    group = group_id_map[str(item["group_id"])]

                JobLabor.objects.create(
                    group=group,
                    description=item.get("description", ""),
                    time=item.get("time", 0),
                    cost=item.get("cost", 0),
                )

            for group in JobGroup.objects.filter(job=job):
                group.recalculate_totals()
                group.save()
            job.recalculate_totals()
            job.save(update_fields=["subtotal", "tax_total", "total"])

            config.delete()

        return Response({"ok": True})

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="id",
                location=OpenApiParameter.PATH,
                required=True,
                type=str,
                description="Job reference: numeric id or 'draft'.",
            )
        ],
        responses=inline_serializer(
            "JobMaterialsResponse",
            fields={
                "material_items": JobMaterialSerializer(many=True),
                "groups": JobGroupSerializer(many=True),
                "labor_items": JobLaborSerializer(many=True),
            },
        )
    )
    @action(detail=True, methods=["get"])
    def materials(self, request, pk=None):
        job = _resolve_job_reference(pk)
        material_items = (
            JobMaterial.objects.filter(group__job=job)
            .select_related(
                "variant__material",
                "variant__unit",
                "variant__source_variant__unit",
                "variant__source_variant__material",
                "store",
            )
            .prefetch_related(
                "variant__stores",
                "variant__images",
                "variant__source_variant__stores",
                "variant__source_variant__images",
                "variant__material__images",
                "variant__material__tags",
                "store__images",
            )
        )
        groups = JobGroup.objects.filter(job=job)
        labor_items = JobLabor.objects.filter(group__job=job)

        return Response(
            {
                "material_items": JobMaterialSerializer(material_items, many=True).data,
                "groups": JobGroupSerializer(groups, many=True).data,
                "labor_items": JobLaborSerializer(labor_items, many=True).data,
            }
        )

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="id",
                location=OpenApiParameter.PATH,
                required=True,
                type=str,
                description="Job reference: numeric id or 'draft'.",
            )
        ],
        request=inline_serializer(
            "ReorderMaterialRequest",
            fields={
                "item_id": drf_serializers.IntegerField(),
                "target_group_id": drf_serializers.IntegerField(),
                "target_index": drf_serializers.IntegerField(),
            },
        ),
        responses=inline_serializer("ReorderMaterialResponse", fields={"ok": drf_serializers.BooleanField()}),
    )
    @action(detail=True, methods=["post"], url_path="materials/reorder")
    def reorder_material(self, request, pk=None):
        job = _resolve_job_reference(pk)
        item_id = request.data.get("item_id")
        target_group_id = request.data.get("target_group_id")
        target_index = int(request.data.get("target_index", 0))

        if not item_id or not target_group_id:
            return Response(
                {"error": "item_id and target_group_id are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        jm = get_object_or_404(JobMaterial, pk=int(item_id), group__job=job)
        target_group = get_object_or_404(JobGroup, pk=int(target_group_id), job=job)
        source_group = jm.group

        with transaction.atomic():
            source_ids = list(
                JobMaterial.objects.filter(group=source_group)
                .order_by("sort_order", "id")
                .values_list("id", flat=True)
            )
            if jm.id in source_ids:
                source_ids.remove(jm.id)
            for idx, sid in enumerate(source_ids):
                JobMaterial.objects.filter(id=sid).update(sort_order=idx)

            target_ids = list(
                JobMaterial.objects.filter(group=target_group)
                .exclude(id=jm.id)
                .order_by("sort_order", "id")
                .values_list("id", flat=True)
            )
            clamped_index = max(0, min(target_index, len(target_ids)))
            target_ids.insert(clamped_index, jm.id)
            for idx, tid in enumerate(target_ids):
                JobMaterial.objects.filter(id=tid).update(sort_order=idx)

            if source_group.id != target_group.id:
                jm.group = target_group
                jm.save(update_fields=["group_id"])

                source_group.recalculate_totals()
                source_group.save()

            target_group.recalculate_totals()
            target_group.save()
            job.recalculate_totals()
            job.save(update_fields=["subtotal", "tax_total", "total"])

        return Response({"ok": True})

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="id",
                location=OpenApiParameter.PATH,
                required=True,
                type=str,
                description="Job reference: numeric id or 'draft'.",
            )
        ],
        request=inline_serializer("UpdateTaxRateRequest", fields={"tax_rate": drf_serializers.DecimalField(max_digits=10, decimal_places=6)}),
        responses=inline_serializer("UpdateTaxRateResponse", fields={"ok": drf_serializers.BooleanField()}),
    )
    @action(detail=True, methods=["post"], url_path="tax-rate")
    def update_tax_rate(self, request, pk=None):
        job = _resolve_job_reference(pk)
        new_tax_rate = request.data.get("tax_rate")
        if new_tax_rate is None:
            return Response(
                {"error": "tax_rate is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        new_tax_rate = Decimal(str(new_tax_rate))

        with transaction.atomic():
            job.tax_rate = new_tax_rate
            job.save(update_fields=["tax_rate"])

            Configuration.objects.update_or_create(
                key="tax_rate", defaults={"value": str(new_tax_rate)}
            )

            items = JobMaterial.objects.filter(group__job=job)
            for item in items:
                subtotal = item.unit_price * item.quantity
                item.subtotal = subtotal
                item.tax = subtotal * new_tax_rate
                item.total_price = subtotal + item.tax
                item.save(update_fields=["subtotal", "tax", "total_price"])

            for group in JobGroup.objects.filter(job=job):
                group.recalculate_totals()
                group.save()
            job.recalculate_totals()
            job.save(update_fields=["subtotal", "tax_total", "total"])

        return Response({"ok": True})

    @extend_schema(
        responses={(200, "application/octet-stream"): bytes},
        parameters=[
            OpenApiParameter("showLaborDetails", str, description="Show labor details"),
            OpenApiParameter("fmt", str, description="Export format: excel or pdf"),
            OpenApiParameter("unifyGroups", str, description="Unify all groups into one"),
        ],
    )
    @action(detail=True, methods=["get"])
    def export(self, request, pk=None):
        show_labor_details = (
            request.query_params.get("show_labor_details", "false").lower() == "true"
        )
        unify_groups = (
            request.query_params.get("unify_groups", "false").lower() == "true"
        )
        fmt = request.query_params.get("fmt", "excel").lower()

        output, filename = build_job_workbook(
            pk, show_labor_details=show_labor_details, unify_groups=unify_groups
        )

        if fmt == "pdf":
            import subprocess
            import tempfile

            with tempfile.TemporaryDirectory() as tmpdir:
                xlsx_path = os.path.join(tmpdir, "export.xlsx")
                with open(xlsx_path, "wb") as f:
                    f.write(output.read())

                soffice = None
                for cmd in ["soffice", "libreoffice"]:
                    try:
                        result = subprocess.run(
                            ["which", cmd], capture_output=True, text=True
                        )
                        if result.returncode == 0:
                            soffice = cmd
                            break
                    except Exception:
                        pass

                if not soffice:
                    return Response(
                        {"error": "LibreOffice not found"},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    )

                subprocess.run(
                    [
                        soffice,
                        "--headless",
                        "--convert-to",
                        "pdf",
                        "--outdir",
                        tmpdir,
                        xlsx_path,
                    ],
                    capture_output=True,
                    timeout=30,
                )

                pdf_path = os.path.join(tmpdir, "export.pdf")
                if not os.path.exists(pdf_path):
                    return Response(
                        {"error": "PDF conversion failed"},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    )

                with open(pdf_path, "rb") as f:
                    pdf_data = f.read()

            pdf_filename = filename.rsplit(".", 1)[0] + ".pdf"
            response = DjangoHttpResponse(pdf_data, content_type="application/pdf")
            response["Content-Disposition"] = (
                f'inline; filename="{pdf_filename}"'
            )
            return response

        response = DjangoHttpResponse(
            output.read(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response


class JobGroupViewSet(viewsets.ModelViewSet):
    serializer_class = JobGroupSerializer
    parser_classes = [CamelCaseJSONParser]
    renderer_classes = [CamelCaseJSONRenderer]

    def get_queryset(self):
        job = _resolve_job_reference(self.kwargs["job_pk"])
        return JobGroup.objects.filter(job=job)

    @extend_schema(
        request=inline_serializer(
            "JobGroupCreateRequest",
            fields={
                "name": drf_serializers.CharField(required=False, allow_null=True),
                "split_after_item_id": drf_serializers.IntegerField(required=False),
                "source_group_id": drf_serializers.IntegerField(required=False),
            },
        ),
        responses={201: JobGroupSerializer},
    )
    def create(self, request, job_pk=None, *args, **kwargs):
        job = _resolve_job_reference(job_pk)
        name = request.data.get("name", None)
        split_after_item_id = request.data.get("split_after_item_id")
        source_group_id = request.data.get("source_group_id")

        with transaction.atomic():
            source_group = None
            if source_group_id:
                source_group = JobGroup.objects.filter(
                    id=int(source_group_id), job=job
                ).first()

            max_order = (
                JobGroup.objects.filter(job=job)
                .order_by("-sort_order")
                .values_list("sort_order", flat=True)
                .first()
            )
            new_order = (max_order or 0) + 1

            if source_group:
                new_order = source_group.sort_order + 1
                JobGroup.objects.filter(job=job, sort_order__gte=new_order).update(
                    sort_order=models.F("sort_order") + 1
                )

            new_group = JobGroup.objects.create(
                job=job,
                name=name,
                sort_order=new_order,
            )

            if split_after_item_id and source_group:
                split_item = JobMaterial.objects.filter(
                    id=int(split_after_item_id), group=source_group
                ).first()
                if split_item:
                    ordered_items = list(
                        JobMaterial.objects.filter(group=source_group)
                        .order_by("sort_order", "id")
                        .values_list("id", flat=True)
                    )
                    try:
                        split_pos = ordered_items.index(split_item.id)
                    except ValueError:
                        split_pos = -1

                    if split_pos >= 0 and split_pos < len(ordered_items) - 1:
                        ids_to_move = ordered_items[split_pos + 1 :]
                        JobMaterial.objects.filter(id__in=ids_to_move).update(
                            group=new_group
                        )

                        for new_order_val, item_id in enumerate(
                            ordered_items[: split_pos + 1]
                        ):
                            JobMaterial.objects.filter(id=item_id).update(
                                sort_order=new_order_val
                            )
                        for new_order_val, item_id in enumerate(ids_to_move):
                            JobMaterial.objects.filter(id=item_id).update(
                                sort_order=new_order_val
                            )

                    source_group.recalculate_totals()
                    source_group.save()

            new_group.recalculate_totals()
            new_group.save()
            job.recalculate_totals()
            job.save(update_fields=["subtotal", "tax_total", "total"])

        return Response(
            JobGroupSerializer(new_group).data, status=status.HTTP_201_CREATED
        )

    def partial_update(self, request, job_pk=None, pk=None, *args, **kwargs):
        job = _resolve_job_reference(job_pk)
        group = get_object_or_404(JobGroup, pk=pk, job=job)

        serializer = self.get_serializer(group, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(JobGroupSerializer(group).data)

    def destroy(self, request, job_pk=None, pk=None, *args, **kwargs):
        job = _resolve_job_reference(job_pk)
        group = get_object_or_404(JobGroup, pk=pk, job=job)

        with transaction.atomic():
            group_count = JobGroup.objects.filter(job=job).count()
            if group_count <= 1:
                return Response(
                    {"error": "Cannot delete the only group"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            group.delete()
            job.recalculate_totals()
            job.save(update_fields=["subtotal", "tax_total", "total"])

        return Response(status=status.HTTP_204_NO_CONTENT)


class JobMaterialViewSet(viewsets.ModelViewSet):
    serializer_class = JobMaterialSerializer
    parser_classes = [CamelCaseJSONParser]
    renderer_classes = [CamelCaseJSONRenderer]

    def get_queryset(self):
        job = _resolve_job_reference(self.kwargs["job_pk"])
        return (
            JobMaterial.objects.filter(
                group_id=self.kwargs["group_pk"],
                group__job=job,
            )
            .select_related(
                "variant__material",
                "variant__unit",
                "variant__source_variant__unit",
                "variant__source_variant__material",
                "store",
            )
            .prefetch_related(
                "variant__stores",
                "variant__images",
                "variant__source_variant__stores",
                "variant__source_variant__images",
                "variant__material__images",
                "variant__material__tags",
                "store__images",
            )
        )

    @extend_schema(
        request=inline_serializer(
            "JobMaterialCreateRequest",
            fields={
                "variant_id": drf_serializers.IntegerField(),
                "store_id": drf_serializers.IntegerField(),
                "quantity": drf_serializers.DecimalField(
                    max_digits=10, decimal_places=4, required=False
                ),
                "notes": drf_serializers.CharField(required=False, allow_blank=True),
                "was_price_edited": drf_serializers.BooleanField(required=False),
                "ignored": drf_serializers.BooleanField(required=False),
                "unit": drf_serializers.CharField(required=False, allow_blank=True),
                "sort_order": drf_serializers.IntegerField(required=False),
            },
        ),
        responses={201: JobMaterialSerializer},
    )
    def create(self, request, job_pk=None, group_pk=None, *args, **kwargs):
        job = _resolve_job_reference(job_pk)
        group = get_object_or_404(JobGroup, pk=group_pk, job=job)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        variant = serializer.validated_data["variant"]
        store = serializer.validated_data["store"]
        quantity = serializer.validated_data.get("quantity", Decimal("1"))
        requested_unit = serializer.validated_data.get("unit")
        resolved_unit = (
            requested_unit.strip()
            if isinstance(requested_unit, str) and requested_unit.strip()
            else variant.unit.name
        )

        tax_rate = job.tax_rate or Decimal("0")
        if not tax_rate:
            tax_rate_str = (
                Configuration.objects.filter(key="tax_rate")
                .values_list("value", flat=True)
                .first()
            )
            tax_rate = Decimal(str(tax_rate_str)) if tax_rate_str else Decimal("0")
            if tax_rate and not job.tax_rate:
                job.tax_rate = tax_rate
                job.save(update_fields=["tax_rate"])

        q2 = Decimal("0.01")

        existing = (
            JobMaterial.objects.filter(
                group=group,
                variant=variant,
                store=store,
            )
            .select_related(
                "variant__material",
                "variant__unit",
                "variant__source_variant__unit",
                "variant__source_variant__material",
                "store",
            )
            .prefetch_related(
                "variant__stores",
                "variant__images",
                "variant__source_variant__stores",
                "variant__source_variant__images",
                "variant__material__images",
                "variant__material__tags",
                "store__images",
            )
            .first()
        )
        if existing:
            existing.quantity += quantity
            subtotal = existing.quantity * existing.unit_price
            existing.subtotal = subtotal
            existing.tax = (subtotal * tax_rate).quantize(q2, rounding=ROUND_HALF_UP)
            existing.total_price = subtotal + existing.tax
            update_fields = ["quantity", "subtotal", "tax", "total_price"]
            if not (existing.unit or "").strip():
                existing.unit = resolved_unit
                update_fields.append("unit")
            existing.save(update_fields=update_fields)
            _recalculate_group_and_job(group, job)
            return Response(JobMaterialSerializer(existing).data)

        price_info = PriceInfo.objects.filter(variant=variant, store=store).first()
        unit_price = price_info.price if price_info else Decimal("0")
        if not price_info and variant.source_variant_id:
            source_price = PriceInfo.objects.filter(
                variant=variant.source_variant, store=store
            ).first()
            if source_price and variant.divisor:
                unit_price = (source_price.price / variant.divisor).quantize(
                    q2, rounding=ROUND_HALF_UP
                )
            else:
                unit_price = Decimal("0")
        subtotal = unit_price * quantity
        item_tax = (subtotal * tax_rate).quantize(q2, rounding=ROUND_HALF_UP)
        total_price = subtotal + item_tax

        max_order = (
            JobMaterial.objects.filter(group=group)
            .order_by("-sort_order")
            .values_list("sort_order", flat=True)
            .first()
        )
        next_order = (max_order or 0) + 1

        jm = JobMaterial.objects.create(
            group=group,
            variant=variant,
            store=store,
            quantity=quantity,
            unit_price=unit_price,
            subtotal=subtotal,
            total_price=total_price,
            tax=item_tax,
            notes=serializer.validated_data.get("notes", ""),
            was_price_edited=serializer.validated_data.get("was_price_edited", False),
            unit=resolved_unit,
            sort_order=next_order,
        )

        jm = (
            JobMaterial.objects.select_related(
                "variant__material",
                "variant__unit",
                "variant__source_variant__unit",
                "variant__source_variant__material",
                "store",
            )
            .prefetch_related(
                "variant__stores",
                "variant__images",
                "variant__source_variant__stores",
                "variant__source_variant__images",
                "variant__material__images",
                "variant__material__tags",
                "store__images",
            )
            .get(pk=jm.pk)
        )

        _recalculate_group_and_job(group, job)
        return Response(
            JobMaterialSerializer(jm).data, status=status.HTTP_201_CREATED
        )

    def partial_update(self, request, job_pk=None, group_pk=None, pk=None, *args, **kwargs):
        job = _resolve_job_reference(job_pk)
        group = get_object_or_404(JobGroup, pk=group_pk, job=job)
        jm = get_object_or_404(JobMaterial, pk=pk, group=group)

        old_group = jm.group

        price_fields = ["quantity", "unit_price", "tax", "total_price"]
        provided_price_fields = [f for f in price_fields if f in request.data]
        if len(provided_price_fields) > 1:
            return Response(
                {"error": "Patch one pricing field at a time: quantity, unit_price, tax, or total_price"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        non_pricing_payload = {
            k: v for k, v in request.data.items() if k not in price_fields
        }
        serializer = self.get_serializer(jm, data=non_pricing_payload, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        jm.refresh_from_db()

        def _to_decimal(value, field_name):
            try:
                return Decimal(str(value))
            except (InvalidOperation, TypeError, ValueError):
                raise drf_serializers.ValidationError(
                    {field_name: "A valid number is required."}
                )

        from decimal import InvalidOperation

        q2 = Decimal("0.01")
        edited_price_field = provided_price_fields[0] if provided_price_fields else None
        if edited_price_field == "quantity":
            jm.quantity = _to_decimal(request.data.get("quantity"), "quantity")
            subtotal = jm.unit_price * jm.quantity
            jm.subtotal = subtotal
            jm.tax = (subtotal * job.tax_rate).quantize(q2, rounding=ROUND_HALF_UP)
            jm.total_price = subtotal + jm.tax
            jm.save(update_fields=["quantity", "subtotal", "tax", "total_price"])

        elif edited_price_field == "unit_price":
            jm.unit_price = _to_decimal(request.data.get("unit_price"), "unit_price")
            subtotal = jm.unit_price * jm.quantity
            jm.subtotal = subtotal
            jm.tax = (subtotal * job.tax_rate).quantize(q2, rounding=ROUND_HALF_UP)
            jm.total_price = subtotal + jm.tax
            jm.was_price_edited = request.data.get("was_price_edited", True)
            jm.save(update_fields=["unit_price", "subtotal", "tax", "total_price", "was_price_edited"])

        elif edited_price_field == "tax":
            jm.tax = _to_decimal(request.data.get("tax"), "tax").quantize(
                q2, rounding=ROUND_HALF_UP
            )
            subtotal = jm.unit_price * jm.quantity
            jm.subtotal = subtotal
            jm.total_price = subtotal + jm.tax
            jm.was_price_edited = request.data.get("was_price_edited", True)
            jm.save(update_fields=["subtotal", "tax", "total_price", "was_price_edited"])

        elif edited_price_field == "total_price":
            edited_total = _to_decimal(request.data.get("total_price"), "total_price")
            effective_rate = Decimal("1") + (job.tax_rate or Decimal("0"))
            if jm.quantity > 0 and effective_rate > 0:
                jm.unit_price = edited_total / (jm.quantity * effective_rate)
            else:
                jm.unit_price = Decimal("0")
            subtotal = jm.unit_price * jm.quantity
            jm.subtotal = subtotal
            jm.tax = (subtotal * (job.tax_rate or Decimal("0"))).quantize(
                q2, rounding=ROUND_HALF_UP
            )
            jm.total_price = subtotal + jm.tax
            jm.was_price_edited = request.data.get("was_price_edited", True)
            jm.save(update_fields=["unit_price", "subtotal", "tax", "total_price", "was_price_edited"])

        if jm.group_id != old_group.id:
            _recalculate_group_and_job(old_group, job)
        _recalculate_group_and_job(jm.group, job)

        return Response(JobMaterialSerializer(jm).data)

    def destroy(self, request, job_pk=None, group_pk=None, pk=None, *args, **kwargs):
        job = _resolve_job_reference(job_pk)
        group = get_object_or_404(JobGroup, pk=group_pk, job=job)
        jm = get_object_or_404(JobMaterial, pk=pk, group=group)

        jm.delete()
        _recalculate_group_and_job(group, job)
        return Response(status=status.HTTP_204_NO_CONTENT)


class JobLaborViewSet(viewsets.ModelViewSet):
    serializer_class = JobLaborSerializer
    parser_classes = [CamelCaseJSONParser]
    renderer_classes = [CamelCaseJSONRenderer]

    def get_queryset(self):
        job = _resolve_job_reference(self.kwargs["job_pk"])
        return JobLabor.objects.filter(
            group_id=self.kwargs["group_pk"],
            group__job=job,
        )

    def create(self, request, job_pk=None, group_pk=None, *args, **kwargs):
        job = _resolve_job_reference(job_pk)
        group = get_object_or_404(JobGroup, pk=group_pk, job=job)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        item = serializer.save(group=group)

        group.recalculate_totals()
        group.save()

        return Response(
            JobLaborSerializer(item).data, status=status.HTTP_201_CREATED
        )

    def partial_update(self, request, job_pk=None, group_pk=None, pk=None, *args, **kwargs):
        job = _resolve_job_reference(job_pk)
        group = get_object_or_404(JobGroup, pk=group_pk, job=job)
        item = get_object_or_404(JobLabor, pk=pk, group=group)

        serializer = self.get_serializer(item, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        group.recalculate_totals()
        group.save()

        return Response(JobLaborSerializer(item).data)

    def destroy(self, request, job_pk=None, group_pk=None, pk=None, *args, **kwargs):
        job = _resolve_job_reference(job_pk)
        group = get_object_or_404(JobGroup, pk=group_pk, job=job)
        item = get_object_or_404(JobLabor, pk=pk, group=group)

        item.delete()
        group.recalculate_totals()
        group.save()

        return Response(status=status.HTTP_204_NO_CONTENT)
