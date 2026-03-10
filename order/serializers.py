from rest_framework import serializers
from .models import Address, Coupon, Lga, Order, OrderItem, SavedAddress, State


class StateSerializer(serializers.ModelSerializer):
    class Meta:
        model = State
        fields = "__all__"


class LgaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lga
        fields = "__all__"


class OrderItemSerializer(serializers.ModelSerializer):
    item_title = serializers.CharField(source='item.title', read_only=True)
    item_price = serializers.DecimalField(source='item.price', max_digits=10, decimal_places=2, read_only=True)
    item_image = serializers.SerializerMethodField()
    line_total = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ['id', 'item', 'item_title', 'item_price', 'item_image', 'quantity', 'is_ordered', 'date_added', 'date_ordered', 'line_total']

    def get_item_image(self, obj):
        try:
            request = self.context.get('request')
            image = obj.item.image
            if image and request:
                return request.build_absolute_uri(image.url)
            return str(image.url) if image else ''
        except Exception:
            return ''

    def get_line_total(self, obj):
        return float(obj.get_final_price())


class OrderSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()
    total = serializers.SerializerMethodField()
    items_summary = serializers.SerializerMethodField()
    items_count = serializers.SerializerMethodField()
    customer_name = serializers.SerializerMethodField()
    customer_email = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', 'ref', 'created', 'updated',
            'is_ordered', 'paid', 'verified', 'being_delivered', 'received',
            'payment_method', 'payment_reference',
            'delivery_address_text', 'delivery_date', 'delivery_slot',
            'contact_name', 'contact_email', 'contact_phone',
            'coupon',
            # computed
            'status', 'total', 'items_count', 'items_summary',
            'customer_name', 'customer_email',
        ]

    def get_status(self, obj):
        return obj.get_status_label()

    def get_total(self, obj):
        try:
            return float(obj.get_total())
        except Exception:
            return 0.0

    def get_items_count(self, obj):
        return obj.items.count()

    def get_items_summary(self, obj):
        """Return a short human-readable list of item names for table display."""
        titles = list(obj.items.select_related('item').values_list('item__title', flat=True)[:3])
        count = obj.items.count()
        if not titles:
            return ''
        label = ', '.join(titles)
        if count > 3:
            label += f' +{count - 3} more'
        return label

    def get_customer_name(self, obj):
        return obj.contact_name or (obj.user.get_full_name() if obj.user_id else '')

    def get_customer_email(self, obj):
        return obj.contact_email or (obj.user.email if obj.user_id else '')


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = "__all__"


class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = "__all__"


class SavedAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedAddress
        fields = ['id', 'label', 'line1', 'line2', 'city', 'county', 'postcode', 'created_at']
        read_only_fields = ['id', 'created_at']
