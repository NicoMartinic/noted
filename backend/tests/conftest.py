import pytest
from rest_framework.test import APIClient

from tests.factories import UserFactory


@pytest.fixture
def auth_client(db):
    """Authenticated APIClient using force_authenticate — no login endpoint, no throttling."""
    user = UserFactory()
    client = APIClient()
    client.force_authenticate(user=user)
    return client, user


@pytest.fixture(autouse=True)
def disable_throttling(settings):
    """Replace cache with DummyCache so throttle counters never accumulate."""
    settings.CACHES = {"default": {"BACKEND": "django.core.cache.backends.dummy.DummyCache"}}
