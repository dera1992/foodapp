from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
    """Allow safe methods for all and writes only for object owners or admins."""

    owner_fields = ("user", "owner", "author", "sender")

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        if request.user and request.user.is_staff:
            return True
        for field in self.owner_fields:
            if hasattr(obj, field):
                return getattr(obj, field) == request.user
        return False


class IsShopUser(permissions.BasePermission):
    """
    Write access is restricted to authenticated users with role='shop'.
    Staff/superusers are always allowed. Safe methods are open to all.
    Object-level checks also ensure the user owns the shop on the product.
    """

    message = "Only shop accounts can create or modify products."

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_staff:
            return True
        return getattr(request.user, "role", None) == "shop"

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        if request.user and request.user.is_staff:
            return True
        shop = getattr(obj, "shop", None)
        if shop:
            return shop.owner == request.user
        return False
