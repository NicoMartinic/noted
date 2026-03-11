from django.db import connection
from django.db.utils import OperationalError
from rest_framework import permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def health_check(request):
    """
    Lightweight liveness + readiness probe.
    Returns 200 when the app is running and DB is reachable.
    """
    try:
        connection.ensure_connection()
        db_ok = True
    except OperationalError:
        db_ok = False
    status_code = 200 if db_ok else 503
    return Response({"status": "ok" if db_ok else "degraded", "db": db_ok}, status=status_code)
