from django.urls import path

from . import views

urlpatterns = [
    path("me/", views.get_me, name="user-me"),
    path("me/update/", views.update_self, name="user-update"),
]
