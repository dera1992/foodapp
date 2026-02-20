from rest_framework.routers import DefaultRouter
from .views import StateViewSet, LgaViewSet, OrderItemViewSet, OrderViewSet, AddressViewSet, CouponViewSet

router = DefaultRouter()
router.register(r"states", StateViewSet, basename="states")
router.register(r"lgas", LgaViewSet, basename="lgas")
router.register(r"order-items", OrderItemViewSet, basename="order-items")
router.register(r"orders", OrderViewSet, basename="orders")
router.register(r"addresss", AddressViewSet, basename="addresss")
router.register(r"coupons", CouponViewSet, basename="coupons")

urlpatterns = router.urls
