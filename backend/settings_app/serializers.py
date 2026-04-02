from rest_framework import serializers


class SettingsSerializer(serializers.Serializer):
    tax_rate = serializers.FloatField(required=False)
    materials_view_mode = serializers.ChoiceField(
        choices=["grid", "list"],
        required=False,
    )
    accent_color = serializers.RegexField(
        regex=r"^#[0-9a-fA-F]{6}$",
        required=False,
    )
    default_export_format = serializers.ChoiceField(
        choices=["excel", "pdf"],
        required=False,
    )
    default_export_show_labor_details = serializers.BooleanField(required=False)
