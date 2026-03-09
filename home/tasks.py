from celery import shared_task
from django.contrib.auth import get_user_model
from django.core.cache import cache

from home.analytics import (
    ANALYTICS_CACHE_TTL_SECONDS,
    build_customer_analytics_payload,
    build_dispatcher_analytics_payload,
    build_shop_analytics_payload,
    customer_analytics_cache_key,
    dispatcher_analytics_cache_key,
    shop_analytics_cache_key,
)


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_kwargs={"max_retries": 2})
def precompute_analytics_snapshots(self):
    User = get_user_model()

    dispatcher_payload = build_dispatcher_analytics_payload()
    cache.set(dispatcher_analytics_cache_key(), dispatcher_payload, ANALYTICS_CACHE_TTL_SECONDS)

    customers_count = 0
    shops_count = 0

    for user in User.objects.filter(is_active=True, role="customer").only("id"):
        cache.set(
            customer_analytics_cache_key(user.id),
            build_customer_analytics_payload(user),
            ANALYTICS_CACHE_TTL_SECONDS,
        )
        customers_count += 1

    for user in User.objects.filter(is_active=True, role="shop").only("id"):
        cache.set(
            shop_analytics_cache_key(user.id),
            build_shop_analytics_payload(user),
            ANALYTICS_CACHE_TTL_SECONDS,
        )
        shops_count += 1

    return {
        "dispatcher": True,
        "customers": customers_count,
        "shops": shops_count,
    }
