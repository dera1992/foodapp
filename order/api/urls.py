from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    AddressViewSet,
    CouponViewSet,
    LgaViewSet,
    LoadCitiesAPIView,
    OrderItemViewSet,
    OrderViewSet,
    OwnerOrdersAPIView,
    StateViewSet,
    UserOrdersAPIView,
)

router = DefaultRouter()
router.register(r"states", StateViewSet, basename="states")
router.register(r"lgas", LgaViewSet, basename="lgas")
router.register(r"order-items", OrderItemViewSet, basename="order-items")
router.register(r"orders", OrderViewSet, basename="orders")
router.register(r"addresses", AddressViewSet, basename="addresses")
router.register(r"coupons", CouponViewSet, basename="coupons")

urlpatterns = [
    path("load-cities/", LoadCitiesAPIView.as_view(), name="api-load-cities"),
    path("my-orders/", UserOrdersAPIView.as_view(), name="api-user-orders"),
    path("owner-orders/", OwnerOrdersAPIView.as_view(), name="api-owner-orders"),
] + router.urls
