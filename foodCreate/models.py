# -*- coding: utf-8 -*-
from __future__ import unicode_literals
# from django.contrib.auth.models import User
from django.db import models
from django.core.exceptions import ValidationError
from account.models import Profile, Shop, User
from django.http import  HttpResponse
from django.template.defaultfilters import slugify
from django.urls import reverse
from django.db.models import Avg, Count
from django.utils import timezone
from hitcount.models import HitCountMixin, HitCount
from django.contrib.contenttypes.fields import GenericRelation

class Category(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=200,blank=True)

    def __str__(self):
        return self.name

    def get_absolute_url(self):
        return reverse('home:ads_list_by_category',
                       args=[self.slug])

class SubCategory(models.Model):
    category = models.ForeignKey('Category',null=True, blank=True,on_delete=models.CASCADE)
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name


class LabelOption(models.Model):
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)

    class Meta:
        ordering = ("name",)

    def __str__(self):
        return self.name


class StatusOption(models.Model):
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)

    class Meta:
        ordering = ("name",)

    def __str__(self):
        return self.name


class DeliveryMethod(models.Model):
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)

    class Meta:
        ordering = ("name",)

    def __str__(self):
        return self.name


class DayOption(models.Model):
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)

    class Meta:
        ordering = ("name",)

    def __str__(self):
        return self.name


class Products(models.Model):
    shop = models.ForeignKey(Shop,
                                on_delete=models.CASCADE)
    title =models.CharField( max_length=255)
    category = models.ForeignKey(Category,
                                 on_delete=models.CASCADE)
    subcategory = models.ForeignKey(SubCategory,
                             on_delete=models.CASCADE, null=True, blank=True)
    status = models.ForeignKey("StatusOption", on_delete=models.SET_NULL, null=True, blank=True)
    price = models.DecimalField(decimal_places=2,
                                   max_digits=10)
    discount_price = models.DecimalField(decimal_places=2, max_digits=10, blank=True, null=True)
    label = models.ForeignKey("LabelOption", on_delete=models.SET_NULL, null=True, blank=True)
    delivery = models.ForeignKey("DeliveryMethod", on_delete=models.SET_NULL, null=True, blank=True)
    delivery_time = models.ForeignKey("DayOption", on_delete=models.SET_NULL, null=True, blank=True)
    barcode = models.CharField(max_length=64, blank=True)
    brand = models.CharField(max_length=120, blank=True, null=True)
    weight = models.CharField(max_length=64, blank=True, null=True)
    slug = models.SlugField(max_length=200,blank=True)
    ai_recommended_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    stock = models.PositiveIntegerField(default=0)
    expires_on = models.DateField(null=True, blank=True, db_index=True)
    description = models.TextField(blank=True)
    ingredients = models.TextField(blank=True)
    nutrition = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True,null=True, blank=True)
    created_date = models.DateField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True,null=True, blank=True)
    hit_count_generic = GenericRelation(HitCount, object_id_field='object_pk',
                                        related_query_name='hit_count_generic_relation')
    favourite = models.ManyToManyField(User, related_name='favourite', blank=True)
    available = models.BooleanField(default=True,blank=True)
    is_active = models.BooleanField(default=True,blank=True)

    class Meta:
        ordering = ('title',)
        index_together = (('id', 'slug'),)
        constraints = [
            models.UniqueConstraint(fields=['shop', 'slug'], name='unique_shop_slug'),
        ]

    def __str__(self):
        return self.title

    def get_absolute_url(self):
        return reverse('home:ad_detail', args=[self.id, self.slug])

    def get_add_to_cart_url(self):
        return reverse("cart:add_to_cart", kwargs={
            'slug': self.slug
        })

    def get_remove_from_cart_url(self):
        return reverse("cart:remove_from_cart", kwargs={
            'slug': self.slug
        })

    def get_first_image(self):
        images = list(self.images.all())
        return images[0:3] if images else None

    def get_second_image(self):
        images = list(self.images.all())
        return images[0:1] if images else None

    def averageReview(self):
        reviews = ReviewRating.objects.filter(post=self, status=True).aggregate(
            average=Avg("rating")
        )
        avg = 0
        if reviews["average"] is not None:
            avg = float(reviews["average"])
        return avg

    def countReview(self):
        reviews = ReviewRating.objects.filter(post=self, status=True).aggregate(
            count=Count("id")
        )
        count = 0
        if reviews["count"] is not None:
            count = int(reviews["count"])
        return count

    def days_to_expire(self):
        if not self.expires_on:
            return None
        return (self.expires_on - timezone.localdate()).days

    def is_expiring_soon(self, threshold_days=3):
        days_left = self.days_to_expire()
        return days_left is not None and days_left <= threshold_days

    def is_expired(self):
        days_left = self.days_to_expire()
        return days_left is not None and days_left < 0

    def clean(self):
        errors = {}
        if self.discount_price is not None and self.price is not None:
            if self.discount_price > self.price:
                errors["discount_price"] = "Discount price cannot exceed the base price."
        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title) or "product"
            slug = base_slug
            counter = 1
            while Products.objects.filter(shop=self.shop, slug=slug).exclude(pk=self.pk).exists():
                counter += 1
                slug = f"{base_slug}-{counter}"
            self.slug = slug
        self.full_clean()
        super().save(*args, **kwargs)

class ProductsImages(models.Model):
    products = models.ForeignKey(Products,related_name="images", on_delete=models.CASCADE)
    product_image = models.ImageField(upload_to='ads/', default='image/no_image.png', null=True, blank=True)

    def get_ordering_queryset(self):
        return self.products.images.all()

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

class ReviewRating(models.Model):
    post = models.ForeignKey(Products, on_delete=models.CASCADE)
    user = models.ForeignKey(Profile, on_delete=models.CASCADE)
    subject = models.CharField(max_length=100, blank=True)
    review = models.TextField(max_length=500, blank=True)
    rating = models.FloatField()
    ip = models.CharField(max_length=20, blank=True)
    status = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.subject
