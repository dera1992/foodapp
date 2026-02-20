from rest_framework import serializers
from .models import State, Lga, OrderItem, Order, Address, Coupon

class StateSerializer(serializers.ModelSerializer):
    class Meta:
        model = State
        fields = "__all__"


class LgaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lga
        fields = "__all__"


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = "__all__"


class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = "__all__"


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = "__all__"


class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = "__all__"


