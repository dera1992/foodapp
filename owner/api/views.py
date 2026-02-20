from rest_framework import permissions, viewsets
from owner.models import Information, Affiliate
from owner.serializers import InformationSerializer, AffiliateSerializer
from .permissions import IsOwnerOrReadOnly

class InformationViewSet(viewsets.ModelViewSet):
    queryset = Information.objects.all()
    serializer_class = InformationSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]


class AffiliateViewSet(viewsets.ModelViewSet):
    queryset = Affiliate.objects.all()
    serializer_class = AffiliateSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]


