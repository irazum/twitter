
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),

    path("profile", views.profile, name="profile"),
    path("tweets", views.tweets, name="tweets"),
    path("changestatus", views.change_status, name="change_status"),
    path("edit/tweet", views.edit_tweet, name="edit_tweet")
]
