from rest_framework.routers import DefaultRouter
from .views import UserViewSet, ProfileViewSet, SubscriptionPlanViewSet, ShopViewSet, ShopSubscriptionViewSet, DispatcherProfileViewSet, ShopFollowerViewSet, ShopNotificationViewSet, ShopIntegrationViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='users')
router.register(r'profiles', ProfileViewSet, basename='profiles')
router.register(r'subscription-plans', SubscriptionPlanViewSet, basename='subscription-plans')
router.register(r'shops', ShopViewSet, basename='shops')
router.register(r'shop-subscriptions', ShopSubscriptionViewSet, basename='shop-subscriptions')
router.register(r'dispatcher-profiles', DispatcherProfileViewSet, basename='dispatcher-profiles')
router.register(r'shop-followers', ShopFollowerViewSet, basename='shop-followers')
router.register(r'shop-notifications', ShopNotificationViewSet, basename='shop-notifications')
router.register(r'shop-integrations', ShopIntegrationViewSet, basename='shop-integrations')

urlpatterns = router.urls
