from django.http import JsonResponse
from django.views import View


class SchemaFallbackView(View):
    def get(self, request, *args, **kwargs):
        return JsonResponse(
            {
                "detail": "drf-spectacular is not installed. Install dependencies from requirements.txt.",
            },
            status=503,
        )


class DocsFallbackView(View):
    def get(self, request, *args, **kwargs):
        return JsonResponse(
            {
                "detail": "Swagger UI is unavailable because drf-spectacular is not installed.",
            },
            status=503,
        )
