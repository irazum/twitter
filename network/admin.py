from django.contrib import admin
from .models import User, Tweet


class UserAdmin(admin.ModelAdmin):
    pass


class TweetAdmin(admin.ModelAdmin):
    pass


# Register your models here.
admin.site.register(User)
admin.site.register(Tweet)