try:
    import django_filters
except ImportError:  # pragma: no cover
    django_filters = None

from account.models import User, Shop


if django_filters:
    class UserFilter(django_filters.FilterSet):
        class Meta:
            model = User
            fields = ["role", "is_active", "email"]


    class ShopFilter(django_filters.FilterSet):
        class Meta:
            model = Shop
            fields = ["city", "state", "is_active", "is_verified"]
else:
    UserFilter = None
    ShopFilter = None
