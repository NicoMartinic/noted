from rest_framework import serializers

from apps.categories.serializers import CategorySerializer

from .models import Note


class NoteSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.IntegerField(allow_null=True, required=False)

    class Meta:
        model = Note
        fields = [
            "id",
            "title",
            "content",
            "category",
            "category_id",
            "is_pinned",
            "is_archived",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class NoteWriteSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255, required=True)
    content = serializers.CharField(allow_blank=True, required=False, default="")
    category_id = serializers.IntegerField(allow_null=True, required=False)
    is_pinned = serializers.BooleanField(required=False, default=False)
    is_archived = serializers.BooleanField(required=False, default=False)
