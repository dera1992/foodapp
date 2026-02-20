from django.urls import path

from .views import LoginAPIView, LogoutAPIView, RefreshAPIView, RegisterAPIView

urlpatterns = [
    path('register/', RegisterAPIView.as_view(), name='api-register'),
    path('login/', LoginAPIView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', RefreshAPIView.as_view(), name='token_refresh'),
    path('logout/', LogoutAPIView.as_view(), name='api-logout'),
]
