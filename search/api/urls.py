from django.urls import path

from .views import RecommendationsAPIView, SearchAPIView

urlpatterns = [
    path('', SearchAPIView.as_view(), name='api-search'),
    path('recommendations/', RecommendationsAPIView.as_view(), name='api-recommendations'),
]
