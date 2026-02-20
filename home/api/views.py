from rest_framework import permissions, viewsets
from home.models import WishlistItem, WishlistNotification
from home.serializers import WishlistItemSerializer, WishlistNotificationSerializer
from .permissions import IsOwnerOrReadOnly

class WishlistItemViewSet(viewsets.ModelViewSet):
    queryset = WishlistItem.objects.all()
    serializer_class = WishlistItemSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]


class WishlistNotificationViewSet(viewsets.ModelViewSet):
    queryset = WishlistNotification.objects.all()
    serializer_class = WishlistNotificationSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]


