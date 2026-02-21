from django.test import TestCase
from rest_framework.test import APIClient

from account.models import Profile, Shop, SubscriptionPlan, User
from foodCreate.models import Category, Products
from home.models import WishlistItem


class HomeAPIContractTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(email="home-contract@example.com", password="Pass12345")
        Profile.objects.create(user=self.user, phone="111111")
        self.plan = SubscriptionPlan.objects.create(name="Basic", price=0, product_limit=10, duration_days=30)
        self.shop = Shop.objects.create(
            owner=self.user,
            name="Contract Shop",
            description="Desc",
            address="Addr",
            subscription=self.plan,
            is_active=True,
        )
        self.category = Category.objects.create(name="Fish")
        self.product = Products.objects.create(shop=self.shop, title="Mackerel", category=self.category, price=2500)
        self.client.force_authenticate(self.user)

    def test_dashboard_contract_contains_expected_keys(self):
        response = self.client.get("/api/v1/home/dashboard/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            set(response.data.keys()),
            {"products_count", "orders_count", "users_count", "category_count"},
        )

    def test_shop_detail_contract_contains_shop_and_products(self):
        response = self.client.get(f"/api/v1/home/shops/{self.shop.id}/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("shop", response.data)
        self.assertIn("products", response.data)
        self.assertTrue(any(p["id"] == self.product.id for p in response.data["products"]))

    def test_toggle_favourite_contract_and_wishlist_side_effect(self):
        self.assertFalse(WishlistItem.objects.filter(user=self.user, product=self.product).exists())

        first = self.client.post(f"/api/v1/home/ads/{self.product.id}/toggle-favourite/")
        self.assertEqual(first.status_code, 200)
        self.assertEqual(first.data, {"is_favourite": True})
        self.assertTrue(WishlistItem.objects.filter(user=self.user, product=self.product).exists())

        second = self.client.post(f"/api/v1/home/ads/{self.product.id}/toggle-favourite/")
        self.assertEqual(second.status_code, 200)
        self.assertEqual(second.data, {"is_favourite": False})
        self.assertFalse(WishlistItem.objects.filter(user=self.user, product=self.product).exists())
