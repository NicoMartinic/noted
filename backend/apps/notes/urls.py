from django.urls import path

from . import views

urlpatterns = [
    path("", views.list_notes, name="note-list"),
    path("create/", views.create_note, name="note-create"),
    path("<int:pk>/", views.get_note, name="note-detail"),
    path("<int:pk>/update/", views.update_note, name="note-update"),
    path("<int:pk>/delete/", views.delete_note, name="note-delete"),
    path("<int:pk>/archive/", views.toggle_archive, name="note-archive"),
    path("<int:pk>/pin/", views.toggle_pin, name="note-pin"),
]
