from django.http import Http404
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from foodCreate.models import Category, Products, ProductsImages, ReviewRating, SubCategory
from foodCreate.serializers import (
    CategorySerializer,
    ProductsImagesSerializer,
    ProductsSerializer,
    ReviewRatingSerializer,
    SubCategorySerializer,
)

from .permissions import IsOwnerOrReadOnly


class ReadPublicWriteOwnerViewSet(viewsets.ModelViewSet):
    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsOwnerOrReadOnly()]


class CategoryViewSet(ReadPublicWriteOwnerViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


class SubCategoryViewSet(ReadPublicWriteOwnerViewSet):
    queryset = SubCategory.objects.all()
    serializer_class = SubCategorySerializer


class ProductsViewSet(ReadPublicWriteOwnerViewSet):
    queryset = Products.objects.select_related("shop", "category", "subcategory").all()
    serializer_class = ProductsSerializer

    def get_permissions(self):
        if self.action in ["lookup_product", "load_subcategories"]:
            return [permissions.AllowAny()]
        return super().get_permissions()

    @action(detail=False, methods=["get"], url_path="load-subcategories")
    def load_subcategories(self, request):
        category_id = request.query_params.get("category")
        queryset = SubCategory.objects.filter(category_id=category_id).order_by("name")
        return Response(SubCategorySerializer(queryset, many=True).data)

    @action(detail=False, methods=["get"], url_path="lookup-product")
    def lookup_product(self, request):
        barcode = request.query_params.get("barcode")
        template_id = request.query_params.get("template_id")
        product = None
        if barcode:
            product = Products.objects.filter(barcode=barcode).first()
        elif template_id:
            product = Products.objects.filter(id=template_id).first()

        if not product:
            return Response({"found": False})
        return Response(
            {
                "found": True,
                "title": product.title,
                "category": product.category_id,
                "subcategory": product.subcategory_id,
                "price": str(product.price),
                "discount_price": str(product.discount_price) if product.discount_price else "",
                "description": product.description,
                "label": product.label,
                "status": product.status,
                "delivery": product.delivery,
                "available": product.available,
                "barcode": product.barcode,
                "stock": product.stock,
            }
        )

    @action(detail=True, methods=["post"], url_path="duplicate")
    def duplicate(self, request, pk=None):
        product = self.get_object()
        shop = request.user.shops.first()
        if not shop or product.shop != shop:
            raise Http404("You are not authorized to duplicate this product.")

        new_product = Products.objects.get(pk=product.pk)
        new_product.pk = None
        new_product.slug = ""
        new_product.title = f"{product.title} (Copy)"
        new_product.save()

        for image in product.images.all():
            if image.product_image:
                ProductsImages.objects.create(products=new_product, product_image=image.product_image)

        return Response(ProductsSerializer(new_product).data, status=status.HTTP_201_CREATED)


class ProductsImagesViewSet(viewsets.ModelViewSet):
    queryset = ProductsImages.objects.all()
    serializer_class = ProductsImagesSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]


class ReviewRatingViewSet(viewsets.ModelViewSet):
    queryset = ReviewRating.objects.all()
    serializer_class = ReviewRatingSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
