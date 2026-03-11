import logging

from django.conf import settings
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from apps.core.constants import GENERIC_ERROR_MESSAGE
from apps.core.helpers import create_or_update_user, format_validation_errors, get_user_by_username

from .serializers import LoginSerializer, RegisterSerializer

logger = logging.getLogger(__name__)


class AuthRateThrottle(AnonRateThrottle):
    rate = "10/minute"
    scope = "auth"

    def allow_request(self, request, view):
        # Disable throttling in DEBUG mode (e.g. during e2e tests)
        if settings.DEBUG:
            return True
        return super().allow_request(request, view)


def _set_refresh_cookie(response: Response, refresh_token: str) -> Response:
    response.set_cookie(
        key=settings.REFRESH_COOKIE_NAME,
        value=refresh_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        path=settings.REFRESH_COOKIE_PATH,
        max_age=int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()),
    )
    return response


def _clear_refresh_cookie(response: Response) -> Response:
    response.delete_cookie(
        key=settings.REFRESH_COOKIE_NAME,
        path=settings.REFRESH_COOKIE_PATH,
    )
    return response


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
@ensure_csrf_cookie
def get_csrf_token(request):
    """Issue a CSRF cookie so the frontend can use it for cookie-based endpoints."""
    return Response({"detail": "CSRF cookie set."})


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
@throttle_classes([AuthRateThrottle])
def register_user(request):
    try:
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(format_validation_errors(serializer.errors), status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        if get_user_by_username(data["username"]):
            return Response({"error": "Username already in use."}, status=status.HTTP_400_BAD_REQUEST)

        user, user_data = create_or_update_user(data["username"], {"username": data["username"]}, data["password"])
        refresh = RefreshToken.for_user(user)
        response = Response(
            {"user": user_data, "access_token": str(refresh.access_token)},
            status=status.HTTP_201_CREATED,
        )
        return _set_refresh_cookie(response, str(refresh))

    except Exception:
        logger.exception("register_user error")
        return Response({"error": GENERIC_ERROR_MESSAGE}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
@throttle_classes([AuthRateThrottle])
def login_user(request):
    try:
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(format_validation_errors(serializer.errors), status=status.HTTP_400_BAD_REQUEST)

        user = serializer.validated_data["user"]
        refresh = RefreshToken.for_user(user)
        user_data = {
            "id": user.id,
            "username": user.username,
            "date_joined": user.date_joined.isoformat(),
        }
        response = Response({"user": user_data, "access_token": str(refresh.access_token)})
        return _set_refresh_cookie(response, str(refresh))

    except Exception:
        logger.exception("login_user error")
        return Response({"error": GENERIC_ERROR_MESSAGE}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
@csrf_protect
def refresh_token(request):
    """Read refresh token from httpOnly cookie, rotate and return new access token."""
    try:
        token_str = request.COOKIES.get(settings.REFRESH_COOKIE_NAME)
        if not token_str:
            return Response({"error": "Refresh token not found."}, status=status.HTTP_401_UNAUTHORIZED)

        refresh = RefreshToken(token_str)
        access_token = str(refresh.access_token)
        new_refresh = str(refresh)
        response = Response({"access_token": access_token})
        return _set_refresh_cookie(response, new_refresh)

    except TokenError:
        response = Response({"error": "Invalid or expired refresh token."}, status=status.HTTP_401_UNAUTHORIZED)
        return _clear_refresh_cookie(response)
    except Exception:
        logger.exception("refresh_token error")
        return Response({"error": GENERIC_ERROR_MESSAGE}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
@csrf_protect
def logout_user(request):
    try:
        token_str = request.COOKIES.get(settings.REFRESH_COOKIE_NAME)
        if token_str:
            try:
                token = RefreshToken(token_str)
                token.blacklist()
            except TokenError:
                pass  # Already invalid — still clear cookie

        response = Response({"detail": "Logged out successfully."})
        return _clear_refresh_cookie(response)

    except Exception:
        logger.exception("logout_user error")
        return Response({"error": GENERIC_ERROR_MESSAGE}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
