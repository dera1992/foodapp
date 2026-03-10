from __future__ import unicode_literals

from django.db import models
from django.conf import settings
from account.models import Profile
from foodCreate.models import Products
import secrets
from .paystack import PayStack



class State(models.Model):
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name

class Lga(models.Model):
    state = models.ForeignKey('State',null=True, blank=True,on_delete=models.CASCADE)
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name


class OrderItem(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL,
                             on_delete=models.CASCADE)
    item = models.ForeignKey(Products, related_name='order_items',on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    is_ordered = models.BooleanField(default=False)
    date_added = models.DateTimeField(auto_now=True)
    date_ordered = models.DateTimeField(null=True)

    def __str__(self):
        return f"{self.quantity} of {self.item.title}"

    def get_total_item_price(self):
        return self.quantity * self.item.price

    def get_total_discount_item_price(self):
        if self.item.discount_price:
            return self.quantity * self.item.discount_price
        return self.get_total_item_price()

    def get_amount_saved(self):
        return self.get_total_item_price() - self.get_total_discount_item_price()

    def get_final_price(self):
        if self.item.discount_price:
            return self.get_total_discount_item_price()
        return self.get_total_item_price()


PAYMENT_METHOD_CHOICES = [
    ('card', 'Card'),
    ('transfer', 'Bank Transfer'),
    ('cash', 'Cash on Delivery'),
]


class Order(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL,
                             on_delete=models.CASCADE)
    items = models.ManyToManyField(OrderItem)
    ref = models.CharField(max_length=255, null=True, blank=True, unique=True)
    is_ordered = models.BooleanField(default=False)
    date_ordered = models.DateTimeField(auto_now=True)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)
    paid = models.BooleanField(default=False)
    verified = models.BooleanField(default=False)
    billing_address = models.ForeignKey(
        'Address', related_name='billing_address', on_delete=models.SET_NULL, blank=True, null=True)
    coupon = models.ForeignKey(
        'Coupon', on_delete=models.SET_NULL, blank=True, null=True)
    being_delivered = models.BooleanField(default=False)
    received = models.BooleanField(default=False)
    # Payment & checkout details
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='card')
    payment_reference = models.CharField(max_length=255, blank=True)
    # Delivery details (denormalised for speed)
    delivery_address_text = models.TextField(blank=True)
    delivery_date = models.DateField(null=True, blank=True)
    delivery_slot = models.CharField(max_length=50, blank=True)
    # Contact details
    contact_name = models.CharField(max_length=200, blank=True)
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=30, blank=True)

    class Meta:
        ordering = ('-created',)

    def __str__(self):
        return '{0} - {1}'.format(self.user.email, self.ref)

    def get_total(self):
        total = 0
        for order_item in self.items.all():
            total += order_item.get_final_price()
        if self.coupon:
            total -= self.coupon.amount
        return total

    def save(self, *args, **kwargs) -> None:
        while not self.ref:
            ref = secrets.token_urlsafe(20)
            object_with_similar_ref = Order.objects.filter(ref=ref)
            if not object_with_similar_ref:
                self.ref = ref
        super().save(*args, **kwargs)

    def verify_payment(self):
        paystack = PayStack()
        total = self.get_total()
        status, result = paystack.verify_payment(self.ref, total)
        if status:
            if result['amount'] / 100 == total:
                self.verified = True
                self.is_ordered = True
                self.paid = True
            self.save()
        if self.verified:
            return True
        return False

    def get_tracking_steps(self):
        payment_confirmed = self.paid or self.verified
        steps = [
            {
                "label": "Order placed",
                "complete": True,
                "timestamp": self.created,
                "detail": "Your order has been created.",
            },
            {
                "label": "Payment confirmed",
                "complete": payment_confirmed,
                "timestamp": self.date_ordered if payment_confirmed else None,
                "detail": "Payment has been confirmed for this order.",
            },
            {
                "label": "Preparing order",
                "complete": self.is_ordered,
                "timestamp": self.updated if self.is_ordered else None,
                "detail": "We are preparing your items for delivery.",
            },
            {
                "label": "Out for delivery",
                "complete": self.being_delivered,
                "timestamp": self.updated if self.being_delivered else None,
                "detail": "Your order is on the way.",
            },
            {
                "label": "Delivered",
                "complete": self.received,
                "timestamp": self.updated if self.received else None,
                "detail": "Order delivered to the destination.",
            },
        ]
        return steps

    def get_status_label(self):
        if self.received:
            return "Delivered"
        if self.being_delivered:
            return "Out for delivery"
        if self.is_ordered:
            return "Preparing order"
        if self.paid or self.verified:
            return "Payment confirmed"
        return "Order placed"


class Address(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL,
                             on_delete=models.CASCADE)
    street_address = models.CharField(max_length=100)
    apartment_address = models.CharField(max_length=100)
    state = models.ForeignKey(State,
                              on_delete=models.CASCADE)
    city = models.ForeignKey(Lga,
                              on_delete=models.CASCADE)

    def __str__(self):
        return self.user.email


class Coupon(models.Model):
    code = models.CharField(max_length=15)
    amount = models.DecimalField(decimal_places=0,
                                max_digits=30)

    def __str__(self):
        return self.code


class SavedAddress(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='saved_addresses')
    label = models.CharField(max_length=50, default='Home')
    line1 = models.CharField(max_length=200)
    line2 = models.CharField(max_length=200, blank=True)
    city = models.CharField(max_length=100)
    county = models.CharField(max_length=100, blank=True)
    postcode = models.CharField(max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('-created_at',)

    def __str__(self):
        return f"{self.user.email} — {self.label}: {self.line1}, {self.city}"
