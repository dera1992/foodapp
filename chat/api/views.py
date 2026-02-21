from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from seafood.api.schema import DocumentedAPIView

from account.models import Shop, User
from chat.models import Message
from chat.serializers import MessageSerializer
from foodCreate.models import Products

from .permissions import IsOwnerOrReadOnly


class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.select_related("shop", "sender", "receiver", "product")
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

    def get_queryset(self):
        return self.queryset.filter(Q(sender=self.request.user) | Q(receiver=self.request.user))


class InboxAPIView(DocumentedAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        messages = (
            Message.objects.select_related("shop", "sender", "receiver", "product")
            .filter(Q(sender=request.user) | Q(receiver=request.user))
            .order_by("-timestamp")
        )
        conversations = []
        seen = set()
        for message in messages:
            other_user = message.receiver if message.sender == request.user else message.sender
            key = (message.shop_id, other_user.id)
            if key in seen:
                continue
            seen.add(key)
            unread_count = Message.objects.filter(
                shop=message.shop,
                sender=other_user,
                receiver=request.user,
                is_read=False,
            ).count()
            conversations.append(
                {
                    "shop_id": message.shop_id,
                    "shop_name": message.shop.name,
                    "other_user_id": other_user.id,
                    "other_user_email": other_user.email,
                    "last_message": MessageSerializer(message).data,
                    "unread_count": unread_count,
                }
            )
        return Response({"results": conversations})


class ThreadAPIView(DocumentedAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, shop_id, user_id):
        shop = get_object_or_404(Shop, id=shop_id)
        other_user = get_object_or_404(User, id=user_id)
        if shop.owner not in {request.user, other_user}:
            return Response({"detail": "Invalid conversation."}, status=status.HTTP_400_BAD_REQUEST)

        messages = (
            Message.objects.select_related("shop", "sender", "receiver", "product")
            .filter(shop=shop)
            .filter(sender__in=[request.user, other_user], receiver__in=[request.user, other_user])
            .order_by("timestamp")
        )
        Message.objects.filter(
            receiver=request.user,
            sender=other_user,
            shop=shop,
            is_read=False,
        ).update(is_read=True)
        return Response({"results": MessageSerializer(messages, many=True).data})


class ThreadMessagesAPIView(DocumentedAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, shop_id, user_id):
        shop = get_object_or_404(Shop, id=shop_id)
        other_user = get_object_or_404(User, id=user_id)
        if shop.owner not in {request.user, other_user}:
            return Response({"detail": "Invalid conversation."}, status=status.HTTP_400_BAD_REQUEST)
        after_id = request.GET.get("after")
        queryset = (
            Message.objects.select_related("sender", "product")
            .filter(shop=shop)
            .filter(sender__in=[request.user, other_user], receiver__in=[request.user, other_user])
            .order_by("timestamp")
        )
        if after_id:
            queryset = queryset.filter(id__gt=after_id)
        return Response({"messages": MessageSerializer(queryset, many=True).data})


class SendMessageAPIView(DocumentedAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        receiver_id = request.data.get("receiver_id")
        shop_id = request.data.get("shop_id")
        product_id = request.data.get("product_id")
        content = request.data.get("content")
        if not receiver_id or not shop_id or not content:
            return Response({"detail": "Missing required fields."}, status=status.HTTP_400_BAD_REQUEST)

        receiver = get_object_or_404(User, id=receiver_id)
        shop = get_object_or_404(Shop, id=shop_id)
        product = None
        if product_id:
            product = get_object_or_404(Products, id=product_id, shop=shop)

        message = Message.objects.create(
            shop=shop,
            product=product,
            sender=request.user,
            receiver=receiver,
            content=content,
        )
        return Response(MessageSerializer(message).data, status=status.HTTP_201_CREATED)
