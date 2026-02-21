from django.db.models import Count
from django.shortcuts import get_object_or_404
from rest_framework import permissions, viewsets
from rest_framework import serializers
from rest_framework.views import APIView
from rest_framework.response import Response

from blog.models import Category, Post
from blog.serializers import CategorySerializer, PostSerializer

from .permissions import IsOwnerOrReadOnly
from drf_spectacular.utils import extend_schema


class APIPayloadSerializer(serializers.Serializer):
    pass



class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    search_fields = ["title"]
    ordering = ["title"]

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsOwnerOrReadOnly()]


class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.select_related("profile")
    serializer_class = PostSerializer
    search_fields = ["title", "content", "slug"]
    ordering = ["-timestamp"]

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsOwnerOrReadOnly()]


class PostBySlugAPIView(APIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = APIPayloadSerializer

    @extend_schema(responses=APIPayloadSerializer)
    def get(self, request, slug):
        post = get_object_or_404(Post, slug=slug)
        return Response(PostSerializer(post).data)


class CategoryCountAPIView(APIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = APIPayloadSerializer

    @extend_schema(responses=APIPayloadSerializer)
    def get(self, request):
        counts = Post.objects.values("categories__title").annotate(total=Count("id")).order_by("-total")
        return Response(list(counts))
