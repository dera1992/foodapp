from django.shortcuts import get_object_or_404
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from account.models import Shop
from account.serializers import ShopSerializer
from foodCreate.models import Products, ReviewRating
from foodCreate.serializers import ProductsSerializer, ReviewRatingSerializer
from home.models import WishlistItem, WishlistNotification
from home.serializers import WishlistItemSerializer, WishlistNotificationSerializer

from .permissions import IsOwnerOrReadOnly


class WishlistItemViewSet(viewsets.ModelViewSet):
    queryset = WishlistItem.objects.select_related("user", "product")
    serializer_class = WishlistItemSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]


class WishlistNotificationViewSet(viewsets.ModelViewSet):
    queryset = WishlistNotification.objects.select_related("user", "product", "wishlist_item")
    serializer_class = WishlistNotificationSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]


class ShopAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        shops = Shop.objects.filter(is_active=True).order_by("name")
        return Response(ShopSerializer(shops, many=True).data)


class ShopDetailAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, shop_id):
        shop = get_object_or_404(Shop, id=shop_id)
        products = Products.objects.filter(shop=shop, is_active=True)
        return Response({"shop": ShopSerializer(shop).data, "products": ProductsSerializer(products, many=True).data})


class FavouriteAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, product_id):
        product = get_object_or_404(Products, id=product_id)
        product.favourite.add(request.user)
        return Response({"detail": "added to favourites"}, status=status.HTTP_201_CREATED)

    def delete(self, request, product_id):
        product = get_object_or_404(Products, id=product_id)
        product.favourite.remove(request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


class SubmitReviewAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, post_id):
        product = get_object_or_404(Products, id=post_id)
        profile = getattr(request.user, "profile", None)
        if not profile:
            return Response({"detail": "Profile required"}, status=status.HTTP_400_BAD_REQUEST)

        payload = {
            "post": product.id,
            "user": profile.id,
            "subject": request.data.get("subject", ""),
            "review": request.data.get("review", ""),
            "rating": request.data.get("rating", 0),
            "ip": request.META.get("REMOTE_ADDR", ""),
            "status": True,
        }
        serializer = ReviewRatingSerializer(data=payload)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
