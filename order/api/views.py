import json
import logging
from decimal import Decimal, InvalidOperation

from django.conf import settings
from django.shortcuts import get_object_or_404
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework import permissions, status, viewsets
from rest_framework import serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from cart.cart import Cart
from foodCreate.models import Products
from order.emails import send_order_invoice
from order.gateways.factory import get_gateway
from order.models import Address, Coupon, Lga, Order, OrderItem, SavedAddress, State
from order.serializers import (
    AddressSerializer,
    CouponSerializer,
    LgaSerializer,
    OrderItemSerializer,
    OrderSerializer,
    SavedAddressSerializer,
    StateSerializer,
)

from .permissions import IsOwnerOrReadOnly

logger = logging.getLogger(__name__)


class APIPayloadSerializer(serializers.Serializer):
    pass


class OrderAPIView(APIView):
    serializer_class = APIPayloadSerializer

    def _apply_status_flag(self, order, status_key):
        if status_key == "being_delivered":
            order.being_delivered = True
        elif status_key == "received":
            order.received = True
        elif status_key == "is_ordered":
            order.is_ordered = True
        else:
            return False
        return True

    def _can_manage_order(self, user, order):
        return user.is_staff or order.user == user


class PublicReadAdminWriteViewSet(viewsets.ModelViewSet):
    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]


class StateViewSet(PublicReadAdminWriteViewSet):
    queryset = State.objects.all()
    serializer_class = StateSerializer


class LgaViewSet(PublicReadAdminWriteViewSet):
    queryset = Lga.objects.select_related("state").all()
    serializer_class = LgaSerializer


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
        if status_key:
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


class CouponViewSet(PublicReadAdminWriteViewSet):
    queryset = Coupon.objects.all()
    serializer_class = CouponSerializer


class LoadCitiesAPIView(OrderAPIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(responses=APIPayloadSerializer)
    def get(self, request):
        state_id = request.query_params.get("state")
        if not state_id:
            return Response([])
        cities = Lga.objects.filter(state_id=state_id).order_by("name")
        return Response(LgaSerializer(cities, many=True).data)


class UserOrdersAPIView(OrderAPIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(responses=APIPayloadSerializer)
    def get(self, request):
        orders = (
            Order.objects
            .filter(user=request.user)
            .prefetch_related('items__item')
            .order_by("-created")
        )
        return Response(OrderSerializer(orders, many=True, context={'request': request}).data)


class OwnerOrdersAPIView(OrderAPIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(responses=APIPayloadSerializer)
    def get(self, request):
        orders = (
            Order.objects
            .filter(items__item__shop__owner=request.user)
            .prefetch_related('items__item')
            .select_related('user', 'coupon')
            .distinct()
            .order_by("-created")
        )
        return Response(OrderSerializer(orders, many=True, context={'request': request}).data)


class OrderDetailAPIView(OrderAPIView):
    """
    GET /api/v1/order/my-orders/<ref>/
    Returns a single order with full item details.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(responses=APIPayloadSerializer)
    def get(self, request, ref):
        order = get_object_or_404(
            Order.objects.prefetch_related('items__item').select_related('user', 'coupon'),
            ref=ref,
        )
        if not self._can_manage_order(request.user, order):
            return Response({"detail": "Not allowed"}, status=status.HTTP_403_FORBIDDEN)
        from order.serializers import OrderItemSerializer as _OISerializer
        items_data = _OISerializer(order.items.select_related('item').all(), many=True, context={'request': request}).data
        data = OrderSerializer(order, context={'request': request}).data
        data['items_detail'] = items_data
        return Response(data)


class CheckoutSummaryAPIView(OrderAPIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(responses=APIPayloadSerializer)
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


class TransferAPIView(OrderAPIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(responses=APIPayloadSerializer)
    def post(self, request):
        order = Order.objects.filter(user=request.user, is_ordered=False).first()
        if not order:
            return Response({"detail": "No active order"}, status=status.HTTP_400_BAD_REQUEST)

        order_items = order.items.all()
        order_items.update(is_ordered=True)
        order.is_ordered = True
        order.save(update_fields=["is_ordered", "updated"])
        return Response(OrderSerializer(order).data)


class VerifyPaymentByRefAPIView(OrderAPIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(responses=APIPayloadSerializer)
    def post(self, request, ref):
        order = get_object_or_404(Order, ref=ref)
        if not self._can_manage_order(request.user, order):
            return Response({"detail": "Not allowed"}, status=status.HTTP_403_FORBIDDEN)
        order.items.all().update(is_ordered=True)
        verified = order.verify_payment()
        return Response({"verified": verified, "order": OrderSerializer(order).data})


class AddCouponAPIView(OrderAPIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(responses=APIPayloadSerializer)
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


class OrderTrackingByRefAPIView(OrderAPIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(responses=APIPayloadSerializer)
    def get(self, request, ref=None):
        reference = ref or request.query_params.get("ref")
        if not reference:
            return Response({"detail": "ref is required"}, status=status.HTTP_400_BAD_REQUEST)
        order = get_object_or_404(Order, ref=reference)
        return Response({"status": order.get_status_label(), "steps": order.get_tracking_steps()})


class UpdateOrderStatusAPIView(OrderAPIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(responses=APIPayloadSerializer)
    def post(self, request, order_id):
        order = Order.objects.filter(id=order_id).first()
        if not order:
            return Response({"detail": "Order not found"}, status=status.HTTP_400_BAD_REQUEST)
        if not self._can_manage_order(request.user, order):
            return Response({"detail": "Not allowed"}, status=status.HTTP_403_FORBIDDEN)

        status_key = request.data.get("status")
        if not self._apply_status_flag(order, status_key):
            return Response({"detail": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST)
        order.save()
        return Response(OrderSerializer(order).data)


# ── Checkout: place order ────────────────────────────────────────────────────

class PlaceOrderAPIView(OrderAPIView):
    """
    POST /api/order/place-order/

    Converts the session cart into an Order. Returns:
    - card payments  → {success, order_ref, payment_url}  (redirect user to Paystack)
    - transfer/cash  → {success, order_ref, order_id}
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(responses=APIPayloadSerializer)
    def post(self, request):
        cart = Cart(request)
        if not len(cart):
            return Response({"detail": "Cart is empty"}, status=status.HTTP_400_BAD_REQUEST)

        data = request.data
        payment_method = data.get("payment_method", "card")
        contact = data.get("contact", {})
        address_data = data.get("address") or {}
        delivery_date_str = data.get("delivery_date", "")
        delivery_slot = data.get("delivery_slot", "")

        # Build order items from cart
        now = timezone.now()
        order_items = []
        for cart_item in cart:
            product = cart_item.get("product")
            if not product:
                continue
            oi = OrderItem.objects.create(
                user=request.user,
                item=product,
                quantity=cart_item["quantity"],
                is_ordered=False,
            )
            order_items.append(oi)

        if not order_items:
            return Response({"detail": "No valid products in cart"}, status=status.HTTP_400_BAD_REQUEST)

        # Coupon
        coupon = None
        promo_code = data.get("promo_code", "").strip()
        if promo_code:
            coupon = Coupon.objects.filter(code__iexact=promo_code).first()

        # Delivery address text
        if address_data:
            addr_parts = [
                address_data.get("line1", ""),
                address_data.get("line2", ""),
                address_data.get("city", ""),
                address_data.get("county", ""),
                address_data.get("postcode", ""),
            ]
            delivery_address_text = ", ".join(p for p in addr_parts if p)
        else:
            delivery_address_text = ""

        # Parse delivery date
        delivery_date = None
        if delivery_date_str:
            try:
                from datetime import date
                delivery_date = date.fromisoformat(delivery_date_str)
            except (ValueError, TypeError):
                pass

        # Create order
        order = Order.objects.create(
            user=request.user,
            coupon=coupon,
            payment_method=payment_method,
            delivery_address_text=delivery_address_text,
            delivery_date=delivery_date,
            delivery_slot=delivery_slot,
            contact_name=f"{contact.get('firstName', '')} {contact.get('lastName', '')}".strip(),
            contact_email=contact.get("email", ""),
            contact_phone=contact.get("phone", ""),
        )
        order.items.set(order_items)

        # Save address for future use if requested
        if address_data and address_data.get("line1") and data.get("save_address"):
            SavedAddress.objects.get_or_create(
                user=request.user,
                line1=address_data.get("line1", ""),
                postcode=address_data.get("postcode", ""),
                defaults={
                    "label": "Home",
                    "line2": address_data.get("line2", ""),
                    "city": address_data.get("city", ""),
                    "county": address_data.get("county", ""),
                },
            )

        # Card payment → initialize gateway (Stripe for UK, Paystack for Africa)
        if payment_method == "card":
            total = order.get_total()
            amount_pence = int(total * 100)
            email = contact.get("email") or request.user.email
            callback_url = f"{settings.FRONTEND_URL}/checkout/verify"
            gateway = get_gateway()
            ok, result = gateway.initialize_transaction(
                email=email,
                amount_pence=amount_pence,
                ref=order.ref,
                callback_url=callback_url,
                metadata={"order_id": str(order.id), "user_id": str(request.user.id)},
            )
            if not ok:
                # Clean up on gateway failure
                order.items.all().delete()
                order.delete()
                logger.error("Payment initialization failed: %s", result)
                return Response({"detail": f"Payment initialization failed: {result}"}, status=status.HTTP_502_BAD_GATEWAY)

            cart.clear()
            return Response({
                "success": True,
                "order_ref": order.ref,
                "payment_url": result["payment_url"],
                "payment_method": "card",
            })

        # Transfer / Cash → mark as placed (pending physical payment)
        order.is_ordered = True
        order.save(update_fields=["is_ordered"])
        order.items.all().update(is_ordered=True, date_ordered=now)
        cart.clear()
        return Response({
            "success": True,
            "order_ref": order.ref,
            "order_id": str(order.id),
            "payment_method": payment_method,
        })


# ── Checkout: verify Paystack callback ──────────────────────────────────────

class VerifyCheckoutPaymentAPIView(OrderAPIView):
    """
    POST /api/order/verify-checkout/
    Body: { "reference": "<order_ref_or_paystack_ref>" }
       OR { "session_id": "<stripe_session_id>" }

    Called by our frontend after the payment gateway redirects back.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(responses=APIPayloadSerializer)
    def post(self, request):
        session_id = request.data.get("session_id", "").strip()
        reference = request.data.get("reference", "").strip()

        if not session_id and not reference:
            return Response({"detail": "reference or session_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Stripe path: look up order by session_id stored in payment_reference,
        # or fall back to client_reference_id == order.ref
        if session_id:
            order = Order.objects.filter(payment_reference=session_id).first()
            if not order:
                # Try matching via client_reference_id (order.ref stored at session creation)
                # We'll verify against Stripe first to get the order ref
                gateway = get_gateway()
                ok, data = gateway.verify_payment(session_id)
                if not ok:
                    return Response({"verified": False, "detail": str(data)}, status=status.HTTP_402_PAYMENT_REQUIRED)
                # data should contain 'session_id'; find order by ref (client_reference_id)
                # We need Stripe to give us client_reference_id — retrieve session directly
                try:
                    import stripe as _stripe
                    _stripe.api_key = settings.STRIPE_SECRET_KEY
                    session = _stripe.checkout.Session.retrieve(session_id)
                    order_ref = session.client_reference_id
                except Exception:
                    order_ref = None

                order = Order.objects.filter(ref=order_ref).first() if order_ref else None

            if not order:
                return Response({"detail": "Order not found"}, status=status.HTTP_404_NOT_FOUND)
            if not self._can_manage_order(request.user, order):
                return Response({"detail": "Not allowed"}, status=status.HTTP_403_FORBIDDEN)
            if order.verified:
                return Response({"verified": True, "order_ref": order.ref, "order_id": str(order.id)})

            # Store the session_id for idempotency on future calls
            order.payment_reference = session_id
            order.save(update_fields=["payment_reference"])
            order.items.all().update(is_ordered=True, date_ordered=timezone.now())
            order.is_ordered = True
            order.verified = True
            order.save(update_fields=["is_ordered", "verified"])
            logger.info("Stripe: order %s verified via session %s", order.ref, session_id)
            send_order_invoice(order)
            return Response({"verified": True, "order_ref": order.ref, "order_id": str(order.id)})

        # Paystack / legacy path
        order = Order.objects.filter(ref=reference).first()
        if not order:
            return Response({"detail": "Order not found"}, status=status.HTTP_404_NOT_FOUND)
        if not self._can_manage_order(request.user, order):
            return Response({"detail": "Not allowed"}, status=status.HTTP_403_FORBIDDEN)

        if order.verified:
            return Response({"verified": True, "order_ref": order.ref, "order_id": str(order.id)})

        order.items.all().update(is_ordered=True, date_ordered=timezone.now())
        verified = order.verify_payment()
        return Response({
            "verified": verified,
            "order_ref": order.ref,
            "order_id": str(order.id),
        })


# ── Paystack webhook ─────────────────────────────────────────────────────────

class PaystackWebhookAPIView(APIView):
    """
    POST /api/order/webhook/paystack/
    Paystack sends signed events here. No authentication header required — we
    verify using HMAC-SHA512 instead.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from order.paystack import PayStack as _PayStack
        sig = request.headers.get("X-Paystack-Signature", "")
        payload_bytes = request.body

        paystack = _PayStack()
        if not paystack.verify_webhook_signature(payload_bytes, sig):
            return Response({"detail": "Invalid signature"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            event = json.loads(payload_bytes)
        except json.JSONDecodeError:
            return Response({"detail": "Bad payload"}, status=status.HTTP_400_BAD_REQUEST)

        if event.get("event") == "charge.success":
            data = event.get("data", {})
            reference = data.get("reference", "")
            order = Order.objects.filter(ref=reference).first()
            if order and not order.verified:
                order.items.all().update(is_ordered=True, date_ordered=timezone.now())
                order.verify_payment()
                logger.info("Paystack webhook: order %s verified via charge.success", reference)

        return Response({"status": "ok"})


# ── Stripe webhook ────────────────────────────────────────────────────────────

class StripeWebhookAPIView(APIView):
    """
    POST /api/order/webhook/stripe/
    Stripe sends signed events here. Signature verified via Stripe-Signature header.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        sig = request.headers.get("Stripe-Signature", "")
        payload_bytes = request.body

        try:
            import stripe as _stripe
            event = _stripe.Webhook.construct_event(
                payload_bytes, sig, settings.STRIPE_WEBHOOK_SECRET
            )
        except Exception as exc:
            logger.warning("Stripe webhook signature verification failed: %s", exc)
            return Response({"detail": "Invalid signature"}, status=status.HTTP_400_BAD_REQUEST)

        if event["type"] == "checkout.session.completed":
            session = event["data"]["object"]
            order_ref = session.get("client_reference_id")
            session_id = session.get("id")
            if order_ref:
                order = Order.objects.filter(ref=order_ref).first()
                if order and not order.verified:
                    order.payment_reference = session_id
                    order.verified = True
                    order.paid = True
                    order.is_ordered = True
                    order.save(update_fields=["payment_reference", "verified", "paid", "is_ordered"])
                    order.items.all().update(is_ordered=True, date_ordered=timezone.now())
                    logger.info("Stripe webhook: order %s verified via checkout.session.completed", order_ref)
                    send_order_invoice(order)

        return Response({"status": "ok"})


# ── Delivery time slots ──────────────────────────────────────────────────────

class TimeSlotsAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(responses=APIPayloadSerializer)
    def get(self, request):
        slots = [
            {"id": "morning",   "label": "Morning (9am – 12pm)",   "available": 8},
            {"id": "afternoon", "label": "Afternoon (12pm – 4pm)", "available": 8},
            {"id": "evening",   "label": "Evening (4pm – 8pm)",    "available": 6},
        ]
        return Response(slots)


# ── Saved addresses ──────────────────────────────────────────────────────────

class SavedAddressesAPIView(OrderAPIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(responses=APIPayloadSerializer)
    def get(self, request):
        addresses = SavedAddress.objects.filter(user=request.user)
        return Response(SavedAddressSerializer(addresses, many=True).data)

    @extend_schema(responses=APIPayloadSerializer)
    def post(self, request):
        serializer = SavedAddressSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class SavedAddressDetailAPIView(OrderAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        address = get_object_or_404(SavedAddress, pk=pk, user=request.user)
        address.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ── Promo / coupon validation ────────────────────────────────────────────────

class ValidatePromoAPIView(OrderAPIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(responses=APIPayloadSerializer)
    def post(self, request):
        code = request.data.get("code", "").strip().upper()
        if not code:
            return Response({"valid": False, "message": "No code provided"})
        try:
            subtotal = Decimal(str(request.data.get("subtotal", 0)))
        except (InvalidOperation, TypeError):
            subtotal = Decimal("0")

        coupon = Coupon.objects.filter(code__iexact=code).first()
        if not coupon:
            return Response({"valid": False, "message": "Invalid promo code"})

        discount = float(min(Decimal(str(coupon.amount)), subtotal))
        return Response({"valid": True, "code": code, "discount": discount, "message": f"Code {code} applied"})
