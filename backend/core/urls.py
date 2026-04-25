from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import LeadViewSet, ProductViewSet

router = DefaultRouter()
router.register(r'products', ProductViewSet)
router.register(r'leads', LeadViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
