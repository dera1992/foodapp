from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    AddCouponAPIView,
    AddressViewSet,
    CheckoutSummaryAPIView,
    CouponViewSet,
    LgaViewSet,
    LoadCitiesAPIView,
    OrderDetailAPIView,
    OrderItemViewSet,
    OrderTrackingByRefAPIView,
    OrderViewSet,
    OwnerOrdersAPIView,
    PaystackWebhookAPIView,
    PlaceOrderAPIView,
    SavedAddressDetailAPIView,
    SavedAddressesAPIView,
    StateViewSet,
    StripeWebhookAPIView,
    TimeSlotsAPIView,
    TransferAPIView,
    UpdateOrderStatusAPIView,
    UserOrdersAPIView,
    ValidatePromoAPIView,
    VerifyCheckoutPaymentAPIView,
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
    # Legacy / existing
    path("load-cities/", LoadCitiesAPIView.as_view(), name="api-load-cities"),
    path("checkout/", CheckoutSummaryAPIView.as_view(), name="api-checkout-summary"),
    path("my-orders/", UserOrdersAPIView.as_view(), name="api-user-orders"),
    path("my-orders/<str:ref>/", OrderDetailAPIView.as_view(), name="api-order-detail"),
    path("owner-orders/", OwnerOrdersAPIView.as_view(), name="api-owner-orders"),
    path("transfer/", TransferAPIView.as_view(), name="api-transfer"),
    path("add-coupon/", AddCouponAPIView.as_view(), name="api-add-coupon"),
    path("tracking/", OrderTrackingByRefAPIView.as_view(), name="api-order-tracking"),
    path("tracking/<str:ref>/", OrderTrackingByRefAPIView.as_view(), name="api-order-tracking-detail"),
    path("verify-payment/<str:ref>/", VerifyPaymentByRefAPIView.as_view(), name="api-verify-payment-ref"),
    path("status/<int:order_id>/", UpdateOrderStatusAPIView.as_view(), name="api-update-status"),
    # New checkout flow
    path("place-order/", PlaceOrderAPIView.as_view(), name="api-place-order"),
    path("verify-checkout/", VerifyCheckoutPaymentAPIView.as_view(), name="api-verify-checkout"),
    path("webhook/paystack/", PaystackWebhookAPIView.as_view(), name="api-paystack-webhook"),
    path("webhook/stripe/", StripeWebhookAPIView.as_view(), name="api-stripe-webhook"),
    path("time-slots/", TimeSlotsAPIView.as_view(), name="api-time-slots"),
    path("saved-addresses/", SavedAddressesAPIView.as_view(), name="api-saved-addresses"),
    path("saved-addresses/<int:pk>/", SavedAddressDetailAPIView.as_view(), name="api-saved-address-detail"),
    path("validate-promo/", ValidatePromoAPIView.as_view(), name="api-validate-promo"),
] + router.urls
