from rest_framework import serializers
from .models import Category, DayOption, DeliveryMethod, LabelOption, Products, ProductsImages, ReviewRating, StatusOption, SubCategory

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = "__all__"


class SubCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SubCategory
        fields = "__all__"


class ProductsSerializer(serializers.ModelSerializer):
    label = serializers.SlugRelatedField(
        slug_field="code",
        queryset=LabelOption.objects.all(),
        allow_null=True,
        required=False,
    )
    status = serializers.SlugRelatedField(
        slug_field="code",
        queryset=StatusOption.objects.all(),
        allow_null=True,
        required=False,
    )
    delivery = serializers.SlugRelatedField(
        slug_field="code",
        queryset=DeliveryMethod.objects.all(),
        allow_null=True,
        required=False,
    )
    delivery_time = serializers.SlugRelatedField(
        slug_field="code",
        queryset=DayOption.objects.all(),
        allow_null=True,
        required=False,
    )

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


