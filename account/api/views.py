from django.conf import settings
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import EmailMessage, send_mail
from django.template.loader import get_template
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import permissions, status, viewsets
from rest_framework import serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from social_django.utils import load_backend, load_strategy

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
from account.tokens import account_activation_token

from .filters import ShopFilter, UserFilter
from .permissions import IsOwnerOrReadOnly
from drf_spectacular.utils import extend_schema


class APIPayloadSerializer(serializers.Serializer):
    pass


class SocialLoginInputSerializer(serializers.Serializer):
    provider = serializers.ChoiceField(choices=["google-oauth2", "facebook"])
    access_token = serializers.CharField()


class AccountAPIView(APIView):
    """Shared helpers for account-related API views."""

    serializer_class = APIPayloadSerializer

    def _get_user_from_uidb64(self, uidb64):
        user_id = force_str(urlsafe_base64_decode(uidb64))
        return User.objects.get(pk=user_id)

    def _token_is_valid(self, user, token):
        return account_activation_token.check_token(user, token) or default_token_generator.check_token(user, token)

    def _update_user_role(self, user, role):
        user.role = role
        user.save(update_fields=["role"])

    def _update_model_with_serializer(self, instance, serializer_class, payload, save_kwargs=None):
        serializer = serializer_class(instance, data=payload, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(**(save_kwargs or {}))
        return serializer

    def _validate_password(self, password, user=None):
        try:
            validate_password(password, user=user)
        except Exception as exc:
            raise serializers.ValidationError({"password": list(exc.messages)})


class AuthAPIView(AccountAPIView):
    permission_classes = [permissions.AllowAny]


class RegisterAPIView(AuthAPIView):

    @extend_schema(responses=APIPayloadSerializer)
    def post(self, request):
        self._validate_password(request.data.get("password"), user=None)
        serializer = UserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        user.is_active = False
        user.save(update_fields=["is_active"])

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = account_activation_token.make_token(user)
        activation_path = f"/api/v1/auth/activate/{uid}/{token}/"
        activation_url = request.build_absolute_uri(activation_path)

        html_message = get_template("registration/account_activation_email.html").render(
            {
                "user": user,
                "domain": request.get_host(),
                "uid": uid,
                "token": token,
            }
        )
        email = EmailMessage(
            "Activate Your Account",
            html_message,
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "no-reply@seafood.local"),
            to=[user.email],
        )
        email.content_subtype = "html"
        email.send(fail_silently=True)

        response_payload = {
            "detail": "Registration successful. Please activate your account from the email sent.",
        }
        if settings.DEBUG:
            response_payload["activation_url"] = activation_url
        return Response(response_payload, status=status.HTTP_201_CREATED)


class ActivateAccountAPIView(AuthAPIView):

    @extend_schema(responses=APIPayloadSerializer)
    def post(self, request, uidb64, token):
        try:
            user = self._get_user_from_uidb64(uidb64)
        except Exception:
            return Response({"detail": "Invalid activation link"}, status=status.HTTP_400_BAD_REQUEST)

        if not self._token_is_valid(user, token):
            return Response({"detail": "Invalid activation token"}, status=status.HTTP_400_BAD_REQUEST)

        user.is_active = True
        user.save(update_fields=["is_active"])
        return Response({"detail": "Account activated successfully"})


class LoginAPIView(AuthAPIView):

    @extend_schema(responses=APIPayloadSerializer)
    def post(self, request):
        serializer = TokenObtainPairSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data)


class RefreshAPIView(AuthAPIView):

    @extend_schema(responses=APIPayloadSerializer)
    def post(self, request):
        serializer = TokenRefreshSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data)


class SocialLoginAPIView(AuthAPIView):
    serializer_class = SocialLoginInputSerializer

    @extend_schema(request=SocialLoginInputSerializer, responses=APIPayloadSerializer)
    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        provider = serializer.validated_data["provider"]
        access_token = serializer.validated_data["access_token"]

        strategy = load_strategy(request=request)
        backend = load_backend(strategy=strategy, name=provider, redirect_uri=None)
        user = backend.do_auth(access_token)
        if not user:
            return Response({"detail": "Social authentication failed"}, status=status.HTTP_401_UNAUTHORIZED)
        if not user.is_active:
            return Response({"detail": "Account is not active"}, status=status.HTTP_403_FORBIDDEN)

        refresh = RefreshToken.for_user(user)
        return Response({"refresh": str(refresh), "access": str(refresh.access_token)})


class LogoutAPIView(AccountAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = APIPayloadSerializer

    @extend_schema(responses=APIPayloadSerializer)
    def post(self, request):
        refresh = request.data.get("refresh")
        if refresh:
            try:
                from rest_framework_simplejwt.tokens import RefreshToken

                RefreshToken(refresh).blacklist()
            except Exception:
                pass
        return Response({"detail": "Logged out successfully"})


class MeAPIView(AccountAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = APIPayloadSerializer

    @extend_schema(responses=APIPayloadSerializer)
    def get(self, request):
        return Response(UserSerializer(request.user).data)


class ChooseRoleAPIView(AccountAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = APIPayloadSerializer

    @extend_schema(responses=APIPayloadSerializer)
    def post(self, request):
        role = request.data.get("role")
        if role not in {"customer", "shop", "dispatcher"}:
            return Response({"detail": "Invalid role"}, status=status.HTTP_400_BAD_REQUEST)
        request.user.role = role
        request.user.save(update_fields=["role"])
        return Response(UserSerializer(request.user).data)


class PasswordChangeAPIView(AccountAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = APIPayloadSerializer

    @extend_schema(responses=APIPayloadSerializer)
    def post(self, request):
        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")
        if not old_password or not new_password:
            return Response(
                {"detail": "old_password and new_password are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not request.user.check_password(old_password):
            return Response({"detail": "Old password is incorrect"}, status=status.HTTP_400_BAD_REQUEST)

        self._validate_password(new_password, user=request.user)
        request.user.set_password(new_password)
        request.user.save(update_fields=["password"])
        return Response({"detail": "Password changed successfully"})


class PasswordResetRequestAPIView(AuthAPIView):

    @extend_schema(responses=APIPayloadSerializer)
    def post(self, request):
        email = request.data.get("email")
        user = User.objects.filter(email=email).first()
        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_path = f"/api/v1/auth/password-reset-confirm/{uid}/{token}/"
            reset_url = request.build_absolute_uri(reset_path)
            message = (
                "You requested a password reset. "
                f"Use this endpoint to set a new password: {reset_url}"
            )
            send_mail(
                "Password reset request",
                message,
                getattr(settings, "DEFAULT_FROM_EMAIL", "no-reply@seafood.local"),
                [user.email],
                fail_silently=True,
            )
        return Response({"detail": "If the email exists, a reset link has been sent."})


class PasswordResetConfirmAPIView(AuthAPIView):

    @extend_schema(responses=APIPayloadSerializer)
    def post(self, request, uidb64, token):
        new_password = request.data.get("new_password")
        if not new_password:
            return Response({"detail": "new_password is required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = self._get_user_from_uidb64(uidb64)
        except Exception:
            return Response({"detail": "Invalid reset link"}, status=status.HTTP_400_BAD_REQUEST)

        if not self._token_is_valid(user, token):
            return Response({"detail": "Invalid or expired token"}, status=status.HTTP_400_BAD_REQUEST)

        self._validate_password(new_password, user=user)
        user.set_password(new_password)
        user.save(update_fields=["password"])
        return Response({"detail": "Password reset successful"})


class CustomerSetupAPIView(AccountAPIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(responses=APIPayloadSerializer)
    def post(self, request):
        profile, _ = Profile.objects.get_or_create(user=request.user)
        if request.data.get("skip"):
            self._update_user_role(request.user, "customer")
            return Response({"detail": "Customer setup skipped", "role": request.user.role})

        serializer = self._update_model_with_serializer(
            profile,
            ProfileSerializer,
            request.data,
            save_kwargs={"user": request.user},
        )
        self._update_user_role(request.user, "customer")
        return Response(serializer.data)


class ShopInfoSetupAPIView(AccountAPIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(responses=APIPayloadSerializer)
    def post(self, request):
        shop, _ = Shop.objects.get_or_create(owner=request.user)
        serializer = self._update_model_with_serializer(shop, ShopSerializer, request.data, save_kwargs={"owner": request.user})
        return Response(serializer.data)


class ShopAddressSetupAPIView(AccountAPIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(responses=APIPayloadSerializer)
    def post(self, request):
        shop, _ = Shop.objects.get_or_create(owner=request.user)
        fields = {k: v for k, v in request.data.items() if k in {"address", "city", "state", "country", "postal_code", "latitude", "longitude"}}
        serializer = self._update_model_with_serializer(shop, ShopSerializer, fields, save_kwargs={"owner": request.user})
        return Response(serializer.data)


class ShopDocsSetupAPIView(AccountAPIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(responses=APIPayloadSerializer)
    def post(self, request):
        shop, _ = Shop.objects.get_or_create(owner=request.user)
        serializer = self._update_model_with_serializer(
            shop,
            ShopSerializer,
            {"business_document": request.data.get("business_document")},
            save_kwargs={"owner": request.user},
        )
        return Response(serializer.data)


class ShopPlanSetupAPIView(AccountAPIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(responses=APIPayloadSerializer)
    def post(self, request):
        shop, _ = Shop.objects.get_or_create(owner=request.user)
        plan_id = request.data.get("plan")
        if plan_id:
            plan = SubscriptionPlan.objects.filter(pk=plan_id).first()
            if not plan:
                return Response({"detail": "Invalid plan"}, status=status.HTTP_400_BAD_REQUEST)
            shop.subscription = plan
        shop.is_active = True
        shop.save(update_fields=["subscription", "is_active"])

        admin_emails = list(
            User.objects.filter(is_staff=True, is_superuser=True)
            .exclude(email="")
            .values_list("email", flat=True)
        )
        if admin_emails:
            send_mail(
                "New shop account opened",
                (
                    f"A new shop account has been opened.\n\n"
                    f"Shop: {shop.name}\n"
                    f"Owner: {request.user.email}\n"
                    f"Shop ID: {shop.id}"
                ),
                getattr(settings, "DEFAULT_FROM_EMAIL", "no-reply@seafood.local"),
                admin_emails,
                fail_silently=True,
            )

        self._update_user_role(request.user, "shop")
        return Response({"detail": "Shop onboarding complete", "shop_id": shop.id})


class DispatcherPersonalSetupAPIView(AccountAPIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(responses=APIPayloadSerializer)
    def post(self, request):
        profile, _ = DispatcherProfile.objects.get_or_create(user=request.user)
        serializer = self._update_model_with_serializer(
            profile,
            DispatcherProfileSerializer,
            request.data,
            save_kwargs={"user": request.user},
        )
        return Response(serializer.data)


class DispatcherVehicleSetupAPIView(AccountAPIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(responses=APIPayloadSerializer)
    def post(self, request):
        profile, _ = DispatcherProfile.objects.get_or_create(user=request.user)
        fields = {k: v for k, v in request.data.items() if k in {"vehicle_type", "plate_number"}}
        serializer = self._update_model_with_serializer(
            profile,
            DispatcherProfileSerializer,
            fields,
            save_kwargs={"user": request.user},
        )
        self._update_user_role(request.user, "dispatcher")
        return Response(serializer.data)


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
