from rest_framework.routers import DefaultRouter
from .views import SignupViewSet

router = DefaultRouter()
router.register(r"signups", SignupViewSet, basename="signups")

urlpatterns = router.urls
