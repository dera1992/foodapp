from django.db.models import Count
from django.shortcuts import get_object_or_404
from rest_framework import permissions, viewsets
from rest_framework.response import Response

from seafood.api.schema import DocumentedAPIView

from blog.models import Category, Post
from blog.serializers import CategorySerializer, PostSerializer

from .permissions import IsOwnerOrReadOnly


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


class PostBySlugAPIView(DocumentedAPIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, slug):
        post = get_object_or_404(Post, slug=slug)
        return Response(PostSerializer(post).data)


class CategoryCountAPIView(DocumentedAPIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        counts = Post.objects.values("categories__title").annotate(total=Count("id")).order_by("-total")
        return Response(list(counts))
