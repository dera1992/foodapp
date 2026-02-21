from django.shortcuts import get_object_or_404
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from cart.cart import Cart
from cart.serializers import CartItemInputSerializer
from foodCreate.models import Products
from order.models import Order


class CartViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CartItemInputSerializer

    def _cart(self, request):
        return Cart(request)

    def _validated_payload(self, request):
        serializer = CartItemInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return serializer.validated_data

    def _validated_product(self, request):
        payload = self._validated_payload(request)
        product = get_object_or_404(Products, id=payload["product_id"])
        return product, payload

    def list(self, request):
        cart = self._cart(request)
        items = []
        for item in cart:
            product = item.get("product")
            items.append(
                {
                    "product_id": product.id if product else None,
                    "title": product.title if product else "",
                    "quantity": item["quantity"],
                    "price": str(item["price"]),
                    "total_price": str(item["total_price"]),
                }
            )
        return Response({"items": items, "count": len(cart), "total": str(cart.get_total_price())})

    @action(detail=False, methods=["post"])
    def add(self, request):
        product, payload = self._validated_product(request)
        self._cart(request).add(product=product, quantity=payload["quantity"])
        return Response({"detail": "Item added"}, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["post"])
    def remove(self, request):
        product, _ = self._validated_product(request)
        self._cart(request).remove(product)
        return Response({"detail": "Item removed"})

    @action(detail=False, methods=["post"])
    def update_quantity(self, request):
        product, payload = self._validated_product(request)
        self._cart(request).add(product=product, quantity=payload["quantity"], update_quantity=True)
        return Response({"detail": "Quantity updated"})

    @action(detail=False, methods=["post"])
    def clear(self, request):
        self._cart(request).clear()
        return Response({"detail": "Cart cleared"})

    @action(detail=False, methods=["post"], url_path="add-to-cart")
    def add_to_cart(self, request):
        return self.add(request)

    @action(detail=False, methods=["post"], url_path="add-to-cart-ajax")
    def add_to_cart_ajax(self, request):
        response = self.add(request)
        response.data = {"status": "ok", "detail": "Item added"}
        return response

    @action(detail=False, methods=["post"], url_path="remove-from-cart")
    def remove_from_cart(self, request):
        return self.remove(request)

    @action(detail=False, methods=["post"], url_path="remove-single-item-from-cart")
    def remove_single_item_from_cart(self, request):
        product, _ = self._validated_product(request)
        cart = self._cart(request)
        cart_item = cart.cart.get(str(product.id))
        if not cart_item:
            return Response({"detail": "Item not in cart"}, status=status.HTTP_404_NOT_FOUND)
        if int(cart_item["quantity"]) > 1:
            cart.add(product=product, quantity=int(cart_item["quantity"]) - 1, update_quantity=True)
        else:
            cart.remove(product)
        return Response({"detail": "Item quantity updated"})

    @action(detail=False, methods=["get"], url_path="order-summary")
    def order_summary(self, request):
        order = Order.objects.filter(user=request.user, is_ordered=False).first()
        if not order:
            return Response({"detail": "No active order", "items": [], "total": 0})
        items = [
            {
                "id": item.id,
                "product": item.item.title,
                "quantity": item.quantity,
                "total": item.get_final_price(),
            }
            for item in order.items.select_related("item")
        ]
        return Response({"order_id": order.id, "ref": order.ref, "items": items, "total": order.get_total()})
