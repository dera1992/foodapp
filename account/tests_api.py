from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from account.models import Profile, User
from account.serializers import UserSerializer


class AuthFlowAPITests(APITestCase):
    def test_register_login_refresh_flow(self):
        register_url = "/api/v1/auth/register/"
        payload = {
            "email": "newuser@example.com",
            "password": "StrongPass123!",
            "first_name": "New",
            "last_name": "User",
        }
        response = self.client.post(register_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

        login_response = self.client.post(
            "/api/v1/auth/login/",
            {"email": payload["email"], "password": payload["password"]},
            format="json",
        )
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        refresh_response = self.client.post(
            "/api/v1/auth/token/refresh/",
            {"refresh": login_response.data["refresh"]},
            format="json",
        )
        self.assertEqual(refresh_response.status_code, status.HTTP_200_OK)
        self.assertIn("access", refresh_response.data)


class PermissionAPITests(APITestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(email="u1@example.com", password="Pass12345")
        self.user2 = User.objects.create_user(email="u2@example.com", password="Pass12345")
        self.profile1 = Profile.objects.create(user=self.user1, phone="123")
        self.profile2 = Profile.objects.create(user=self.user2, phone="456")

    def test_unauthenticated_budget_access_denied(self):
        response = self.client.get("/api/v1/budget/budgets/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_cannot_update_other_profile(self):
        self.client.force_authenticate(self.user1)
        response = self.client.patch(
            f"/api/v1/account/profiles/{self.profile2.id}/",
            {"phone": "999"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class ModuleSmokeAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="smoke@example.com", password="Pass12345")

    def test_module_endpoints_are_wired(self):
        public_urls = [
            "/api/v1/blog/posts/",
            "/api/v1/blog/categorys/",
            "/api/v1/search/",
            "/api/v1/order/states/",
            "/api/v1/marketing/signups/",
            "/api/schema/",
        ]
        for url in public_urls:
            response = self.client.get(url)
            self.assertNotEqual(response.status_code, status.HTTP_404_NOT_FOUND, msg=url)

        self.client.force_authenticate(self.user)
        private_urls = [
            "/api/v1/account/users/",
            "/api/v1/cart/",
            "/api/v1/chat/messages/",
            "/api/v1/comments/comments/",
            "/api/v1/foodcreate/productss/",
            "/api/v1/home/wishlist-items/",
            "/api/v1/owner/informations/",
            "/api/v1/budget/budgets/",
            "/api/v1/voice/interpret/",
        ]
        for url in private_urls:
            if url.endswith("interpret/"):
                response = self.client.post(url, {"text": "find fish"}, format="json")
            else:
                response = self.client.get(url)
            self.assertNotEqual(response.status_code, status.HTTP_404_NOT_FOUND, msg=url)


class SerializerValidationTests(APITestCase):
    def test_user_serializer_requires_password(self):
        serializer = UserSerializer(data={"email": "no-pass@example.com"})
        self.assertFalse(serializer.is_valid())
        self.assertIn("password", serializer.errors)
