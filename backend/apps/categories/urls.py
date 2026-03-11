from django.urls import path

from . import views

urlpatterns = [
    path("", views.list_categories, name="category-list"),
    path("create/", views.create_category, name="category-create"),
    path("<int:pk>/", views.get_category, name="category-detail"),
    path("<int:pk>/update/", views.update_category, name="category-update"),
    path("<int:pk>/delete/", views.delete_category, name="category-delete"),
    path("<int:pk>/notes-count/", views.category_notes_count, name="category-notes-count"),
]
