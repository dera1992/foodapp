from rest_framework import permissions

from seafood.api.schema import DocumentedAPIView
from rest_framework.response import Response

from foodCreate.serializers import ProductsSerializer
from search.recommendations import get_recommended_products
from search.serializers import SearchQuerySerializer
from search.services import filter_products


class SearchAPIView(DocumentedAPIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        serializer = SearchQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        qs = filter_products(
            query=data.get("query"),
            price_min=data.get("price_min"),
            price_max=data.get("price_max"),
            category=data.get("category"),
            nearby_only=data.get("nearby_only", False),
            user=request.user,
        )
        return Response(ProductsSerializer(qs[:50], many=True).data)


class RecommendationsAPIView(DocumentedAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        recommended_products, user_location = get_recommended_products(request.user)
        return Response(
            {
                "recommended_products": ProductsSerializer(recommended_products, many=True).data,
                "user_location": user_location,
            }
        )
