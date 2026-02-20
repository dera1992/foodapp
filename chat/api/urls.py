from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    InboxAPIView,
    MessageViewSet,
    SendMessageAPIView,
    ThreadAPIView,
    ThreadMessagesAPIView,
)

router = DefaultRouter()
router.register(r"messages", MessageViewSet, basename="messages")

urlpatterns = [
    path("inbox/", InboxAPIView.as_view(), name="chat-inbox-api"),
    path("thread/<int:shop_id>/<int:user_id>/", ThreadAPIView.as_view(), name="chat-thread-api"),
    path(
        "thread/<int:shop_id>/<int:user_id>/messages/",
        ThreadMessagesAPIView.as_view(),
        name="chat-thread-messages-api",
    ),
    path("send/", SendMessageAPIView.as_view(), name="chat-send-api"),
] + router.urls
