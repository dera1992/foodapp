from django.urls import path
from .views import VoiceInterpretAPIView

urlpatterns = [
    path('interpret/', VoiceInterpretAPIView.as_view(), name='voice-interpret-api'),
]
