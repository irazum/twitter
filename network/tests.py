from django.test import TestCase, Client, RequestFactory
from .models import User, Tweet

import json


class NetworkCaseTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='test',  password='1234')
        self.client = Client()
        Tweet.objects.create(text='tesT', user=self.user)

    def test_tweets_url(self):
        response = self.client.get('/tweets', {'type': 'allPosts', 'page': 1})
        self.assertEqual(json.loads(response.content)['tweets'][0]['text'], 'tesT')

    def test_tweets_url_login(self):
        log = self.client.login(username='test', password='1234')
        self.assertTrue(log)

    def test_tweets_url_2(self):
        self.client.login(username=self.user.username, password='1234')
        response = self.client.get('/tweets', {'type': 'following', 'page': 1})
        self.assertEqual(response.status_code, 200)


