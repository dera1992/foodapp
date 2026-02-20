from django.shortcuts import get_object_or_404
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from cart.cart import Cart
from cart.serializers import CartItemInputSerializer, CartItemUpdateSerializer
from foodCreate.models import Products


class CartViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        cart = Cart(request)
        items = []
        for item in cart:
            product = item.get('product')
            items.append({
                'product_id': product.id if product else None,
                'title': product.title if product else '',
                'quantity': item['quantity'],
                'price': str(item['price']),
                'total_price': str(item['total_price']),
            })
        return Response({'items': items, 'count': len(cart), 'total': str(cart.get_total_price())})

    @action(detail=False, methods=['post'])
    def add(self, request):
        serializer = CartItemInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product = get_object_or_404(Products, id=serializer.validated_data['product_id'])
        Cart(request).add(product=product, quantity=serializer.validated_data['quantity'])
        return Response({'detail': 'Item added'}, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'])
    def remove(self, request):
        serializer = CartItemInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product = get_object_or_404(Products, id=serializer.validated_data['product_id'])
        Cart(request).remove(product)
        return Response({'detail': 'Item removed'})

    @action(detail=False, methods=['post'])
    def update_quantity(self, request):
        data = CartItemInputSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        product = get_object_or_404(Products, id=data.validated_data['product_id'])
        Cart(request).add(product=product, quantity=data.validated_data['quantity'], update_quantity=True)
        return Response({'detail': 'Quantity updated'})

    @action(detail=False, methods=['post'])
    def clear(self, request):
        Cart(request).clear()
        return Response({'detail': 'Cart cleared'})
