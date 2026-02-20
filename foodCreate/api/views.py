from rest_framework import permissions, viewsets
from foodCreate.models import Category, SubCategory, Products, ProductsImages, ReviewRating
from foodCreate.serializers import CategorySerializer, SubCategorySerializer, ProductsSerializer, ProductsImagesSerializer, ReviewRatingSerializer
from .permissions import IsOwnerOrReadOnly

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]


class SubCategoryViewSet(viewsets.ModelViewSet):
    queryset = SubCategory.objects.all()
    serializer_class = SubCategorySerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]


class ProductsViewSet(viewsets.ModelViewSet):
    queryset = Products.objects.all()
    serializer_class = ProductsSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]


class ProductsImagesViewSet(viewsets.ModelViewSet):
    queryset = ProductsImages.objects.all()
    serializer_class = ProductsImagesSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]


class ReviewRatingViewSet(viewsets.ModelViewSet):
    queryset = ReviewRating.objects.all()
    serializer_class = ReviewRatingSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]


