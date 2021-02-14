from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse

from .models import User, Tweet
from django.views.decorators.csrf import csrf_exempt
import json


def index(request):
    return render(request, "network/index.html")


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")




@csrf_exempt
def tweets(request):
    # сделать проверку на то, авторизован ли юзер
    if request.method == "POST":
        data = json.loads(request.body)
        tweet = Tweet(text=data['tweetText'], user=request.user)
        tweet.save()
        return JsonResponse(tweet.serialize(request.user))

    else:
        if request.GET.get('type') == "following":
            # get all following users
            users = request.user.following.all()
            # create empty QuerySet
            twts = Tweet.objects.none()
            # get tweets each following user
            for user in users:
                twts = twts.union(Tweet.objects.filter(user=user))

        elif request.GET.get('type') == "allPosts":
            # get all tweets
            twts = Tweet.objects.all()

        else:
            user = User.objects.get(id=int(request.GET.get('type')))
            twts = Tweet.objects.filter(user=user)

        # sorted tweets for timestamp
        twts = twts.order_by("-timestamp")
        # send json-data
        return JsonResponse([tweet.serialize(request.user) for tweet in twts], safe=False)


def profile(request):
    if request.method == "GET":
        user = User.objects.get(id=int(request.GET.get('id')))
        following_num = len(user.following.all())
        followers_num = len(user.user_set.all())

        follow_button = ''
        if not request.user.is_anonymous and user != request.user:
            follow_button = ('Unfollow' if user in request.user.following.all() else 'Follow')

        return JsonResponse({
            'id': user.id,
            'username': user.username,
            'following_num': following_num,
            'followers_num': followers_num,
            'follow_btn': follow_button
        })


def change_status(request):
    if request.method == "GET":

        if request.GET.get('follow'):
            user = User.objects.get(id=int(request.GET.get('id')))
            if user in request.user.following.all():
                request.user.following.remove(user)
            else:
                request.user.following.add(user)
            return JsonResponse({'success': True})

        elif request.GET.get('like'):
            tweet = Tweet.objects.get(id=int(request.GET.get('id')))
            if request.user in tweet.like.all():
                tweet.like.remove(request.user)
            else:
                tweet.like.add(request.user)
            return JsonResponse({'success': True})