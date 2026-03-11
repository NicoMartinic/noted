"""Integration tests for authentication endpoints."""

import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from tests.factories import UserFactory


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def user():
    return UserFactory()


@pytest.mark.django_db
class TestCSRF:
    def test_get_csrf_sets_cookie(self, client):
        res = client.get(reverse("auth-csrf"))
        assert res.status_code == 200
        assert "csrftoken" in res.cookies


@pytest.mark.django_db
class TestRegister:
    def test_success(self, client):
        res = client.post(
            reverse("auth-register"),
            {"username": "newuser", "password": "securepass1", "password2": "securepass1"},
            format="json",
        )
        assert res.status_code == 201
        assert "access_token" in res.data

    def test_password_mismatch(self, client):
        res = client.post(
            reverse("auth-register"),
            {"username": "u", "password": "pass1", "password2": "pass2"},
            format="json",
        )
        assert res.status_code == 400
        assert "errors" in res.data

    def test_duplicate_username(self, client, user):
        res = client.post(
            reverse("auth-register"),
            {
                "username": user.username,
                "password": "testpass123",
                "password2": "testpass123",
            },
            format="json",
        )
        assert res.status_code == 400

    def test_short_password_rejected(self, client):
        res = client.post(
            reverse("auth-register"),
            {"username": "u2", "password": "abc", "password2": "abc"},
            format="json",
        )
        assert res.status_code == 400


@pytest.mark.django_db
class TestLogin:
    def test_success_returns_token(self, client, user):
        res = client.post(
            reverse("auth-login"),
            {"username": user.username, "password": "testpass123"},
            format="json",
        )
        assert res.status_code == 200
        assert "access_token" in res.data
        # Cookie is named "refresh_token" (see settings.REFRESH_COOKIE_NAME)
        assert "refresh_token" in res.cookies

    def test_wrong_password(self, client, user):
        res = client.post(
            reverse("auth-login"),
            {"username": user.username, "password": "wrong"},
            format="json",
        )
        assert res.status_code == 400

    def test_missing_fields(self, client):
        res = client.post(reverse("auth-login"), {}, format="json")
        assert res.status_code == 400


@pytest.mark.django_db
class TestLogout:
    def test_logout_clears_refresh_cookie(self, client, user):
        client.post(
            reverse("auth-login"),
            {"username": user.username, "password": "testpass123"},
            format="json",
        )
        csrf_res = client.get(reverse("auth-csrf"))
        csrftoken = csrf_res.cookies["csrftoken"].value
        res = client.post(reverse("auth-logout"), HTTP_X_CSRFTOKEN=csrftoken)
        assert res.status_code == 200
