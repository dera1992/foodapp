from django.test import TestCase
from rest_framework.test import APIClient

from account.models import Shop, SubscriptionPlan, User
from foodCreate.models import Category, Products
from order.models import Order, OrderItem


class OrderAPIContractTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(email="order-contract@example.com", password="Pass12345")
        self.plan = SubscriptionPlan.objects.create(name="Basic", price=0, product_limit=10, duration_days=30)
        self.shop = Shop.objects.create(owner=self.user, name="Order Shop", description="Desc", address="Addr", subscription=self.plan)
        self.category = Category.objects.create(name="Crab")
        self.product = Products.objects.create(shop=self.shop, title="Blue Crab", category=self.category, price=3000)
        self.client.force_authenticate(self.user)

    def test_checkout_without_active_order_returns_contract_shape(self):
        response = self.client.get("/api/v1/order/checkout/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["detail"], "No active order")
        self.assertIsNone(response.data["order"])
        self.assertEqual(response.data["states"], [])
        self.assertEqual(response.data["cities"], [])

    def test_transfer_marks_order_and_items_as_ordered(self):
        item = OrderItem.objects.create(user=self.user, item=self.product, quantity=2)
        order = Order.objects.create(user=self.user, is_ordered=False)
        order.items.add(item)

        response = self.client.post("/api/v1/order/transfer/", format="json")
        self.assertEqual(response.status_code, 200)

        order.refresh_from_db()
        item.refresh_from_db()
        self.assertTrue(order.is_ordered)
        self.assertTrue(item.is_ordered)

    def test_tracking_without_ref_returns_validation_error(self):
        response = self.client.get("/api/v1/order/tracking/")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data, {"detail": "ref is required"})
