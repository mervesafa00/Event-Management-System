from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import RedirectView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.reverse import reverse

# Swagger için import
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework import permissions

# Swagger şema görünümü yapılandırması
schema_view = get_schema_view(
   openapi.Info(
      title="Etkinlik Yönetim Sistemi API",
      default_version='v1',
      description="Etkinlik yönetimi için RESTful API",
      terms_of_service="https://www.example.com/terms/",
      contact=openapi.Contact(email="contact@example.com"),
      license=openapi.License(name="BSD License"),
   ),
   public=True,
   permission_classes=(permissions.AllowAny,),
)

@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request, format=None):
    """
    Etkinlik Yönetim Sistemi API kök noktası.
    Kullanılabilir API endpoint'lerini listeler.
    """
    return Response({
        'events': reverse('events:event-list', request=request, format=format),
        'users': reverse('users:user-list', request=request, format=format),
        'admin': reverse('admin:index', request=request, format=format),
        'swagger': '/swagger/',  # Doğrudan URL olarak tanımlandı
        'redoc': '/redoc/',      # Doğrudan URL olarak tanımlandı
    })

urlpatterns = [
    # Ana URL yapılandırması
    path('', api_root, name='api-root'),
    path('admin/', admin.site.urls),
    path('api/events/', include('events.urls')),
    path('api/users/', include('users.urls')),
    
    # Swagger URL yapılandırması
    path('swagger<format>/', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]

# Statik ve medya dosyalarının doğru yollarla sunulması
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
