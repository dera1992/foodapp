from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    AboutAPIView,
    AffiliateViewSet,
    BookmarkedAPIView,
    DeleteOrHidePostAPIView,
    FAQAPIView,
    InformationViewSet,
    MyCartAPIView,
    PaymentStatusAPIView,
)

router = DefaultRouter()
router.register(r"informations", InformationViewSet, basename="informations")
router.register(r"affiliates", AffiliateViewSet, basename="affiliates")

urlpatterns = [
    path("my-cart/", MyCartAPIView.as_view(), name="owner-my-cart-api"),
    path("bookmarked/", BookmarkedAPIView.as_view(), name="owner-bookmarked-api"),
    path("delete-post/<int:pk>/", DeleteOrHidePostAPIView.as_view(), name="owner-delete-post-api"),
    path("hide-post/<int:pk>/", DeleteOrHidePostAPIView.as_view(), name="owner-hide-post-api"),
    path("about-us/", AboutAPIView.as_view(), name="owner-about-api"),
    path("faq/", FAQAPIView.as_view(), name="owner-faq-api"),
    path("payment/<str:state>/", PaymentStatusAPIView.as_view(), name="owner-payment-status-api"),
] + router.urls
