from rest_framework import permissions, viewsets
from budget.models import Budget, ShoppingListItem, BudgetTemplate, BudgetTemplateItem
from budget.serializers import BudgetSerializer, ShoppingListItemSerializer, BudgetTemplateSerializer, BudgetTemplateItemSerializer
from .permissions import IsOwnerOrReadOnly

class BudgetViewSet(viewsets.ModelViewSet):
    queryset = Budget.objects.all()
    serializer_class = BudgetSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]


class ShoppingListItemViewSet(viewsets.ModelViewSet):
    queryset = ShoppingListItem.objects.all()
    serializer_class = ShoppingListItemSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]


class BudgetTemplateViewSet(viewsets.ModelViewSet):
    queryset = BudgetTemplate.objects.all()
    serializer_class = BudgetTemplateSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]


class BudgetTemplateItemViewSet(viewsets.ModelViewSet):
    queryset = BudgetTemplateItem.objects.all()
    serializer_class = BudgetTemplateItemSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]


