from rest_framework import serializers
from .models import Category, SubCategory, Products, ProductsImages, ReviewRating

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = "__all__"


class SubCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SubCategory
        fields = "__all__"


class ProductsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Products
        fields = "__all__"


class ProductsImagesSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductsImages
        fields = "__all__"


class ReviewRatingSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReviewRating
        fields = "__all__"


