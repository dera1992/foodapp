from rest_framework import serializers


class SearchQuerySerializer(serializers.Serializer):
    query = serializers.CharField(required=False, allow_blank=True)
    price_min = serializers.DecimalField(required=False, max_digits=10, decimal_places=2)
    price_max = serializers.DecimalField(required=False, max_digits=10, decimal_places=2)
    category = serializers.CharField(required=False, allow_blank=True)
    nearby_only = serializers.BooleanField(required=False, default=False)
