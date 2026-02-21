from django.utils import timezone
from rest_framework.test import APITestCase

from account.models import Profile, Shop, SubscriptionPlan, User
from foodCreate.models import Category, Products
from home.models import WishlistItem


class APIPlatformTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="user@example.com", password="Pass12345")
        self.other_user = User.objects.create_user(email="other@example.com", password="Pass12345")
        self.profile = Profile.objects.create(user=self.user, phone="123456")
        Profile.objects.create(user=self.other_user, phone="654321")
        self.plan = SubscriptionPlan.objects.create(name="Basic", price=0, product_limit=10, duration_days=30)
        self.shop = Shop.objects.create(owner=self.user, name="My Shop", description="d", address="Addr", subscription=self.plan)
        self.category = Category.objects.create(name="Fish")
        self.product = Products.objects.create(shop=self.shop, title="Tilapia", category=self.category, price=1000)

    def test_auth_register_login_refresh_flow(self):
        register = self.client.post(
            "/api/v1/auth/register/",
            {"email": "new@example.com", "password": "Pass12345", "first_name": "New"},
            format="json",
        )
        self.assertEqual(register.status_code, 201)
        self.assertIn("activation_url", register.data)

        from account.models import User
        from account.tokens import account_activation_token
        from django.utils.encoding import force_bytes
        from django.utils.http import urlsafe_base64_encode

        user = User.objects.get(email="new@example.com")
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = account_activation_token.make_token(user)
        activate = self.client.post(f"/api/v1/auth/activate/{uid}/{token}/")
        self.assertEqual(activate.status_code, 200)

        login = self.client.post(
            "/api/v1/auth/login/",
            {"email": "new@example.com", "password": "Pass12345"},
            format="json",
        )
        self.assertEqual(login.status_code, 200)

        refresh = self.client.post(
            "/api/v1/auth/token/refresh/",
            {"refresh": login.data["refresh"]},
            format="json",
        )
        self.assertEqual(refresh.status_code, 200)

    def test_permissions_and_module_access(self):
        self.assertIn(self.client.get("/api/v1/budget/budgets/").status_code, {401, 403})
        self.assertEqual(self.client.get("/api/v1/blog/posts/").status_code, 200)
        self.assertEqual(self.client.get("/api/v1/search/").status_code, 200)

        self.client.force_authenticate(self.user)
        other_profile_id = Profile.objects.get(user=self.other_user).id
        resp = self.client.patch(f"/api/v1/account/profiles/{other_profile_id}/", {"phone": "999"}, format="json")
        self.assertEqual(resp.status_code, 403)

    def test_basic_crud_and_validation_samples(self):
        bad_register = self.client.post("/api/v1/auth/register/", {"email": "bad@example.com"}, format="json")
        self.assertEqual(bad_register.status_code, 400)
        self.assertIn("error", bad_register.data)

        self.client.force_authenticate(self.user)

        blog_category = self.client.post("/api/v1/blog/categorys/", {"title": "Seafood"}, format="json")
        self.assertEqual(blog_category.status_code, 201)

        post = self.client.post(
            "/api/v1/blog/posts/",
            {
                "profile": self.profile.id,
                "title": "Fresh catch",
                "publish": timezone.now().date(),
                "categories": [blog_category.data["id"]],
                "draft": False,
            },
            format="json",
        )
        self.assertEqual(post.status_code, 201)

        budget = self.client.post("/api/v1/budget/budgets/", {"user": self.user.id, "total_budget": "5000.00"}, format="json")
        self.assertEqual(budget.status_code, 201)

        self.assertEqual(self.client.post("/api/v1/cart/add/", {"product_id": self.product.id, "quantity": 2}, format="json").status_code, 201)
        self.assertEqual(self.client.get("/api/v1/cart/").status_code, 200)

        self.assertEqual(self.client.post("/api/v1/marketing/signups/", {}, format="json").status_code, 400)

        self.assertEqual(self.client.get("/api/v1/home/shops/").status_code, 200)
        self.assertEqual(self.client.get(f"/api/v1/home/shops/{self.shop.id}/").status_code, 200)

        # account helper endpoints
        self.assertEqual(self.client.get("/api/v1/auth/me/").status_code, 200)
        self.assertEqual(self.client.post("/api/v1/auth/choose-role/", {"role": "customer"}, format="json").status_code, 200)

        # search recommendations
        self.assertEqual(self.client.get("/api/v1/search/recommendations/").status_code, 200)

        # chat flows
        send = self.client.post("/api/v1/chat/send/", {"receiver_id": self.other_user.id, "shop_id": self.shop.id, "content": "hello"}, format="json")
        self.assertEqual(send.status_code, 201)
        self.assertEqual(self.client.get("/api/v1/chat/inbox/").status_code, 200)
        self.assertEqual(self.client.get(f"/api/v1/chat/thread/{self.shop.id}/{self.other_user.id}/").status_code, 200)

        # order helper endpoints
        self.assertEqual(self.client.get("/api/v1/order/load-cities/?state=").status_code, 200)
        self.assertEqual(self.client.get("/api/v1/order/my-orders/").status_code, 200)
        self.assertEqual(self.client.get("/api/v1/order/owner-orders/").status_code, 200)

        # blog helper routes
        self.assertEqual(self.client.get(f"/api/v1/blog/posts/by-slug/{post.data['slug']}/").status_code, 200)
        self.assertEqual(self.client.get("/api/v1/blog/category-count/").status_code, 200)

        # owner helper routes
        self.assertEqual(self.client.get("/api/v1/owner/my-cart/").status_code, 200)
        self.assertEqual(self.client.get("/api/v1/owner/bookmarked/").status_code, 200)
        self.assertEqual(self.client.get("/api/v1/owner/about-us/").status_code, 200)
        self.assertEqual(self.client.get("/api/v1/owner/faq/").status_code, 200)

        # voice helper routes
        self.assertEqual(self.client.get("/api/v1/voice/search/").status_code, 200)
        self.assertEqual(self.client.get("/api/v1/voice/budget/").status_code, 200)

        # home parity helper routes
        self.assertEqual(self.client.get("/api/v1/home/category-count/").status_code, 200)
        self.assertNotIn(self.client.get("/api/v1/home/nearby-shops/").status_code, {404, 500})
        self.assertEqual(self.client.post(f"/api/v1/home/shops/{self.shop.id}/subscribe/").status_code in (200,201), True)
        self.assertEqual(self.client.get("/api/v1/home/shop-notifications/").status_code, 200)
        self.assertEqual(self.client.get("/api/v1/home/dashboard/").status_code, 200)
        self.assertEqual(self.client.get("/api/v1/home/analytics/customer/").status_code, 200)
        self.assertEqual(self.client.get("/api/v1/home/analytics/dispatcher/").status_code, 200)
        self.assertEqual(self.client.get("/api/v1/home/analytics/shop/").status_code, 200)
        self.assertEqual(self.client.get("/api/v1/home/favourites/").status_code, 200)

        # cart parity helper routes
        self.assertEqual(self.client.post("/api/v1/cart/add-to-cart/", {"product_id": self.product.id, "quantity": 1}, format="json").status_code, 201)
        self.assertEqual(self.client.post("/api/v1/cart/add-to-cart-ajax/", {"product_id": self.product.id, "quantity": 1}, format="json").status_code, 201)
        self.assertNotIn(self.client.get("/api/v1/cart/order-summary/").status_code, {404, 500})

        # order parity helper routes
        self.assertNotIn(self.client.get("/api/v1/order/checkout/").status_code, {404, 500})
        self.assertNotIn(self.client.post("/api/v1/order/transfer/", format="json").status_code, {404, 500})
        self.assertNotIn(self.client.post("/api/v1/order/add-coupon/", {"code": "NONE"}, format="json").status_code, {404, 500})
        self.assertNotIn(self.client.post("/api/v1/order/status/1/", {"status": "received"}, format="json").status_code, {404, 500})

        # budget parity helper routes
        budget_id = budget.data["id"]
        self.assertNotIn(self.client.post(f"/api/v1/budget/budgets/{budget_id}/duplicate/", format="json").status_code, {404, 500})
        self.assertNotIn(self.client.post(f"/api/v1/budget/budgets/{budget_id}/from-cart/", format="json").status_code, {404, 500})
        self.assertNotIn(self.client.get("/api/v1/budget/products/autocomplete/?q=tila").status_code, {404, 500})

        # remaining home legacy-style routes
        self.assertEqual(self.client.get("/api/v1/home/ads/").status_code, 200)
        self.assertEqual(self.client.get("/api/v1/home/ads/all/").status_code, 200)
        self.assertEqual(self.client.get("/api/v1/home/ads/customers/").status_code, 200)
        self.assertEqual(self.client.get(f"/api/v1/home/ads/{self.product.id}/{self.product.slug}/").status_code, 200)
        self.assertEqual(self.client.get(f"/api/v1/home/ads/{self.product.id}/{self.product.slug}/preview/").status_code, 200)
        self.assertEqual(self.client.post(f"/api/v1/home/ads/{self.product.id}/toggle-favourite/").status_code, 200)
        wishlist_item = WishlistItem.objects.get_or_create(user=self.user, product=self.product)[0]
        self.assertEqual(self.client.post(f"/api/v1/home/wishlist/{wishlist_item.id}/preferences/", {"notify_on_restock": True, "notify_on_price_drop": False}, format="json").status_code, 200)
