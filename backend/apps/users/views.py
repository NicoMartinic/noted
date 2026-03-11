import logging

from django.db import transaction
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from apps.core.constants import GENERIC_ERROR_MESSAGE
from apps.core.helpers import format_validation_errors

from .serializers import UpdateProfileSerializer, UserSerializer

logger = logging.getLogger(__name__)


@api_view(["GET"])
def get_me(request):
    return Response({"user": UserSerializer(request.user).data})


@api_view(["PUT"])
def update_self(request):
    try:
        user = request.user
        serializer = UpdateProfileSerializer(data=request.data, context={"user": user})
        if not serializer.is_valid():
            return Response(
                format_validation_errors(serializer.errors),
                status=status.HTTP_400_BAD_REQUEST,
            )
        validated_data = serializer.validated_data
        if "new_username" in validated_data:
            user.username = validated_data["new_username"]
        if "new_password" in validated_data:
            user.set_password(validated_data["new_password"])
        with transaction.atomic():
            user.save()
        return Response(
            {
                "user": UserSerializer(user).data,
                "message": "Profile updated successfully.",
            }
        )
    except Exception:
        logger.exception("update_self error")
        return Response(
            {"error": GENERIC_ERROR_MESSAGE},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
