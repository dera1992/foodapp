from rest_framework import permissions, viewsets
from marketing.models import Signup
from marketing.serializers import SignupSerializer
from .permissions import IsOwnerOrReadOnly

class SignupViewSet(viewsets.ModelViewSet):
    queryset = Signup.objects.all()
    serializer_class = SignupSerializer

    def get_permissions(self):
        if self.action == "create":
            return [permissions.AllowAny()]
        if self.action in ["list", "destroy"]:
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]


