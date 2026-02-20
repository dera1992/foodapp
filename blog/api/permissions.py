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
