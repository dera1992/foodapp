from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    Category,
    DayOption,
    DeliveryMethod,
    LabelOption,
    Products,
    ProductsImages,
    ReviewRating,
    StatusOption,
    SubCategory,
    User,
)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name','slug']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Products)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['title','price','slug',
    'available', 'created_at', 'updated_at']
    list_filter = ['available', 'created_at', 'updated_at']
    list_editable = ['price', 'available']
    prepopulated_fields = {'slug': ('title',)}

@admin.register(LabelOption)
class LabelOptionAdmin(admin.ModelAdmin):
    list_display = ['name', 'code']
    search_fields = ['name', 'code']


@admin.register(StatusOption)
class StatusOptionAdmin(admin.ModelAdmin):
    list_display = ['name', 'code']
    search_fields = ['name', 'code']


@admin.register(DeliveryMethod)
class DeliveryMethodAdmin(admin.ModelAdmin):
    list_display = ['name', 'code']
    search_fields = ['name', 'code']


@admin.register(DayOption)
class DayOptionAdmin(admin.ModelAdmin):
    list_display = ['name', 'code']
    search_fields = ['name', 'code']

admin.site.register(SubCategory)
admin.site.register(ProductsImages)
admin.site.register(ReviewRating)
