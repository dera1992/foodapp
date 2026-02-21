from rest_framework import serializers
from rest_framework.views import APIView


class EmptySerializer(serializers.Serializer):
    """Fallback serializer to keep OpenAPI generation stable for APIView-only handlers."""


class DocumentedAPIView(APIView):
    serializer_class = EmptySerializer
