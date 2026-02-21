from django.conf import settings
from django.db.models import Count, Q, Sum
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status, viewsets
from rest_framework import serializers
from rest_framework.views import APIView
from rest_framework.response import Response

from account.models import Shop, ShopFollower, ShopNotification
from account.serializers import ShopSerializer
from foodCreate.models import Products, ReviewRating
from foodCreate.serializers import ProductsSerializer, ReviewRatingSerializer
from home.models import WishlistItem, WishlistNotification
from home.serializers import WishlistItemSerializer, WishlistNotificationSerializer
from order.models import Order, OrderItem

from .permissions import IsOwnerOrReadOnly
from drf_spectacular.utils import extend_schema

if settings.GIS_ENABLED:
    from django.contrib.gis.db.models.functions import Distance
    from django.contrib.gis.geos import Point
    from django.contrib.gis.measure import D
else:
    Distance = None
    Point = None
    D = None


class APIPayloadSerializer(serializers.Serializer):
    pass


class HomeAPIView(APIView):
    serializer_class = APIPayloadSerializer

    def _get_product(self, product_id):
        return get_object_or_404(Products, id=product_id)


class AuthenticatedHomeAPIView(HomeAPIView):
    permission_classes = [permissions.IsAuthenticated]


class PublicHomeAPIView(HomeAPIView):
    permission_classes = [permissions.AllowAny]


class WishlistItemViewSet(viewsets.ModelViewSet):
    queryset = WishlistItem.objects.select_related("user", "product")
    serializer_class = WishlistItemSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]


class WishlistNotificationViewSet(viewsets.ModelViewSet):
    queryset = WishlistNotification.objects.select_related("user", "product", "wishlist_item")
    serializer_class = WishlistNotificationSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]


class DashboardAPIView(AuthenticatedHomeAPIView):

    @extend_schema(responses=APIPayloadSerializer)
    def get(self, request):
        return Response(
            {
                "products_count": Products.objects.count(),
                "orders_count": Order.objects.count(),
                "users_count": ShopFollower.objects.values("user").distinct().count(),
                "category_count": Products.objects.values("category").distinct().count(),
            }
        )


class CustomerAnalyticsAPIView(AuthenticatedHomeAPIView):

    @extend_schema(responses=APIPayloadSerializer)
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


class DispatcherAnalyticsAPIView(AuthenticatedHomeAPIView):

    @extend_schema(responses=APIPayloadSerializer)
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


class ShopAnalyticsAPIView(AuthenticatedHomeAPIView):

    @extend_schema(responses=APIPayloadSerializer)
    def get(self, request):
        shops = Shop.objects.filter(owner=request.user)
        payload = []
        for shop in shops:
            total_products = Products.objects.filter(shop=shop).count()
            followers = shop.followers.count()
            payload.append({"shop": shop.name, "products": total_products, "followers": followers})
        return Response(payload)


class ShopAPIView(PublicHomeAPIView):

    @extend_schema(responses=APIPayloadSerializer)
    def get(self, request):
        shops = Shop.objects.filter(is_active=True).order_by("name")
        return Response(ShopSerializer(shops, many=True).data)


class ShopDetailAPIView(PublicHomeAPIView):

    @extend_schema(responses=APIPayloadSerializer)
    def get(self, request, shop_id):
        shop = get_object_or_404(Shop, id=shop_id)
        products = Products.objects.filter(shop=shop, is_active=True)
        return Response({"shop": ShopSerializer(shop).data, "products": ProductsSerializer(products, many=True).data})


class FavouriteAPIView(AuthenticatedHomeAPIView):

    @extend_schema(responses=APIPayloadSerializer)
    def post(self, request, product_id):
        product = self._get_product(product_id)
        product.favourite.add(request.user)
        return Response({"detail": "added to favourites"}, status=status.HTTP_201_CREATED)

    @extend_schema(responses=APIPayloadSerializer)
    def delete(self, request, product_id):
        product = self._get_product(product_id)
        product.favourite.remove(request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


class FavouritesListAPIView(AuthenticatedHomeAPIView):

    @extend_schema(responses=APIPayloadSerializer)
    def get(self, request):
        products = Products.objects.filter(favourite=request.user, is_active=True)
        return Response(ProductsSerializer(products, many=True).data)


class SubmitReviewAPIView(AuthenticatedHomeAPIView):

    @extend_schema(responses=APIPayloadSerializer)
    def post(self, request, post_id):
        product = self._get_product(post_id)
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


class CategoryCountAPIView(PublicHomeAPIView):

    @extend_schema(responses=APIPayloadSerializer)
    def get(self, request):
        counts = Products.objects.values("category__name").annotate(total=Count("category")).order_by("category__name")
        return Response(list(counts))


class NearbyShopsAPIView(PublicHomeAPIView):

    @extend_schema(responses=APIPayloadSerializer)
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


class ToggleShopSubscriptionAPIView(AuthenticatedHomeAPIView):

    @extend_schema(responses=APIPayloadSerializer)
    def post(self, request, shop_id):
        shop = get_object_or_404(Shop, id=shop_id)
        follower, created = ShopFollower.objects.get_or_create(user=request.user, shop=shop)
        if created:
            return Response({"detail": "Subscribed", "subscribed": True}, status=status.HTTP_201_CREATED)
        follower.delete()
        return Response({"detail": "Unsubscribed", "subscribed": False})


class ShopNotificationsAPIView(AuthenticatedHomeAPIView):

    @extend_schema(responses=APIPayloadSerializer)
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


class AdsListAPIView(APIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = APIPayloadSerializer

    @extend_schema(responses=APIPayloadSerializer)
    def get(self, request):
        category_slug = request.query_params.get("category_slug")
        ads = Products.objects.filter(available=True, is_active=True).order_by("-created_at")
        if category_slug:
            ads = ads.filter(category__slug=category_slug)
        return Response(ProductsSerializer(ads, many=True).data)


class AllAdsListAPIView(APIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = APIPayloadSerializer

    @extend_schema(responses=APIPayloadSerializer)
    def get(self, request):
        ads = Products.objects.filter(is_active=True).order_by("-created_at")
        return Response(ProductsSerializer(ads, many=True).data)


class CustomerListAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = APIPayloadSerializer

    @extend_schema(responses=APIPayloadSerializer)
    def get(self, request):
        ads = Products.objects.filter(available=True, is_active=True).order_by("-created_at")
        return Response(ProductsSerializer(ads, many=True).data)


class AdDetailAPIView(APIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = APIPayloadSerializer

    @extend_schema(responses=APIPayloadSerializer)
    def get(self, request, id, slug):
        ad = get_object_or_404(Products, id=id, slug=slug, is_active=True)
        return Response(ProductsSerializer(ad).data)


class AdPreviewAPIView(APIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = APIPayloadSerializer

    @extend_schema(responses=APIPayloadSerializer)
    def get(self, request, id, slug):
        ad = get_object_or_404(Products, id=id, slug=slug)
        images = list(ad.images.values_list("product_image", flat=True)[:3])
        return Response({"ad": ProductsSerializer(ad).data, "images": images})


class ToggleFavouriteAdAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = APIPayloadSerializer

    @extend_schema(responses=APIPayloadSerializer)
    def post(self, request, id):
        ad = get_object_or_404(Products, id=id)
        if ad.favourite.filter(id=request.user.id).exists():
            ad.favourite.remove(request.user)
            WishlistItem.objects.filter(user=request.user, product=ad).delete()
            is_favourite = False
        else:
            ad.favourite.add(request.user)
            WishlistItem.objects.get_or_create(user=request.user, product=ad)
            is_favourite = True
        return Response({"is_favourite": is_favourite})


class WishlistPreferencesAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = APIPayloadSerializer

    @extend_schema(responses=APIPayloadSerializer)
    def post(self, request, item_id):
        item = get_object_or_404(WishlistItem, id=item_id, user=request.user)
        item.notify_on_restock = bool(request.data.get("notify_on_restock"))
        item.notify_on_price_drop = bool(request.data.get("notify_on_price_drop"))
        item.save(update_fields=["notify_on_restock", "notify_on_price_drop"])
        return Response(WishlistItemSerializer(item).data)


class DeletePostAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = APIPayloadSerializer

    @extend_schema(responses=APIPayloadSerializer)
    def delete(self, request, pk):
        ad = get_object_or_404(Products, pk=pk)
        if not (request.user.is_staff or ad.shop.owner_id == request.user.id):
            return Response({"detail": "Not allowed"}, status=status.HTTP_403_FORBIDDEN)
        ad.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
