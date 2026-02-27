from io import BytesIO

from celery import shared_task
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.utils import timezone

from account.models import ShopIntegration
from foodCreate.models import Products
from foodCreate.integrations.pos import build_connector
from PIL import Image


def sync_pos_integrations():
    """Sync inventory data from POS/ERP providers."""
    integrations = ShopIntegration.objects.select_related("shop").all()
    results = []

    for integration in integrations:
        connector = build_connector(integration)
        if not connector:
            integration.sync_status = "unsupported"
            integration.save(update_fields=["sync_status"])
            continue

        if not integration.access_token:
            integration.sync_status = "missing_token"
            integration.save(update_fields=["sync_status"])
            continue

        inventory_items = connector.fetch_inventory()
        for item in inventory_items:
            if not item.barcode:
                continue
            product = Products.objects.filter(shop=integration.shop, barcode=item.barcode).first()
            if product:
                product.stock = item.stock
                product.save(update_fields=["stock"])
        integration.last_synced_at = timezone.now()
        integration.sync_status = "synced"
        integration.save(update_fields=["last_synced_at", "sync_status"])
        results.append((integration, inventory_items))

    return results


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_kwargs={"max_retries": 3})
def compress_product_image_task(self, image_id: int) -> bool:
    from foodCreate.models import ProductsImages

    image = ProductsImages.objects.filter(pk=image_id).first()
    if not image or not image.product_image:
        return False

    image_name = image.product_image.name
    if not image_name or image_name == "image/no_image.png":
        return False
    if not default_storage.exists(image_name):
        return False

    with default_storage.open(image_name, "rb") as f:
        img = Image.open(f)
        img.load()

    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")

    max_size = (1000, 1000)
    img.thumbnail(max_size)

    buffer = BytesIO()
    img.save(buffer, format="JPEG", quality=75, optimize=True)
    buffer.seek(0)

    default_storage.delete(image_name)
    default_storage.save(image_name, ContentFile(buffer.read()))
    return True
