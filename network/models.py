from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    following = models.ManyToManyField('self', symmetrical=False)


class Tweet(models.Model):
    text = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tweets')
    like = models.ManyToManyField(User, related_name='likes')
    edit = models.BooleanField(null=True)

    def serialize(self, user=None):
        if user and not user.is_anonymous:
            like = (1 if user in self.like.all() else 0)
        else:
            like = ''

        own = (1 if self.user == user else '')

        return {
            'id': self.id,
            "user_id": self.user.id,
            "username": self.user.username,
            "text": self.text,
            "timestamp": self.timestamp.strftime("%b %d %Y, %I:%M %p"),
            'edit': self.edit,
            'like': like,
            'own': own
        }

