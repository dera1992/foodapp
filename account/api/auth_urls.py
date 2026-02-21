from django.urls import path

from .views import (
    ActivateAccountAPIView,
    ChooseRoleAPIView,
    CustomerSetupAPIView,
    DispatcherPersonalSetupAPIView,
    DispatcherVehicleSetupAPIView,
    LoginAPIView,
    LogoutAPIView,
    MeAPIView,
    PasswordChangeAPIView,
    PasswordResetConfirmAPIView,
    PasswordResetRequestAPIView,
    RefreshAPIView,
    RegisterAPIView,
    ShopAddressSetupAPIView,
    ShopDocsSetupAPIView,
    ShopInfoSetupAPIView,
    ShopPlanSetupAPIView,
)

from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('register/', RegisterAPIView.as_view(), name='api-register'),
    path('activate/<str:uidb64>/<str:token>/', ActivateAccountAPIView.as_view(), name='api-activate'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutAPIView.as_view(), name='api-logout'),
    path('me/', MeAPIView.as_view(), name='api-me'),
    path('choose-role/', ChooseRoleAPIView.as_view(), name='api-choose-role'),
    path('password-change/', PasswordChangeAPIView.as_view(), name='api-password-change'),
    path('password-reset/', PasswordResetRequestAPIView.as_view(), name='api-password-reset'),
    path('password-reset-confirm/<str:uidb64>/<str:token>/', PasswordResetConfirmAPIView.as_view(), name='api-password-reset-confirm'),
    path('customer/setup/', CustomerSetupAPIView.as_view(), name='api-customer-setup'),
    path('shop/info/', ShopInfoSetupAPIView.as_view(), name='api-shop-info'),
    path('shop/address/', ShopAddressSetupAPIView.as_view(), name='api-shop-address'),
    path('shop/docs/', ShopDocsSetupAPIView.as_view(), name='api-shop-docs'),
    path('shop/plan/', ShopPlanSetupAPIView.as_view(), name='api-shop-plan'),
    path('dispatcher/personal/', DispatcherPersonalSetupAPIView.as_view(), name='api-dispatcher-personal'),
    path('dispatcher/vehicle/', DispatcherVehicleSetupAPIView.as_view(), name='api-dispatcher-vehicle'),
]
