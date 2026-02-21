from django.conf import settings
from django.db.models import Count, Q, Sum
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from account.models import Shop, ShopFollower, ShopNotification
from account.serializers import ShopSerializer
from foodCreate.models import Products, ReviewRating
from foodCreate.serializers import ProductsSerializer, ReviewRatingSerializer
from home.models import WishlistItem, WishlistNotification
from home.serializers import WishlistItemSerializer, WishlistNotificationSerializer
from order.models import Order, OrderItem

from .permissions import IsOwnerOrReadOnly

if settings.GIS_ENABLED:
    from django.contrib.gis.db.models.functions import Distance
    from django.contrib.gis.geos import Point
    from django.contrib.gis.measure import D
else:
    Distance = None
    Point = None
    D = None


class WishlistItemViewSet(viewsets.ModelViewSet):
    queryset = WishlistItem.objects.select_related("user", "product")
    serializer_class = WishlistItemSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]


class WishlistNotificationViewSet(viewsets.ModelViewSet):
    queryset = WishlistNotification.objects.select_related("user", "product", "wishlist_item")
    serializer_class = WishlistNotificationSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]


class DashboardAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(
            {
                "products_count": Products.objects.count(),
                "orders_count": Order.objects.count(),
                "users_count": ShopFollower.objects.values("user").distinct().count(),
                "category_count": Products.objects.values("category").distinct().count(),
            }
        )


class CustomerAnalyticsAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        completed_orders = Order.objects.filter(user=request.user).filter(Q(is_ordered=True) | Q(paid=True) | Q(verified=True))
        order_items = OrderItem.objects.filter(order__in=completed_orders).select_related("item", "item__category", "item__shop")
        total_spend = sum(item.get_final_price() for item in order_items)
        total_orders = completed_orders.count()
        total_items = order_items.aggregate(total=Sum("quantity"))["total"] or 0
        return Response(
            {
                "total_spend": total_spend,
                "total_orders": total_orders,
                "total_items": total_items,
                "wishlist_count": WishlistItem.objects.filter(user=request.user).count(),
                "unread_notifications": WishlistNotification.objects.filter(user=request.user, is_read=False).count(),
            }
        )


class DispatcherAnalyticsAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        delivery_ready = Order.objects.filter(Q(paid=True) | Q(verified=True), being_delivered=False, received=False).count()
        active_deliveries = Order.objects.filter(being_delivered=True, received=False).count()
        completed_deliveries = Order.objects.filter(received=True).count()
        return Response(
            {
                "delivery_ready": delivery_ready,
                "active_deliveries": active_deliveries,
                "completed_deliveries": completed_deliveries,
            }
        )


class ShopAnalyticsAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        shops = Shop.objects.filter(owner=request.user)
        payload = []
        for shop in shops:
            total_products = Products.objects.filter(shop=shop).count()
            followers = shop.followers.count()
            payload.append({"shop": shop.name, "products": total_products, "followers": followers})
        return Response(payload)


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


class FavouritesListAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        products = Products.objects.filter(favourite=request.user, is_active=True)
        return Response(ProductsSerializer(products, many=True).data)


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


class CategoryCountAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        counts = Products.objects.values("category__name").annotate(total=Count("category")).order_by("category__name")
        return Response(list(counts))


class NearbyShopsAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        if not settings.GIS_ENABLED or Point is None:
            return Response({"detail": "GIS not enabled", "shops": []})

        try:
            lat = float(request.query_params.get("lat"))
            lng = float(request.query_params.get("lng"))
        except (TypeError, ValueError):
            return Response({"detail": "lat and lng query params are required"}, status=status.HTTP_400_BAD_REQUEST)

        radius_km = float(request.query_params.get("radius_km", 10))
        user_location = Point(lng, lat, srid=4326)
        shops = (
            Shop.objects.filter(location__isnull=False)
            .annotate(distance=Distance("location", user_location))
            .filter(location__distance_lte=(user_location, D(km=radius_km)))
            .order_by("distance")
        )
        return Response(ShopSerializer(shops, many=True).data)


class ToggleShopSubscriptionAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, shop_id):
        shop = get_object_or_404(Shop, id=shop_id)
        follower, created = ShopFollower.objects.get_or_create(user=request.user, shop=shop)
        if created:
            return Response({"detail": "Subscribed", "subscribed": True}, status=status.HTTP_201_CREATED)
        follower.delete()
        return Response({"detail": "Unsubscribed", "subscribed": False})


class ShopNotificationsAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        notifications = ShopNotification.objects.filter(user=request.user).order_by("-created_at")
        payload = [
            {
                "id": n.id,
                "shop": n.shop.name,
                "product": n.product.title,
                "message": n.message,
                "is_read": n.is_read,
                "created_at": n.created_at,
            }
            for n in notifications
        ]
        return Response(payload)
