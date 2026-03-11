from django.contrib.auth.models import User


def get_user_by_username(username: str):
    try:
        return User.objects.get(username=username)
    except User.DoesNotExist:
        return None


def create_or_update_user(username: str, data: dict, password: str = None):
    user, created = User.objects.get_or_create(username=username, defaults=data)
    if not created:
        for key, value in data.items():
            setattr(user, key, value)
    if password:
        user.set_password(password)
    user.save()
    user_data = {
        "id": user.id,
        "username": user.username,
        "date_joined": user.date_joined.isoformat(),
    }
    return user, user_data


def format_validation_errors(errors: dict) -> dict:
    """Flatten DRF serializer errors into a simple dict."""
    formatted = {}
    for field, messages in errors.items():
        if isinstance(messages, list):
            formatted[field] = messages[0] if messages else "Invalid value."
        elif isinstance(messages, dict):
            formatted[field] = format_validation_errors(messages)
        else:
            formatted[field] = str(messages)
    return {"errors": formatted}
