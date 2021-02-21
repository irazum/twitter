# Generated by Django 3.1.5 on 2021-02-13 10:55

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('network', '0003_auto_20210211_1731'),
    ]

    operations = [
        migrations.AddField(
            model_name='tweet',
            name='like',
            field=models.ManyToManyField(related_name='likes', to=settings.AUTH_USER_MODEL),
        ),
        migrations.DeleteModel(
            name='Like',
        ),
    ]