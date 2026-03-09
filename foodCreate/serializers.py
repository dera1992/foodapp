from rest_framework import serializers
from django.utils import timezone
from datetime import timedelta
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
    image = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()
    category_name = serializers.SerializerMethodField()
    subcategory_name = serializers.SerializerMethodField()
    shop_name = serializers.SerializerMethodField()
    recent_purchase_count = serializers.SerializerMethodField()
    shop = serializers.PrimaryKeyRelatedField(read_only=True)
    slug = serializers.SlugField(read_only=True)
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

    def _build_media_url(self, file_field):
        if not file_field:
            return None
        try:
            url = file_field.url
        except Exception:
            return None
        request = self.context.get("request")
        return request.build_absolute_uri(url) if request else url

    def get_image(self, obj):
        first_image = obj.images.first()
        if not first_image:
            return None
        return self._build_media_url(first_image.product_image)

    def get_images(self, obj):
        payload = []
        for image in obj.images.all():
            image_url = self._build_media_url(image.product_image)
            if not image_url:
                continue
            payload.append(
                {
                    "id": image.id,
                    "image": image_url,
                    "product_image": image_url,
                }
            )
        return payload

    def get_category_name(self, obj):
        return getattr(obj.category, "name", None)

    def get_subcategory_name(self, obj):
        return getattr(obj.subcategory, "name", None)

    def get_shop_name(self, obj):
        return getattr(obj.shop, "name", None)

    def get_recent_purchase_count(self, obj):
        since = timezone.now() - timedelta(days=30)
        return obj.order_items.filter(is_ordered=True, date_ordered__gte=since).count()

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


