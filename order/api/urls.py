from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    AddCouponAPIView,
    AddressViewSet,
    CheckoutSummaryAPIView,
    CouponViewSet,
    LgaViewSet,
    LoadCitiesAPIView,
    OrderItemViewSet,
    OrderTrackingByRefAPIView,
    OrderViewSet,
    OwnerOrdersAPIView,
    StateViewSet,
    TransferAPIView,
    UpdateOrderStatusAPIView,
    UserOrdersAPIView,
    VerifyPaymentByRefAPIView,
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
    path("checkout/", CheckoutSummaryAPIView.as_view(), name="api-checkout-summary"),
    path("my-orders/", UserOrdersAPIView.as_view(), name="api-user-orders"),
    path("owner-orders/", OwnerOrdersAPIView.as_view(), name="api-owner-orders"),
    path("transfer/", TransferAPIView.as_view(), name="api-transfer"),
    path("add-coupon/", AddCouponAPIView.as_view(), name="api-add-coupon"),
    path("tracking/", OrderTrackingByRefAPIView.as_view(), name="api-order-tracking"),
    path("tracking/<str:ref>/", OrderTrackingByRefAPIView.as_view(), name="api-order-tracking-detail"),
    path("verify-payment/<str:ref>/", VerifyPaymentByRefAPIView.as_view(), name="api-verify-payment-ref"),
    path("status/<int:order_id>/", UpdateOrderStatusAPIView.as_view(), name="api-update-status"),
] + router.urls
