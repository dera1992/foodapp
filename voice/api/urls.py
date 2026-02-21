from django.urls import path

from .views import VoiceBudgetAPIView, VoiceInterpretAPIView, VoiceSearchAPIView

urlpatterns = [
    path('interpret/', VoiceInterpretAPIView.as_view(), name='voice-interpret-api'),
    path('search/', VoiceSearchAPIView.as_view(), name='voice-search-api'),
    path('budget/', VoiceBudgetAPIView.as_view(), name='voice-budget-api'),
]
