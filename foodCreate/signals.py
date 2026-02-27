from django.db.models.signals import post_save
from django.dispatch import receiver

from account.models import ShopFollower, ShopNotification
from .models import Products, ProductsImages
from .tasks import compress_product_image_task


@receiver(post_save, sender=Products)
def notify_shop_followers(sender, instance, created, **kwargs):
    if not created:
        return

    followers = ShopFollower.objects.filter(shop=instance.shop).select_related("user")
    if not followers:
        return

    notifications = [
        ShopNotification(
            user=follower.user,
            shop=instance.shop,
            product=instance,
            message=f"New product from {instance.shop.name}: {instance.title}",
        )
        for follower in followers
        if follower.user_id != instance.shop.owner_id
    ]
    if notifications:
        ShopNotification.objects.bulk_create(notifications)


@receiver(post_save, sender=ProductsImages)
def compress_uploaded_product_image(sender, instance, created, **kwargs):
    if not instance.product_image:
        return
    if instance.product_image.name == "image/no_image.png":
        return
    # Run image compression asynchronously to keep uploads responsive.
    compress_product_image_task.delay(instance.id)
