from django.shortcuts import get_object_or_404
from rest_framework import permissions, status, viewsets
from rest_framework import serializers
from rest_framework.views import APIView

from rest_framework.decorators import action
from rest_framework.response import Response

from budget.models import Budget, BudgetTemplate, BudgetTemplateItem, ShoppingListItem
from budget.serializers import (
    BudgetSerializer,
    BudgetTemplateItemSerializer,
    BudgetTemplateSerializer,
    ShoppingListItemSerializer,
)
from foodCreate.models import Products
from order.models import Order

from .permissions import IsOwnerOrReadOnly
from drf_spectacular.utils import extend_schema


class APIPayloadSerializer(serializers.Serializer):
    pass



class BudgetViewSet(viewsets.ModelViewSet):
    queryset = Budget.objects.select_related("user")
    serializer_class = BudgetSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    def _get_budget_item(self, budget, item_id):
        return get_object_or_404(ShoppingListItem, id=item_id, budget=budget)

    def _request_quantity(self, request, default=1):
        return int(request.data.get("quantity", default))

    @action(detail=True, methods=["post"], url_path="add-item")
    def add_item(self, request, pk=None):
        budget = self.get_object()
        product_id = request.data.get("product")
        name = request.data.get("name", "")
        quantity = self._request_quantity(request)
        product = Products.objects.filter(id=product_id).first() if product_id else None
        item, created = ShoppingListItem.objects.get_or_create(
            budget=budget,
            product=product,
            name=name,
            defaults={"quantity": quantity},
        )
        if not created:
            item.quantity += quantity
            item.save(update_fields=["quantity"])
        return Response(ShoppingListItemSerializer(item).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="remove-item")
    def remove_item(self, request, pk=None):
        budget = self.get_object()
        item = self._get_budget_item(budget, request.data.get("item_id"))
        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"], url_path="update-item-quantity")
    def update_item_quantity(self, request, pk=None):
        budget = self.get_object()
        item = self._get_budget_item(budget, request.data.get("item_id"))
        quantity = self._request_quantity(request)
        item.quantity = max(1, quantity)
        item.save(update_fields=["quantity"])
        return Response(ShoppingListItemSerializer(item).data)

    @action(detail=True, methods=["post"], url_path="from-cart")
    def from_cart(self, request, pk=None):
        budget = self.get_object()
        order = Order.objects.filter(user=request.user, is_ordered=False).first()
        if not order:
            return Response({"detail": "No active cart/order", "items": []})

        created_items = []
        for order_item in order.items.select_related("item"):
            item, _ = ShoppingListItem.objects.get_or_create(
                budget=budget,
                product=order_item.item,
                name="",
                defaults={"quantity": order_item.quantity},
            )
            created_items.append(item)
        return Response(ShoppingListItemSerializer(created_items, many=True).data)

    @action(detail=True, methods=["post"], url_path="duplicate")
    def duplicate(self, request, pk=None):
        budget = self.get_object()
        duplicate_budget = Budget.objects.create(user=request.user, total_budget=budget.total_budget)
        for item in budget.items.all():
            ShoppingListItem.objects.create(
                budget=duplicate_budget,
                product=item.product,
                name=item.name,
                quantity=item.quantity,
            )
        return Response(BudgetSerializer(duplicate_budget).data, status=status.HTTP_201_CREATED)


class ShoppingListItemViewSet(viewsets.ModelViewSet):
    queryset = ShoppingListItem.objects.select_related("budget", "product")
    serializer_class = ShoppingListItemSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]


class BudgetTemplateViewSet(viewsets.ModelViewSet):
    queryset = BudgetTemplate.objects.select_related("user")
    serializer_class = BudgetTemplateSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    def _request_quantity(self, request, default=1):
        return int(request.data.get("quantity", default))

    @action(detail=True, methods=["post"], url_path="apply")
    def apply(self, request, pk=None):
        template = self.get_object()
        budget_id = request.data.get("budget_id")
        budget = get_object_or_404(Budget, id=budget_id, user=request.user)
        created_items = []
        for template_item in template.items.select_related("product"):
            item, _ = ShoppingListItem.objects.get_or_create(
                budget=budget,
                product=template_item.product,
                name="",
                defaults={"quantity": template_item.quantity},
            )
            created_items.append(item)
        return Response(ShoppingListItemSerializer(created_items, many=True).data)

    @action(detail=True, methods=["post"], url_path="add-item")
    def add_item(self, request, pk=None):
        template = self.get_object()
        product = get_object_or_404(Products, id=request.data.get("product_id"))
        quantity = self._request_quantity(request)
        item, created = BudgetTemplateItem.objects.get_or_create(
            template=template,
            product=product,
            defaults={"quantity": quantity},
        )
        if not created:
            item.quantity += quantity
            item.save(update_fields=["quantity"])
        return Response(BudgetTemplateItemSerializer(item).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="remove-item")
    def remove_item(self, request, pk=None):
        template = self.get_object()
        item = get_object_or_404(BudgetTemplateItem, id=request.data.get("item_id"), template=template)
        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class BudgetTemplateItemViewSet(viewsets.ModelViewSet):
    queryset = BudgetTemplateItem.objects.select_related("template", "product")
    serializer_class = BudgetTemplateItemSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]


class ProductAutocompleteAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = APIPayloadSerializer

    @extend_schema(responses=APIPayloadSerializer)
    def get(self, request):
        q = request.query_params.get("q", "").strip()
        queryset = Products.objects.filter(is_active=True)
        if q:
            queryset = queryset.filter(title__icontains=q)
        queryset = queryset.order_by("title")[:20]
        data = [{"id": p.id, "title": p.title, "price": str(p.price)} for p in queryset]
        return Response(data)
