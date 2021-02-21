
from django.urls import path, re_path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),

    path("profile", views.profile, name="profile"),
    path("tweets", views.tweets, name="tweets"),
    path("changestatus", views.change_status, name="change_status"),
    path("edit/<str:model>", views.edit, name="edit"),
    path("comments/<int:tweet_id>", views.comments, name="comments"),
    re_path(r"(?P<url>.+)", views.any_url, name="any_url")
]
