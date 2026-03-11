"""Integration tests for user profile endpoints."""

import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from tests.factories import UserFactory


@pytest.mark.django_db
class TestGetMe:
    def test_returns_own_user(self, auth_client):
        client, user = auth_client
        res = client.get(reverse("user-me"))
        assert res.status_code == 200
        assert res.data["user"]["username"] == user.username

    def test_unauthenticated_returns_401(self):
        res = APIClient().get(reverse("user-me"))
        assert res.status_code == 401


@pytest.mark.django_db
class TestUpdateProfile:
    def test_change_username_success(self, auth_client):
        client, user = auth_client
        res = client.put(
            reverse("user-update"),
            {
                "current_username": user.username,
                "current_password": "testpass123",
                "new_username": "newname",
            },
            format="json",
        )
        assert res.status_code == 200
        assert res.data["user"]["username"] == "newname"
        assert "message" in res.data

    def test_change_password_only_returns_message(self, auth_client):
        client, user = auth_client
        res = client.put(
            reverse("user-update"),
            {
                "current_username": user.username,
                "current_password": "testpass123",
                "new_password": "newpassword99",
            },
            format="json",
        )
        assert res.status_code == 200
        assert "message" in res.data

    def test_wrong_current_password_rejected(self, auth_client):
        client, user = auth_client
        res = client.put(
            reverse("user-update"),
            {
                "current_username": user.username,
                "current_password": "wrongpassword",
                "new_username": "anything",
            },
            format="json",
        )
        assert res.status_code == 400

    def test_duplicate_username_rejected(self, auth_client):
        client, user = auth_client
        other = UserFactory()
        res = client.put(
            reverse("user-update"),
            {
                "current_username": user.username,
                "current_password": "testpass123",
                "new_username": other.username,
            },
            format="json",
        )
        assert res.status_code == 400
