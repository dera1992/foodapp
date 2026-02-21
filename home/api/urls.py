from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    CategoryCountAPIView,
    CustomerAnalyticsAPIView,
    DashboardAPIView,
    DispatcherAnalyticsAPIView,
    FavouriteAPIView,
    FavouritesListAPIView,
    NearbyShopsAPIView,
    ShopAnalyticsAPIView,
    ShopAPIView,
    ShopDetailAPIView,
    ShopNotificationsAPIView,
    SubmitReviewAPIView,
    ToggleShopSubscriptionAPIView,
    WishlistItemViewSet,
    WishlistNotificationViewSet,
)

router = DefaultRouter()
router.register(r"wishlist-items", WishlistItemViewSet, basename="wishlist-items")
router.register(r"wishlist-notifications", WishlistNotificationViewSet, basename="wishlist-notifications")

urlpatterns = [
    path("dashboard/", DashboardAPIView.as_view(), name="api-dashboard"),
    path("analytics/customer/", CustomerAnalyticsAPIView.as_view(), name="api-customer-analytics"),
    path("analytics/dispatcher/", DispatcherAnalyticsAPIView.as_view(), name="api-dispatcher-analytics"),
    path("analytics/shop/", ShopAnalyticsAPIView.as_view(), name="api-shop-analytics"),
    path("shops/", ShopAPIView.as_view(), name="api-shop-list"),
    path("shops/<int:shop_id>/", ShopDetailAPIView.as_view(), name="api-shop-detail"),
    path("products/<int:product_id>/favourite/", FavouriteAPIView.as_view(), name="api-favourite"),
    path("favourites/", FavouritesListAPIView.as_view(), name="api-favourites-list"),
    path("submit-review/<int:post_id>/", SubmitReviewAPIView.as_view(), name="api-submit-review"),
    path("category-count/", CategoryCountAPIView.as_view(), name="api-category-count"),
    path("nearby-shops/", NearbyShopsAPIView.as_view(), name="api-nearby-shops"),
    path("shops/<int:shop_id>/subscribe/", ToggleShopSubscriptionAPIView.as_view(), name="api-toggle-shop-subscription"),
    path("shop-notifications/", ShopNotificationsAPIView.as_view(), name="api-shop-notifications"),
] + router.urls
