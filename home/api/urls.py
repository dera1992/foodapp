from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    FavouriteAPIView,
    ShopAPIView,
    ShopDetailAPIView,
    SubmitReviewAPIView,
    WishlistItemViewSet,
    WishlistNotificationViewSet,
)

router = DefaultRouter()
router.register(r"wishlist-items", WishlistItemViewSet, basename="wishlist-items")
router.register(r"wishlist-notifications", WishlistNotificationViewSet, basename="wishlist-notifications")

urlpatterns = [
    path("shops/", ShopAPIView.as_view(), name="api-shop-list"),
    path("shops/<int:shop_id>/", ShopDetailAPIView.as_view(), name="api-shop-detail"),
    path("products/<int:product_id>/favourite/", FavouriteAPIView.as_view(), name="api-favourite"),
    path("submit-review/<int:post_id>/", SubmitReviewAPIView.as_view(), name="api-submit-review"),
] + router.urls
