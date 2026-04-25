from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import LeadViewSet, ProductViewSet, RegisterView

router = DefaultRouter()
router.register(r'products', ProductViewSet)
router.register(r'leads', LeadViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('register/', RegisterView.as_view(), name='register'),
]
