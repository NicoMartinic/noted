import logging

from django.core.paginator import Paginator
from django.db import transaction
from django.db.models import Count
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from apps.core.constants import GENERIC_ERROR_MESSAGE
from apps.core.helpers import format_validation_errors

from .models import Category
from .serializers import CategorySerializer, CategoryWriteSerializer

logger = logging.getLogger(__name__)
DEFAULT_PAGE_SIZE = 20


def _get_category_or_404(user, pk):
    try:
        return Category.objects.get(pk=pk, user=user)
    except Category.DoesNotExist:
        return None


def _paginate(qs, request):
    page = max(1, int(request.query_params.get("page", 1)))
    per_page = min(int(request.query_params.get("per_page", DEFAULT_PAGE_SIZE)), 500)
    paginator = Paginator(qs, per_page)
    page_obj = paginator.get_page(page)
    return page_obj, {
        "total": paginator.count,
        "page": page_obj.number,
        "per_page": per_page,
        "total_pages": paginator.num_pages,
        "has_next": page_obj.has_next(),
        "has_previous": page_obj.has_previous(),
    }


@api_view(["GET"])
def list_categories(request):
    qs = Category.objects.filter(user=request.user).annotate(notes_count_db=Count("notes"))
    search = request.query_params.get("search", "").strip()
    if search:
        qs = qs.filter(title__icontains=search)
    ordering = request.query_params.get("ordering", "title")
    if ordering not in {"title", "-title", "-notes_count", "notes_count"}:
        ordering = "title"
    if "notes_count" in ordering:
        ordering = ordering.replace("notes_count", "notes_count_db")
    qs = qs.order_by(ordering)
    page_obj, pagination = _paginate(qs, request)
    return Response(
        {
            "categories": CategorySerializer(page_obj.object_list, many=True).data,
            "pagination": pagination,
        }
    )


@api_view(["POST"])
def create_category(request):
    try:
        serializer = CategoryWriteSerializer(data=request.data, context={"user": request.user})
        if not serializer.is_valid():
            return Response(
                format_validation_errors(serializer.errors),
                status=status.HTTP_400_BAD_REQUEST,
            )
        with transaction.atomic():
            category = Category.objects.create(user=request.user, **serializer.validated_data)
        return Response(
            {"category": CategorySerializer(category).data},
            status=status.HTTP_201_CREATED,
        )
    except Exception:
        logger.exception("create_category error")
        return Response(
            {"error": GENERIC_ERROR_MESSAGE},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
def get_category(request, pk):
    category = _get_category_or_404(request.user, pk)
    if not category:
        return Response({"error": "Category not found."}, status=status.HTTP_404_NOT_FOUND)
    return Response({"category": CategorySerializer(category).data})


@api_view(["PUT"])
def update_category(request, pk):
    try:
        category = _get_category_or_404(request.user, pk)
        if not category:
            return Response({"error": "Category not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = CategoryWriteSerializer(
            data=request.data,
            context={"user": request.user, "exclude_id": category.id},
        )
        if not serializer.is_valid():
            return Response(
                format_validation_errors(serializer.errors),
                status=status.HTTP_400_BAD_REQUEST,
            )
        with transaction.atomic():
            for key, value in serializer.validated_data.items():
                setattr(category, key, value)
            category.save()
        return Response({"category": CategorySerializer(category).data})
    except Exception:
        logger.exception("update_category error")
        return Response(
            {"error": GENERIC_ERROR_MESSAGE},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["DELETE"])
def delete_category(request, pk):
    try:
        category = _get_category_or_404(request.user, pk)
        if not category:
            return Response({"error": "Category not found."}, status=status.HTTP_404_NOT_FOUND)
        with transaction.atomic():
            category.delete()
        return Response({"detail": "Category deleted."})
    except Exception:
        logger.exception("delete_category error")
        return Response(
            {"error": GENERIC_ERROR_MESSAGE},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
def category_notes_count(request, pk):
    category = _get_category_or_404(request.user, pk)
    if not category:
        return Response({"error": "Category not found."}, status=status.HTTP_404_NOT_FOUND)
    return Response({"notes_count": category.notes.count()})
