from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, SubCategoryViewSet, ProductsViewSet, ProductsImagesViewSet, ReviewRatingViewSet

router = DefaultRouter()
router.register(r"categorys", CategoryViewSet, basename="categorys")
router.register(r"sub-categorys", SubCategoryViewSet, basename="sub-categorys")
router.register(r"productss", ProductsViewSet, basename="productss")
router.register(r"products-imagess", ProductsImagesViewSet, basename="products-imagess")
router.register(r"review-ratings", ReviewRatingViewSet, basename="review-ratings")

urlpatterns = router.urls
