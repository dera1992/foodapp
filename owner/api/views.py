from django.core.mail import EmailMessage
from django.db.models import Count
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status, viewsets
from rest_framework.response import Response

from seafood.api.schema import DocumentedAPIView

from account.models import Profile
from foodCreate.models import Products
from owner.models import Affiliate, Information
from owner.serializers import AffiliateSerializer, InformationSerializer

from .permissions import IsOwnerOrReadOnly


class InformationViewSet(viewsets.ModelViewSet):
    queryset = Information.objects.all()
    serializer_class = InformationSerializer

    def get_permissions(self):
        if self.action == "create":
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsOwnerOrReadOnly()]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        info = serializer.save()
        subject = info.subject
        message = "Hello \"{}\" sent you a message below through Bunchfood contact form\n{}".format(
            info.name or "Anonymous",
            info.message,
        )
        try:
            email = EmailMessage(subject, message, from_email=info.email, to=['ezechdr16@gmail.com'])
            email.send(fail_silently=True)
        except Exception:
            pass
        return Response(self.get_serializer(info).data, status=status.HTTP_201_CREATED)


class AffiliateViewSet(viewsets.ModelViewSet):
    queryset = Affiliate.objects.all()
    serializer_class = AffiliateSerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]


class MyCartAPIView(DocumentedAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        myab_list = Products.objects.filter(shop__owner=request.user)
        profile = Profile.objects.filter(user=request.user).first()
        lates = Products.objects.order_by("-created_date")[:3]
        counts = list(Products.objects.values("category__name").annotate(total=Count("category")))
        return Response(
            {
                "products": [
                    {"id": p.id, "title": p.title, "price": str(p.price), "is_active": p.is_active}
                    for p in myab_list
                ],
                "profile": {"id": profile.id, "phone": profile.phone} if profile else None,
                "latest": [{"id": p.id, "title": p.title} for p in lates],
                "category_counts": counts,
            }
        )


class BookmarkedAPIView(DocumentedAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        bookmarked = Products.objects.filter(favourite=request.user)
        return Response({"results": [{"id": p.id, "title": p.title} for p in bookmarked]})


class DeleteOrHidePostAPIView(DocumentedAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        ad = get_object_or_404(Products, id=pk)
        if request.user != ad.shop.owner:
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)
        ad.is_active = False
        ad.save(update_fields=["is_active"])
        return Response({"detail": "Post hidden successfully"})


class AboutAPIView(DocumentedAPIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        affiliates = Affiliate.objects.all()[:10]
        return Response(AffiliateSerializer(affiliates, many=True).data)


class FAQAPIView(DocumentedAPIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({"detail": "FAQ endpoint available"})


class PaymentStatusAPIView(DocumentedAPIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, state):
        if state not in {"success", "failure"}:
            return Response({"detail": "Invalid state"}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"status": state})
