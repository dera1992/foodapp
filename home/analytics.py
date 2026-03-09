from django.db.models import Q, Sum

from account.models import Shop
from home.models import WishlistItem, WishlistNotification
from order.models import Order, OrderItem


ANALYTICS_CACHE_TTL_SECONDS = 60 * 15


def customer_analytics_cache_key(user_id):
    return f"analytics:customer:{user_id}"


def dispatcher_analytics_cache_key():
    return "analytics:dispatcher:global"


def shop_analytics_cache_key(user_id):
    return f"analytics:shop:{user_id}"


def build_customer_analytics_payload(user):
    completed_orders = Order.objects.filter(user=user).filter(Q(is_ordered=True) | Q(paid=True) | Q(verified=True))
    order_items = OrderItem.objects.filter(order__in=completed_orders).select_related("item", "item__category", "item__shop")
    total_spend = sum(item.get_final_price() for item in order_items)
    total_orders = completed_orders.count()
    total_items = order_items.aggregate(total=Sum("quantity"))["total"] or 0
    return {
        "total_spend": total_spend,
        "total_orders": total_orders,
        "total_items": total_items,
        "wishlist_count": WishlistItem.objects.filter(user=user).count(),
        "unread_notifications": WishlistNotification.objects.filter(user=user, is_read=False).count(),
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
