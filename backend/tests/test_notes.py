"""Integration tests for notes endpoints."""

import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from tests.factories import CategoryFactory, NoteFactory, UserFactory


@pytest.mark.django_db
class TestListNotes:
    def test_returns_only_own_notes(self, auth_client):
        client, user = auth_client
        NoteFactory(user=user, title="Mine")
        NoteFactory(user=UserFactory(), title="Theirs")
        res = client.get(reverse("note-list"))
        titles = [n["title"] for n in res.data["notes"]]
        assert "Mine" in titles
        assert "Theirs" not in titles

    def test_pagination(self, auth_client):
        client, user = auth_client
        NoteFactory.create_batch(25, user=user)
        res = client.get(reverse("note-list"), {"per_page": 20})
        assert res.data["pagination"]["total"] == 25
        assert res.data["pagination"]["total_pages"] == 2

    def test_search_filter(self, auth_client):
        client, user = auth_client
        NoteFactory(user=user, title="Meeting notes")
        NoteFactory(user=user, title="Shopping list")
        res = client.get(reverse("note-list"), {"search": "meeting"})
        assert len(res.data["notes"]) == 1

    def test_archive_filter(self, auth_client):
        client, user = auth_client
        NoteFactory(user=user, is_archived=False)
        NoteFactory(user=user, is_archived=True)
        res = client.get(reverse("note-list"), {"is_archived": "true"})
        assert all(n["is_archived"] for n in res.data["notes"])

    def test_category_filter(self, auth_client):
        client, user = auth_client
        cat = CategoryFactory(user=user)
        NoteFactory(user=user, category=cat)
        NoteFactory(user=user, category=None)
        res = client.get(reverse("note-list"), {"category_id": cat.id})
        assert len(res.data["notes"]) == 1

    def test_ordering_title_asc(self, auth_client):
        client, user = auth_client
        NoteFactory(user=user, title="Zebra")
        NoteFactory(user=user, title="Apple")
        res = client.get(reverse("note-list"), {"ordering": "title"})
        titles = [n["title"] for n in res.data["notes"]]
        assert titles == sorted(titles)

    def test_ordering_title_desc(self, auth_client):
        client, user = auth_client
        NoteFactory(user=user, title="Zebra")
        NoteFactory(user=user, title="Apple")
        res = client.get(reverse("note-list"), {"ordering": "-title"})
        titles = [n["title"] for n in res.data["notes"]]
        assert titles == sorted(titles, reverse=True)

    def test_ordering_pinned_first(self, auth_client):
        client, user = auth_client
        NoteFactory(user=user, title="Unpinned", is_pinned=False)
        NoteFactory(user=user, title="Pinned", is_pinned=True)
        res = client.get(reverse("note-list"), {"ordering": "pinned"})
        assert res.data["notes"][0]["is_pinned"] is True

    def test_invalid_ordering_defaults_gracefully(self, auth_client):
        client, user = auth_client
        NoteFactory.create_batch(3, user=user)
        res = client.get(reverse("note-list"), {"ordering": "__evil__"})
        assert res.status_code == 200

    def test_response_includes_is_pinned_field(self, auth_client):
        client, user = auth_client
        NoteFactory(user=user)
        res = client.get(reverse("note-list"))
        assert "is_pinned" in res.data["notes"][0]

    def test_unauthenticated_returns_401(self):
        res = APIClient().get(reverse("note-list"))
        assert res.status_code == 401


@pytest.mark.django_db
class TestCreateNote:
    def test_success(self, auth_client):
        client, _ = auth_client
        res = client.post(reverse("note-create"), {"title": "My Note"}, format="json")
        assert res.status_code == 201
        assert res.data["note"]["title"] == "My Note"

    def test_with_category(self, auth_client):
        client, user = auth_client
        cat = CategoryFactory(user=user)
        res = client.post(
            reverse("note-create"),
            {"title": "Categorised", "category_id": cat.id},
            format="json",
        )
        assert res.status_code == 201
        assert res.data["note"]["category"]["id"] == cat.id

    def test_missing_title_rejected(self, auth_client):
        client, _ = auth_client
        res = client.post(reverse("note-create"), {}, format="json")
        assert res.status_code == 400

    def test_is_pinned_defaults_to_false(self, auth_client):
        client, _ = auth_client
        res = client.post(reverse("note-create"), {"title": "Note"}, format="json")
        assert res.data["note"]["is_pinned"] is False


@pytest.mark.django_db
class TestUpdateNote:
    def test_remove_category_with_null(self, auth_client):
        client, user = auth_client
        cat = CategoryFactory(user=user)
        note = NoteFactory(user=user, category=cat)
        res = client.put(
            reverse("note-update", args=[note.id]),
            {"title": note.title, "category_id": None},
            format="json",
        )
        assert res.status_code == 200
        assert res.data["note"]["category"] is None

    def test_omitting_category_preserves_it(self, auth_client):
        client, user = auth_client
        cat = CategoryFactory(user=user)
        note = NoteFactory(user=user, category=cat)
        res = client.put(
            reverse("note-update", args=[note.id]),
            {"title": "New title"},
            format="json",
        )
        assert res.data["note"]["category"]["id"] == cat.id


@pytest.mark.django_db
class TestToggleArchive:
    def test_archives_note(self, auth_client):
        client, user = auth_client
        note = NoteFactory(user=user, is_archived=False)
        res = client.patch(reverse("note-archive", args=[note.id]))
        assert res.data["note"]["is_archived"] is True

    def test_unarchives_note(self, auth_client):
        client, user = auth_client
        note = NoteFactory(user=user, is_archived=True)
        res = client.patch(reverse("note-archive", args=[note.id]))
        assert res.data["note"]["is_archived"] is False


@pytest.mark.django_db
class TestTogglePin:
    def test_pins_note(self, auth_client):
        client, user = auth_client
        note = NoteFactory(user=user, is_pinned=False)
        res = client.patch(reverse("note-pin", args=[note.id]))
        assert res.status_code == 200
        assert res.data["note"]["is_pinned"] is True

    def test_unpins_note(self, auth_client):
        client, user = auth_client
        note = NoteFactory(user=user, is_pinned=True)
        res = client.patch(reverse("note-pin", args=[note.id]))
        assert res.data["note"]["is_pinned"] is False

    def test_cannot_pin_other_users_note(self, auth_client):
        client, _ = auth_client
        other_note = NoteFactory(user=UserFactory())
        res = client.patch(reverse("note-pin", args=[other_note.id]))
        assert res.status_code == 404

    def test_pin_does_not_change_is_archived(self, auth_client):
        client, user = auth_client
        note = NoteFactory(user=user, is_pinned=False, is_archived=True)
        res = client.patch(reverse("note-pin", args=[note.id]))
        assert res.data["note"]["is_archived"] is True
        assert res.data["note"]["is_pinned"] is True


@pytest.mark.django_db
class TestDeleteNote:
    def test_success(self, auth_client):
        client, user = auth_client
        note = NoteFactory(user=user)
        res = client.delete(reverse("note-delete", args=[note.id]))
        assert res.status_code == 200

    def test_cannot_delete_other_users_note(self, auth_client):
        client, _ = auth_client
        other_note = NoteFactory(user=UserFactory())
        res = client.delete(reverse("note-delete", args=[other_note.id]))
        assert res.status_code == 404


@pytest.mark.django_db
class TestHealthCheck:
    def test_returns_200_when_db_healthy(self, client):
        res = client.get("/api/health/")
        assert res.status_code == 200
        assert res.json()["status"] == "ok"
        assert res.json()["db"] is True
