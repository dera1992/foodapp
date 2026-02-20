import importlib.util
from django.urls import path

from .views import ChooseRoleAPIView, LoginAPIView, LogoutAPIView, MeAPIView, RefreshAPIView, RegisterAPIView

HAS_SIMPLEJWT = importlib.util.find_spec("rest_framework_simplejwt") is not None
if HAS_SIMPLEJWT:
    from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('register/', RegisterAPIView.as_view(), name='api-register'),
    path('login/', TokenObtainPairView.as_view() if HAS_SIMPLEJWT else LoginAPIView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view() if HAS_SIMPLEJWT else RefreshAPIView.as_view(), name='token_refresh'),
    path('logout/', LogoutAPIView.as_view(), name='api-logout'),
    path('me/', MeAPIView.as_view(), name='api-me'),
    path('choose-role/', ChooseRoleAPIView.as_view(), name='api-choose-role'),
]
