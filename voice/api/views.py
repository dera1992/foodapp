import json

from rest_framework import permissions
from rest_framework import serializers
from rest_framework.views import APIView

from rest_framework.response import Response

from budget.models import Budget
from budget.serializers import BudgetSerializer
from voice.views import interpret_voice
from drf_spectacular.utils import extend_schema


class APIPayloadSerializer(serializers.Serializer):
    pass


class BaseAPIView(APIView):
    serializer_class = APIPayloadSerializer


class PublicAPIView(BaseAPIView):
    permission_classes = [permissions.AllowAny]


class AuthenticatedAPIView(BaseAPIView):
    permission_classes = [permissions.IsAuthenticated]


class VoiceInterpretAPIView(PublicAPIView):

    @extend_schema(responses=APIPayloadSerializer)
    def post(self, request):
        # Reuse legacy interpreter logic for full feature parity (rules+AI+cache+session behavior).
        django_response = interpret_voice(request._request)
        return Response(json.loads(django_response.content.decode("utf-8")))


class VoiceSearchAPIView(PublicAPIView):

    @extend_schema(responses=APIPayloadSerializer)
    def get(self, request):
        return Response({"detail": "Use POST /interpret/ with natural-language text for search mode."})


class VoiceBudgetAPIView(AuthenticatedAPIView):

    @extend_schema(responses=APIPayloadSerializer)
    def get(self, request):
        budget = Budget.get_active_for_user(request.user)
        return Response({"active_budget": BudgetSerializer(budget).data if budget else None})
