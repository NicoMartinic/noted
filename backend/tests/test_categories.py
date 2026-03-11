"""Integration tests for categories endpoints."""

import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from tests.factories import CategoryFactory, UserFactory


@pytest.mark.django_db
class TestListCategories:
    def test_returns_only_own_categories(self, auth_client):
        client, user = auth_client
        CategoryFactory(user=user, title="Mine")
        CategoryFactory(user=UserFactory(), title="Theirs")
        res = client.get(reverse("category-list"))
        titles = [c["title"] for c in res.data["categories"]]
        assert "Mine" in titles
        assert "Theirs" not in titles

    def test_pagination_structure(self, auth_client):
        client, user = auth_client
        CategoryFactory.create_batch(5, user=user)
        res = client.get(reverse("category-list"), {"per_page": 3})
        assert "pagination" in res.data
        assert res.data["pagination"]["total"] == 5
        assert res.data["pagination"]["total_pages"] == 2

    def test_search_filter(self, auth_client):
        client, user = auth_client
        CategoryFactory(user=user, title="Work")
        CategoryFactory(user=user, title="Personal")
        res = client.get(reverse("category-list"), {"search": "work"})
        titles = [c["title"] for c in res.data["categories"]]
        assert titles == ["Work"]

    def test_ordering_by_title(self, auth_client):
        client, user = auth_client
        CategoryFactory(user=user, title="Zebra")
        CategoryFactory(user=user, title="Apple")
        res = client.get(reverse("category-list"), {"ordering": "title"})
        titles = [c["title"] for c in res.data["categories"]]
        assert titles == sorted(titles)

    def test_response_includes_notes_count(self, auth_client):
        client, user = auth_client
        CategoryFactory(user=user, title="Empty")
        res = client.get(reverse("category-list"))
        assert "notes_count" in res.data["categories"][0]

    def test_unauthenticated_returns_401(self):
        res = APIClient().get(reverse("category-list"))
        assert res.status_code == 401


@pytest.mark.django_db
class TestCreateCategory:
    def test_success(self, auth_client):
        client, _ = auth_client
        res = client.post(
            reverse("category-create"),
            {"title": "New", "color": "#ff0000"},
            format="json",
        )
        assert res.status_code == 201
        assert res.data["category"]["title"] == "New"

    def test_duplicate_title_same_user_rejected(self, auth_client):
        client, user = auth_client
        CategoryFactory(user=user, title="Dupe")
        res = client.post(
            reverse("category-create"),
            {"title": "Dupe", "color": "#ff0000"},
            format="json",
        )
        assert res.status_code == 400

    def test_duplicate_title_different_user_allowed(self, auth_client):
        client, _ = auth_client
        CategoryFactory(user=UserFactory(), title="Shared")
        res = client.post(
            reverse("category-create"),
            {"title": "Shared", "color": "#ff0000"},
            format="json",
        )
        assert res.status_code == 201

    def test_missing_title_rejected(self, auth_client):
        client, _ = auth_client
        res = client.post(reverse("category-create"), {"color": "#ff0000"}, format="json")
        assert res.status_code == 400


@pytest.mark.django_db
class TestUpdateCategory:
    def test_success(self, auth_client):
        client, user = auth_client
        cat = CategoryFactory(user=user)
        res = client.put(
            reverse("category-update", args=[cat.id]),
            {"title": "Updated", "color": "#00ff00"},
            format="json",
        )
        assert res.status_code == 200
        assert res.data["category"]["title"] == "Updated"

    def test_cannot_update_other_users_category(self, auth_client):
        client, _ = auth_client
        other_cat = CategoryFactory(user=UserFactory())
        res = client.put(
            reverse("category-update", args=[other_cat.id]),
            {"title": "Hack"},
            format="json",
        )
        assert res.status_code == 404


@pytest.mark.django_db
class TestDeleteCategory:
    def test_success(self, auth_client):
        client, user = auth_client
        cat = CategoryFactory(user=user)
        res = client.delete(reverse("category-delete", args=[cat.id]))
        assert res.status_code == 200

    def test_cannot_delete_other_users_category(self, auth_client):
        client, _ = auth_client
        other_cat = CategoryFactory(user=UserFactory())
        res = client.delete(reverse("category-delete", args=[other_cat.id]))
        assert res.status_code == 404
