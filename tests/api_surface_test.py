from django.test import TestCase
from rest_framework.test import APIClient

from account.models import User


class APISurfaceSmokeTest(TestCase):
    """Smoke tests that ensure the versioned API surface is wired for all apps."""

    def setUp(self):
        self.user = User.objects.create_user(email="smoke@example.com", password="pass1234")
        self.client = APIClient()

    def test_docs_and_schema_routes_exist(self):
        for path in ["/api/schema/", "/api/docs/"]:
            response = self.client.get(path)
            self.assertNotEqual(response.status_code, 404, path)

    def test_app_root_routes_exist_under_api_v1(self):
        self.client.force_authenticate(user=self.user)
        app_paths = [
            "/api/v1/account/users/",
            "/api/v1/blog/posts/",
            "/api/v1/foodcreate/productss/",
            "/api/v1/home/wishlist-items/",
            "/api/v1/comments/comments/",
            "/api/v1/marketing/signups/",
            "/api/v1/search/",
            "/api/v1/owner/informations/",
            "/api/v1/cart/",
            "/api/v1/order/orders/",
            "/api/v1/chat/messages/",
            "/api/v1/budget/budgets/",
            "/api/v1/voice/interpret/",
        ]

        for path in app_paths:
            response = self.client.get(path)
            self.assertNotIn(response.status_code, {404, 500}, path)

    def test_auth_routes_exist_under_api_v1(self):
        auth_routes = {
            "/api/v1/auth/register/": {"email": "new@example.com", "password": "pass1234"},
            "/api/v1/auth/login/": {"email": "smoke@example.com", "password": "pass1234"},
            "/api/v1/auth/token/refresh/": {"refresh": "invalid"},
        }

        for path, payload in auth_routes.items():
            response = self.client.post(path, data=payload, format="json")
            self.assertNotIn(response.status_code, {404, 500}, path)
