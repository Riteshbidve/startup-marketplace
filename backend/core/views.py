from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.generics import CreateAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.db.models import Q

from .models import Lead, Product, User
from .serializers import LeadSerializer, ProductSerializer, RegisterSerializer


class RegisterView(CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by('-created_at')
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        query = (
            self.request.query_params.get('search')
            or self.request.query_params.get('q')
            or ''
        ).strip()
        if not query:
            return queryset

        return queryset.filter(
            Q(problem_statement__icontains=query)
            | Q(name__icontains=query)
            | Q(description__icontains=query)
            | Q(tags__name__icontains=query)
        ).distinct()

    def perform_create(self, serializer):
        if self.request.user.role != 'founder':
            raise PermissionDenied('Only founders can create products.')

        serializer.save(founder=self.request.user)


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
