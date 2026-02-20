import importlib.util
from rest_framework import permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from account.models import (
    DispatcherProfile,
    Profile,
    Shop,
    ShopFollower,
    ShopIntegration,
    ShopNotification,
    ShopSubscription,
    SubscriptionPlan,
    User,
)
from account.serializers import (
    DispatcherProfileSerializer,
    ProfileSerializer,
    ShopFollowerSerializer,
    ShopIntegrationSerializer,
    ShopNotificationSerializer,
    ShopSerializer,
    ShopSubscriptionSerializer,
    SubscriptionPlanSerializer,
    UserSerializer,
)

from .filters import ShopFilter, UserFilter
from .jwt_utils import create_token_pair, decode_refresh_token
from .permissions import IsOwnerOrReadOnly


class RegisterAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        tokens = create_token_pair(user)
        return Response({"user": UserSerializer(user).data, **tokens}, status=status.HTTP_201_CREATED)


class LoginAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")
        user = User.objects.filter(email=email).first()
        if not user or not user.check_password(password):
            return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
        return Response(create_token_pair(user))


class RefreshAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        token = request.data.get("refresh")
        if not token:
            return Response({"detail": "refresh token is required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            payload = decode_refresh_token(token)
            user = User.objects.get(id=payload["sub"])
        except Exception:
            return Response({"detail": "Invalid refresh token"}, status=status.HTTP_401_UNAUTHORIZED)
        return Response(create_token_pair(user))


class LogoutAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if importlib.util.find_spec("rest_framework_simplejwt") is not None:
            refresh = request.data.get("refresh")
            if refresh:
                try:
                    from rest_framework_simplejwt.tokens import RefreshToken

                    RefreshToken(refresh).blacklist()
                except Exception:
                    pass
        return Response({"detail": "Logged out successfully"})


class MeAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class ChooseRoleAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        role = request.data.get("role")
        if role not in {"customer", "shop", "dispatcher"}:
            return Response({"detail": "Invalid role"}, status=status.HTTP_400_BAD_REQUEST)
        request.user.role = role
        request.user.save(update_fields=["role"])
        return Response(UserSerializer(request.user).data)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
    filterset_class = UserFilter
    search_fields = ["email", "first_name", "last_name"]

    def get_queryset(self):
        if self.request.user.is_staff:
            return self.queryset
        return self.queryset.filter(id=self.request.user.id)


class ProfileViewSet(viewsets.ModelViewSet):
    queryset = Profile.objects.select_related("user")
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]


class SubscriptionPlanViewSet(viewsets.ModelViewSet):
    queryset = SubscriptionPlan.objects.all()
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [permissions.IsAdminUser]


class ShopViewSet(viewsets.ModelViewSet):
    queryset = Shop.objects.select_related("owner")
    serializer_class = ShopSerializer
    filterset_class = ShopFilter
    search_fields = ["name", "city", "state"]

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsOwnerOrReadOnly()]


class ShopSubscriptionViewSet(viewsets.ModelViewSet):
    queryset = ShopSubscription.objects.all()
    serializer_class = ShopSubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]


class DispatcherProfileViewSet(viewsets.ModelViewSet):
    queryset = DispatcherProfile.objects.all()
    serializer_class = DispatcherProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]


class ShopFollowerViewSet(viewsets.ModelViewSet):
    queryset = ShopFollower.objects.all()
    serializer_class = ShopFollowerSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]


class ShopNotificationViewSet(viewsets.ModelViewSet):
    queryset = ShopNotification.objects.all()
    serializer_class = ShopNotificationSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]


class ShopIntegrationViewSet(viewsets.ModelViewSet):
    queryset = ShopIntegration.objects.all()
    serializer_class = ShopIntegrationSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
