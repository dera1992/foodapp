from rest_framework.routers import DefaultRouter
from .views import WishlistItemViewSet, WishlistNotificationViewSet

router = DefaultRouter()
router.register(r"wishlist-items", WishlistItemViewSet, basename="wishlist-items")
router.register(r"wishlist-notifications", WishlistNotificationViewSet, basename="wishlist-notifications")

urlpatterns = router.urls
