import logging

from django.core.paginator import Paginator
from django.db import transaction
from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from apps.categories.models import Category
from apps.core.constants import GENERIC_ERROR_MESSAGE
from apps.core.helpers import format_validation_errors

from .models import Note
from .serializers import NoteSerializer, NoteWriteSerializer

logger = logging.getLogger(__name__)
DEFAULT_PAGE_SIZE = 20

ALLOWED_ORDERINGS = {
    "updated_at": "-updated_at",
    "-updated_at": "-updated_at",
    "created_at": "created_at",
    "-created_at": "-created_at",
    "title": "title",
    "-title": "-title",
    "pinned": ["-is_pinned", "-updated_at"],
}


def _get_note_or_404(user, pk):
    try:
        return Note.objects.select_related("category").get(pk=pk, user=user)
    except Note.DoesNotExist:
        return None


def _paginate(qs, request):
    page = int(request.query_params.get("page", 1))
    per_page = min(int(request.query_params.get("per_page", DEFAULT_PAGE_SIZE)), 100)
    paginator = Paginator(qs, per_page)
    page_obj = paginator.get_page(page)
    return page_obj, {
        "total": paginator.count,
        "page": page,
        "per_page": per_page,
        "total_pages": paginator.num_pages,
        "has_next": page_obj.has_next(),
        "has_previous": page_obj.has_previous(),
    }


@api_view(["GET"])
def list_notes(request):
    qs = Note.objects.filter(user=request.user).select_related("category")

    category_id = request.query_params.get("category_id")
    is_archived = request.query_params.get("is_archived")
    search = request.query_params.get("search", "").strip()

    if category_id == "null":
        qs = qs.filter(category__isnull=True)
    elif category_id:
        qs = qs.filter(category_id=category_id)

    if is_archived is not None:
        qs = qs.filter(is_archived=is_archived.lower() == "true")
    else:
        qs = qs.filter(is_archived=False)

    if search:
        qs = qs.filter(Q(title__icontains=search) | Q(content__icontains=search))

    ordering_param = request.query_params.get("ordering", "-updated_at")
    ordering = ALLOWED_ORDERINGS.get(ordering_param, "-updated_at")
    qs = qs.order_by(*ordering) if isinstance(ordering, list) else qs.order_by(ordering)

    page_obj, pagination = _paginate(qs, request)
    return Response(
        {
            "notes": NoteSerializer(page_obj.object_list, many=True).data,
            "pagination": pagination,
        }
    )


@api_view(["POST"])
def create_note(request):
    try:
        serializer = NoteWriteSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                format_validation_errors(serializer.errors),
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = dict(serializer.validated_data)
        category_id = data.pop("category_id", None)
        category = None
        if category_id:
            try:
                category = Category.objects.get(pk=category_id, user=request.user)
            except Category.DoesNotExist:
                return Response(
                    {"error": "Category not found."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        with transaction.atomic():
            note = Note.objects.create(user=request.user, category=category, **data)

        return Response({"note": NoteSerializer(note).data}, status=status.HTTP_201_CREATED)
    except Exception:
        logger.exception("create_note error")
        return Response(
            {"error": GENERIC_ERROR_MESSAGE},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
def get_note(request, pk):
    note = _get_note_or_404(request.user, pk)
    if not note:
        return Response({"error": "Note not found."}, status=status.HTTP_404_NOT_FOUND)
    return Response({"note": NoteSerializer(note).data})


@api_view(["PUT"])
def update_note(request, pk):
    try:
        note = _get_note_or_404(request.user, pk)
        if not note:
            return Response({"error": "Note not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = NoteWriteSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                format_validation_errors(serializer.errors),
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = dict(serializer.validated_data)

        if "category_id" in request.data or "category_id" in data:
            category_id = data.pop("category_id", None)
            if category_id:
                try:
                    note.category = Category.objects.get(pk=category_id, user=request.user)
                except Category.DoesNotExist:
                    return Response(
                        {"error": "Category not found."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            else:
                note.category = None
        else:
            data.pop("category_id", None)

        for key, value in data.items():
            setattr(note, key, value)

        with transaction.atomic():
            note.save()

        return Response({"note": NoteSerializer(note).data})
    except Exception:
        logger.exception("update_note error")
        return Response(
            {"error": GENERIC_ERROR_MESSAGE},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["DELETE"])
def delete_note(request, pk):
    try:
        note = _get_note_or_404(request.user, pk)
        if not note:
            return Response({"error": "Note not found."}, status=status.HTTP_404_NOT_FOUND)
        note.delete()
        return Response({"detail": "Note deleted."})
    except Exception:
        logger.exception("delete_note error")
        return Response(
            {"error": GENERIC_ERROR_MESSAGE},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["PATCH"])
def toggle_archive(request, pk):
    try:
        note = _get_note_or_404(request.user, pk)
        if not note:
            return Response({"error": "Note not found."}, status=status.HTTP_404_NOT_FOUND)
        note.is_archived = not note.is_archived
        note.save(update_fields=["is_archived", "updated_at"])
        return Response({"note": NoteSerializer(note).data})
    except Exception:
        logger.exception("toggle_archive error")
        return Response(
            {"error": GENERIC_ERROR_MESSAGE},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["PATCH"])
def toggle_pin(request, pk):
    try:
        note = _get_note_or_404(request.user, pk)
        if not note:
            return Response({"error": "Note not found."}, status=status.HTTP_404_NOT_FOUND)
        note.is_pinned = not note.is_pinned
        note.save(update_fields=["is_pinned"])
        return Response({"note": NoteSerializer(note).data})
    except Exception:
        logger.exception("toggle_pin error")
        return Response(
            {"error": GENERIC_ERROR_MESSAGE},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
