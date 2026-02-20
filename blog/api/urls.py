from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import CategoryCountAPIView, CategoryViewSet, PostBySlugAPIView, PostViewSet

router = DefaultRouter()
router.register(r"categorys", CategoryViewSet, basename="categorys")
router.register(r"posts", PostViewSet, basename="posts")

urlpatterns = [
    path("posts/by-slug/<slug:slug>/", PostBySlugAPIView.as_view(), name="blog-post-by-slug-api"),
    path("category-count/", CategoryCountAPIView.as_view(), name="blog-category-count-api"),
] + router.urls
