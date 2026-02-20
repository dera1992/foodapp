from rest_framework.routers import DefaultRouter
from .views import BudgetViewSet, ShoppingListItemViewSet, BudgetTemplateViewSet, BudgetTemplateItemViewSet

router = DefaultRouter()
router.register(r"budgets", BudgetViewSet, basename="budgets")
router.register(r"shopping-list-items", ShoppingListItemViewSet, basename="shopping-list-items")
router.register(r"budget-templates", BudgetTemplateViewSet, basename="budget-templates")
router.register(r"budget-template-items", BudgetTemplateItemViewSet, basename="budget-template-items")

urlpatterns = router.urls
