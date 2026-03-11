import re

from rest_framework import serializers

from .models import Category


class CategorySerializer(serializers.ModelSerializer):
    notes_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ["id", "title", "description", "color", "notes_count", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at", "notes_count"]

    def get_notes_count(self, obj):
        return obj.notes.count()


class CategoryWriteSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=100, required=True)
    description = serializers.CharField(allow_blank=True, required=False, default="")
    color = serializers.CharField(max_length=7, required=False, default="#6366f1")

    def validate_color(self, value):
        if not re.match(r"^#[0-9A-Fa-f]{6}$", value):
            raise serializers.ValidationError("Color must be a valid hex code (e.g. #ff0000).")
        return value

    def validate_title(self, value):
        """Ensure category name is unique per user."""
        user = self.context.get("user")
        exclude_id = self.context.get("exclude_id")
        if user:
            qs = Category.objects.filter(user=user, title__iexact=value)
            if exclude_id:
                qs = qs.exclude(id=exclude_id)
            if qs.exists():
                raise serializers.ValidationError("A category with this name already exists.")
        return value
