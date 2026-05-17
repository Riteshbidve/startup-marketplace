from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.generics import CreateAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.db.models import Q
from django.db.models import Count
from rest_framework import mixins
from rest_framework.viewsets import GenericViewSet

from .models import Lead, Product, User
from .models import Tag
from .serializers import LeadSerializer, ProductSerializer, RegisterSerializer, TagSerializer


class RegisterView(CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by('-created_at')
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset().annotate(leads_count=Count('leads'))

        tag_ids = (self.request.query_params.get('tags') or '').strip()
        if tag_ids:
            try:
                ids = [int(part) for part in tag_ids.split(',') if part.strip()]
            except ValueError:
                ids = []

            if ids:
                queryset = queryset.filter(tags__id__in=ids).distinct()

        query = (
            self.request.query_params.get('search')
            or self.request.query_params.get('q')
            or ''
        ).strip()
        if not query:
            return self._apply_sort(queryset)

        filtered = queryset.filter(
            Q(problem_statement__icontains=query)
            | Q(name__icontains=query)
            | Q(description__icontains=query)
            | Q(tags__name__icontains=query)
        ).distinct()

        return self._apply_sort(filtered)

    def _apply_sort(self, queryset):
        sort = (self.request.query_params.get('sort') or '').strip().lower()
        if sort == 'most_requested':
            return queryset.order_by('-leads_count', '-created_at')
        return queryset.order_by('-created_at')

    def perform_create(self, serializer):
        if self.request.user.role != 'founder':
            raise PermissionDenied('Only founders can create products.')

        serializer.save(founder=self.request.user)


class TagViewSet(mixins.ListModelMixin, GenericViewSet):
    queryset = Tag.objects.all().order_by('name')
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticated]


class LeadViewSet(viewsets.ModelViewSet):
    serializer_class = LeadSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role == 'founder':
            return Lead.objects.filter(product__founder=user).order_by('-created_at')

        return Lead.objects.filter(buyer=user).order_by('-created_at')

    def perform_create(self, serializer):
        if self.request.user.role != 'buyer':
            raise PermissionDenied('Only buyers can submit leads.')

        serializer.save(buyer=self.request.user)

    def perform_update(self, serializer):
        if self.request.user.role != 'founder':
            raise PermissionDenied('Only founders can update lead status.')

        serializer.save()

    def partial_update(self, request, *args, **kwargs):
        if set(request.data.keys()) - {'status'}:
            raise PermissionDenied('Founders can update lead status only.')

        return super().partial_update(request, *args, **kwargs)
