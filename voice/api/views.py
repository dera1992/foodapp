from rest_framework import permissions, views
from rest_framework.response import Response

from voice.serializers import VoiceInterpretSerializer
from voice.services import product_search, budget_plan
from voice.parser import normalize, rules_parse, INTENT_PRODUCT_SEARCH, INTENT_BUDGET_PLAN


class VoiceInterpretAPIView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = VoiceInterpretSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data
        parsed = rules_parse(normalize(payload['text']))
        results = {}
        if parsed.get('intent') == INTENT_PRODUCT_SEARCH:
            results['products'] = product_search(parsed.get('entities', {}), user=request.user)
        elif parsed.get('intent') == INTENT_BUDGET_PLAN:
            bundles, message, _, missing = budget_plan(parsed.get('entities', {}))
            results = {'bundles': bundles, 'message': message, 'missing_items': missing}
        return Response({'intent': parsed.get('intent'), 'entities': parsed.get('entities', {}), 'results': results})
