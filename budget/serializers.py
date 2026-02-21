from rest_framework import serializers
from .models import Budget, ShoppingListItem, BudgetTemplate, BudgetTemplateItem

class BudgetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Budget
        fields = "__all__"


class ShoppingListItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShoppingListItem
        fields = "__all__"


class BudgetTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BudgetTemplate
        fields = "__all__"


class BudgetTemplateItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = BudgetTemplateItem
        fields = "__all__"


