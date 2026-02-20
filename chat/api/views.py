from rest_framework import permissions, viewsets
from chat.models import Message
from chat.serializers import MessageSerializer
from .permissions import IsOwnerOrReadOnly

class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]


