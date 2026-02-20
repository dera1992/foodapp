from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, PostViewSet

router = DefaultRouter()
router.register(r"categorys", CategoryViewSet, basename="categorys")
router.register(r"posts", PostViewSet, basename="posts")

urlpatterns = router.urls
