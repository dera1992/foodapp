from django.shortcuts import get_object_or_404
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from order.models import Address, Coupon, Lga, Order, OrderItem, State
from order.serializers import (
    AddressSerializer,
    CouponSerializer,
    LgaSerializer,
    OrderItemSerializer,
    OrderSerializer,
    StateSerializer,
)

from .permissions import IsOwnerOrReadOnly


class StateViewSet(viewsets.ModelViewSet):
    queryset = State.objects.all()
    serializer_class = StateSerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]


class LgaViewSet(viewsets.ModelViewSet):
    queryset = Lga.objects.select_related("state").all()
    serializer_class = LgaSerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]


class OrderItemViewSet(viewsets.ModelViewSet):
    queryset = OrderItem.objects.select_related("user", "item")
    serializer_class = OrderItemSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

    def get_queryset(self):
        if self.request.user.is_staff:
            return self.queryset
        return self.queryset.filter(user=self.request.user)


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.select_related("user", "billing_address", "coupon")
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

    def get_queryset(self):
        if self.request.user.is_staff:
            return self.queryset
        return self.queryset.filter(user=self.request.user)

    @action(detail=True, methods=["get"])
    def tracking(self, request, pk=None):
        order = self.get_object()
        return Response({"status": order.get_status_label(), "steps": order.get_tracking_steps()})

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def update_status(self, request, pk=None):
        order = self.get_object()
        if not (request.user.is_staff or order.user == request.user):
            return Response({"detail": "Not allowed"}, status=status.HTTP_403_FORBIDDEN)
        status_key = request.data.get("status")
        if status_key == "being_delivered":
            order.being_delivered = True
        elif status_key == "received":
            order.received = True
        elif status_key == "is_ordered":
            order.is_ordered = True
        order.save()
        return Response(OrderSerializer(order).data)

    @action(detail=True, methods=["post"])
    def verify_payment(self, request, pk=None):
        order = self.get_object()
        verified = order.verify_payment()
        return Response({"verified": verified, "order": OrderSerializer(order).data})


class AddressViewSet(viewsets.ModelViewSet):
    queryset = Address.objects.select_related("user", "state", "city")
    serializer_class = AddressSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

    def get_queryset(self):
        if self.request.user.is_staff:
            return self.queryset
        return self.queryset.filter(user=self.request.user)


class CouponViewSet(viewsets.ModelViewSet):
    queryset = Coupon.objects.all()
    serializer_class = CouponSerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]


class LoadCitiesAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        state_id = request.query_params.get("state")
        if not state_id:
            return Response([])
        cities = Lga.objects.filter(state_id=state_id).order_by("name")
        return Response(LgaSerializer(cities, many=True).data)


class UserOrdersAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        orders = Order.objects.filter(user=request.user).order_by("-created")
        return Response(OrderSerializer(orders, many=True).data)


class OwnerOrdersAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        orders = Order.objects.filter(items__item__shop__owner=request.user).distinct().order_by("-created")
        return Response(OrderSerializer(orders, many=True).data)


class CheckoutSummaryAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        order = Order.objects.filter(user=request.user, is_ordered=False).first()
        if not order:
            return Response({"detail": "No active order", "order": None, "states": [], "cities": []})
        return Response(
            {
                "order": OrderSerializer(order).data,
                "states": StateSerializer(State.objects.all(), many=True).data,
                "cities": LgaSerializer(Lga.objects.all(), many=True).data,
            }
        )


class TransferAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        order = Order.objects.filter(user=request.user, is_ordered=False).first()
        if not order:
            return Response({"detail": "No active order"}, status=status.HTTP_400_BAD_REQUEST)

        order_items = order.items.all()
        order_items.update(is_ordered=True)
        order.is_ordered = True
        order.save(update_fields=["is_ordered", "updated"])
        return Response(OrderSerializer(order).data)


class VerifyPaymentByRefAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, ref):
        order = get_object_or_404(Order, ref=ref)
        if not (request.user.is_staff or order.user == request.user):
            return Response({"detail": "Not allowed"}, status=status.HTTP_403_FORBIDDEN)
        order.items.all().update(is_ordered=True)
        verified = order.verify_payment()
        return Response({"verified": verified, "order": OrderSerializer(order).data})


class AddCouponAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        code = request.data.get("code")
        if not code:
            return Response({"detail": "Coupon code is required"}, status=status.HTTP_400_BAD_REQUEST)
        coupon = Coupon.objects.filter(code__iexact=code).first()
        if not coupon:
            return Response({"detail": "Invalid coupon"}, status=status.HTTP_400_BAD_REQUEST)
        order = Order.objects.filter(user=request.user, is_ordered=False).first()
        if not order:
            return Response({"detail": "No active order"}, status=status.HTTP_400_BAD_REQUEST)
        order.coupon = coupon
        order.save(update_fields=["coupon"])
        return Response(OrderSerializer(order).data)


class OrderTrackingByRefAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, ref=None):
        reference = ref or request.query_params.get("ref")
        if not reference:
            return Response({"detail": "ref is required"}, status=status.HTTP_400_BAD_REQUEST)
        order = get_object_or_404(Order, ref=reference)
        return Response({"status": order.get_status_label(), "steps": order.get_tracking_steps()})


class UpdateOrderStatusAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, order_id):
        order = Order.objects.filter(id=order_id).first()
        if not order:
            return Response({"detail": "Order not found"}, status=status.HTTP_400_BAD_REQUEST)
        if not (request.user.is_staff or order.user == request.user):
            return Response({"detail": "Not allowed"}, status=status.HTTP_403_FORBIDDEN)

        status_key = request.data.get("status")
        if status_key == "being_delivered":
            order.being_delivered = True
        elif status_key == "received":
            order.received = True
        elif status_key == "is_ordered":
            order.is_ordered = True
        else:
            return Response({"detail": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST)
        order.save()
        return Response(OrderSerializer(order).data)
