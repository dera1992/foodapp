from django.db.models import Q, Sum
from django.utils import timezone
from datetime import timedelta

from account.models import Shop, ShopFollower
from home.models import WishlistItem, WishlistNotification
from order.models import Order, OrderItem


ANALYTICS_CACHE_TTL_SECONDS = 60 * 15


def customer_analytics_cache_key(user_id):
    return f"analytics:customer:{user_id}"


def dispatcher_analytics_cache_key():
    return "analytics:dispatcher:global"


def shop_analytics_cache_key(user_id):
    return f"analytics:shop:{user_id}"


def build_customer_analytics_payload(user, days=None):
    order_qs = Order.objects.filter(user=user).filter(Q(is_ordered=True) | Q(paid=True) | Q(verified=True))
    if days:
        since = timezone.now() - timedelta(days=int(days))
        order_qs = order_qs.filter(created__gte=since)

    order_items = OrderItem.objects.filter(order__in=order_qs).select_related("item", "item__category", "item__shop")
    total_spend = sum(item.get_final_price() for item in order_items)
    total_orders = order_qs.count()
    total_items = order_items.aggregate(total=Sum("quantity"))["total"] or 0

    # Top categories by quantity purchased
    top_categories = list(
        order_items.values("item__category__name")
        .annotate(total_quantity=Sum("quantity"))
        .order_by("-total_quantity")[:5]
    )

    # Subscribed (followed) shops — not date-filtered, reflects current state
    subscribed_shops = []
    for sf in ShopFollower.objects.filter(user=user).select_related("shop").order_by("-created_at")[:5]:
        subscribed_shops.append({
            "id": sf.shop.id,
            "name": sf.shop.name,
            "city": getattr(sf.shop, "city", ""),
        })

    # Recent orders with totals
    recent_orders = []
    for order in order_qs.prefetch_related("items__item").order_by("-created")[:5]:
        recent_orders.append({
            "id": order.ref or str(order.id),
            "ref": order.ref or str(order.id),
            "status": order.get_status_label(),
            "total": order.get_total(),
            "date": order.created.isoformat(),
        })

    return {
        "total_spend": total_spend,
        "total_orders": total_orders,
        "total_items": total_items,
        "wishlist_count": WishlistItem.objects.filter(user=user).count(),
        "unread_notifications": WishlistNotification.objects.filter(user=user, is_read=False).count(),
        "top_categories": top_categories,
        "subscribed_shops": subscribed_shops,
        "recent_orders": recent_orders,
    }


def build_dispatcher_analytics_payload():
    delivery_ready = Order.objects.filter(Q(paid=True) | Q(verified=True), being_delivered=False, received=False).count()
    active_deliveries = Order.objects.filter(being_delivered=True, received=False).count()
    completed_deliveries = Order.objects.filter(received=True).count()
    return {
        "delivery_ready": delivery_ready,
        "active_deliveries": active_deliveries,
        "completed_deliveries": completed_deliveries,
    }


def build_shop_analytics_payload(user):
    shops = Shop.objects.filter(owner=user)
    payload = []
    for shop in shops:
        total_products = shop.products.count()
        followers = shop.followers.count()
        payload.append({"shop": shop.name, "products": total_products, "followers": followers})
    return payload
