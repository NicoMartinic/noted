from django.urls import path

from . import views

urlpatterns = [
    path("csrf/", views.get_csrf_token, name="auth-csrf"),
    path("register/", views.register_user, name="auth-register"),
    path("login/", views.login_user, name="auth-login"),
    path("logout/", views.logout_user, name="auth-logout"),
    path("refresh/", views.refresh_token, name="auth-refresh"),
]
