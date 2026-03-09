from django.db.models import Avg, Count
from rest_framework import serializers
from .models import User, Profile, SubscriptionPlan, Shop, ShopSubscription, DispatcherProfile, ShopFollower, ShopNotification, ShopIntegration


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name", "phone_number", "role", "is_active", "password"]

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save(update_fields=["password"])
        return user


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = '__all__'


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = '__all__'


class ShopSerializer(serializers.ModelSerializer):
    is_shop_open = serializers.SerializerMethodField()
    products_count = serializers.SerializerMethodField()
    subscriber_count = serializers.SerializerMethodField()
    rating = serializers.SerializerMethodField()

    class Meta:
        model = Shop
        fields = '__all__'
        read_only_fields = ['id_number']

    def get_is_shop_open(self, obj):
        return obj.is_shop_open()

    def get_products_count(self, obj):
        return obj.products_set.filter(is_active=True).count()

    def get_subscriber_count(self, obj):
        return obj.followers.count()

    def get_rating(self, obj):
        summary = obj.products_set.filter(is_active=True).aggregate(
            average=Avg("reviewrating__rating"),
            total=Count("reviewrating__id"),
        )
        average = summary.get("average")
        return round(float(average), 1) if average is not None else None


class ShopSubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShopSubscription
        fields = '__all__'


class DispatcherProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = DispatcherProfile
        fields = '__all__'


class ShopFollowerSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShopFollower
        fields = '__all__'


class ShopNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShopNotification
        fields = '__all__'


class ShopIntegrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShopIntegration
        fields = '__all__'
