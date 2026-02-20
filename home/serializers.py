from rest_framework import serializers
from .models import WishlistItem, WishlistNotification

class WishlistItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = WishlistItem
        fields = "__all__"


class WishlistNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = WishlistNotification
        fields = "__all__"


