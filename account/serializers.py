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
    class Meta:
        model = Shop
        fields = '__all__'


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
