import json

from rest_framework import permissions

from seafood.api.schema import DocumentedAPIView
from rest_framework.response import Response

from budget.models import Budget
from budget.serializers import BudgetSerializer
from voice.views import interpret_voice


class VoiceInterpretAPIView(DocumentedAPIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        # Reuse legacy interpreter logic for full feature parity (rules+AI+cache+session behavior).
        django_response = interpret_voice(request._request)
        return Response(json.loads(django_response.content.decode("utf-8")))


class VoiceSearchAPIView(DocumentedAPIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({"detail": "Use POST /interpret/ with natural-language text for search mode."})


class VoiceBudgetAPIView(DocumentedAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        budget = Budget.get_active_for_user(request.user)
        return Response({"active_budget": BudgetSerializer(budget).data if budget else None})
