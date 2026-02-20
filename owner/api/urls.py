from rest_framework.routers import DefaultRouter
from .views import InformationViewSet, AffiliateViewSet

router = DefaultRouter()
router.register(r"informations", InformationViewSet, basename="informations")
router.register(r"affiliates", AffiliateViewSet, basename="affiliates")

urlpatterns = router.urls
