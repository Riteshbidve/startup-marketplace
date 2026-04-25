from django.contrib import admin
from django.urls import include, path
from django.shortcuts import redirect


def home_redirect(request):
    return redirect('/admin/')


urlpatterns = [
    path('', home_redirect),
    path('admin/', admin.site.urls),
    path('api/', include('core.urls')),
]
