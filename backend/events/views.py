from django.db import connection
from django.db.models import Count, Avg, Q
from rest_framework import viewsets, permissions, generics, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Event, EventCategory, EventRegistration, EventComment, Duyuru
from .serializers import (
    EventSerializer, EventDetailSerializer, EventCategorySerializer, 
    EventRegistrationSerializer, EventCommentSerializer, DuyuruSerializer
)

# Custom permissions
class IsOrganizerOrReadOnly(permissions.BasePermission):
    """
    Organizatör ise tam izin, değilse sadece okuma izni verir
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.organizer == request.user

class EventViewSet(viewsets.ModelViewSet):
    """Etkinlik CRUD işlemleri"""
    queryset = Event.objects.all()
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'location']
    ordering_fields = ['start_date', 'created_at', 'ticket_price']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return EventDetailSerializer
        return EventSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated, IsOrganizerOrReadOnly]
        else:
            permission_classes = [permissions.IsAuthenticatedOrReadOnly]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        queryset = self.queryset
        
        # Kategori filtreleme
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category__id=category)
        
        # İlgi alanı kategorisi filtreleme
        interest_category = self.request.query_params.get('interest_category')
        if interest_category:
            # Virgülle ayrılmış ilgi alanlarını listeye çevir
            interest_categories = interest_category.split(',')
            # Q nesneleri ile birleştirerek OR sorgusu oluştur
            q_objects = Q()
            for cat in interest_categories:
                q_objects |= Q(interest_category=cat.strip())
            
            queryset = queryset.filter(q_objects)
        
        # Tarih filtreleme
        date_from = self.request.query_params.get('date_from')
        if date_from:
            queryset = queryset.filter(start_date__gte=date_from)
        
        date_to = self.request.query_params.get('date_to')
        if date_to:
            queryset = queryset.filter(start_date__lte=date_to)
        
        # Ücretli/ücretsiz filtreleme
        is_free = self.request.query_params.get('is_free')
        if is_free is not None:
            is_free_bool = is_free.lower() in ['true', '1', 't']
            queryset = queryset.filter(is_free=is_free_bool)
        
        # Yayınlanmış etkinlikler filtreleme (adminler hariç)
        # Anonim kullanıcılar için kontrol eklendi
        if not self.request.user.is_staff:
            if self.request.user.is_authenticated:
                # Giriş yapmış kullanıcılar kendi etkinliklerini ve yayınlanmış etkinlikleri görebilir
                queryset = queryset.filter(
                    Q(is_published=True) | Q(organizer=self.request.user)
                )
            else:
                # Anonim kullanıcılar sadece yayınlanmış etkinlikleri görebilir
                queryset = queryset.filter(is_published=True)
        
        return queryset
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def register(self, request, pk=None):
        event = self.get_object()
        user = request.user
        
        # Etkinliğe zaten kayıtlı mı kontrol et
        if EventRegistration.objects.filter(event=event, user=user).exists():
            return Response(
                {'detail': 'Bu etkinliğe zaten kayıtlısınız.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Etkinlikte yer var mı kontrol et
        if event.available_seats <= 0:
            return Response(
                {'detail': 'Bu etkinlik dolu.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Kaydı oluştur
        registration = EventRegistration.objects.create(
            user=user,
            event=event,
            status='registered',
            ticket_number=f"TKT-{user.id}-{event.id}-{EventRegistration.objects.count() + 1}"
        )
        
        serializer = EventRegistrationSerializer(registration)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def add_comment(self, request, pk=None):
        event = self.get_object()
        
        # Kullanıcı etkinliğe kayıtlı mı kontrol et
        if not EventRegistration.objects.filter(event=event, user=request.user).exists():
            return Response(
                {'detail': 'Sadece etkinliğe kayıtlı kullanıcılar yorum yapabilir.'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Yorum ve puanı al
        content = request.data.get('content')
        rating = request.data.get('rating')
        
        if not content or not rating:
            return Response(
                {'detail': 'Yorum içeriği ve puanlama gereklidir.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Yorumu oluştur
        comment = EventComment.objects.create(
            event=event,
            user=request.user,
            content=content,
            rating=rating,
            is_approved=True  # Otomatik onaylı, isteğe bağlı olarak False yapılabilir
        )
        
        serializer = EventCommentSerializer(comment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class EventCategoryViewSet(viewsets.ModelViewSet):
    """Etkinlik kategorileri için CRUD işlemleri"""
    queryset = EventCategory.objects.all()
    serializer_class = EventCategorySerializer
    permission_classes = [permissions.IsAdminUser]
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [permissions.IsAdminUser]
        return [permission() for permission in permission_classes]

class EventRegistrationViewSet(viewsets.ModelViewSet):
    """Etkinlik kayıtları için CRUD işlemleri"""
    serializer_class = EventRegistrationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # Admin tüm kayıtları görebilir
        if user.is_staff:
            return EventRegistration.objects.all()
        
        # Normal kullanıcılar sadece kendi kayıtlarını ve organizatör oldukları etkinliklerin kayıtlarını görebilir
        return EventRegistration.objects.filter(
            Q(user=user) | Q(event__organizer=user)
        )

class EventStatisticsView(APIView):
    """Etkinlik istatistiklerini içeren görünüm (SQL örneği)"""
    permission_classes = [permissions.IsAdminUser]
    
    def get(self, request):
        with connection.cursor() as cursor:
            # Aylık etkinlik istatistikleri
            cursor.execute("""
                SELECT 
                    strftime('%Y-%m', start_date) as month,
                    COUNT(*) as event_count,
                    SUM(capacity) as total_capacity,
                    AVG(ticket_price) as avg_price
                FROM events_event
                GROUP BY strftime('%Y-%m', start_date)
                ORDER BY month DESC
                LIMIT 12
            """)
            
            columns = [col[0] for col in cursor.description]
            monthly_stats = [dict(zip(columns, row)) for row in cursor.fetchall()]
            
            # Kategori bazında etkinlik sayıları
            cursor.execute("""
                SELECT 
                    ec.name as category,
                    COUNT(e.id) as event_count,
                    COUNT(DISTINCT e.organizer_id) as organizer_count
                FROM events_event e
                LEFT JOIN events_eventcategory ec ON e.category_id = ec.id
                GROUP BY e.category_id
                ORDER BY event_count DESC
            """)
            
            columns = [col[0] for col in cursor.description]
            category_stats = [dict(zip(columns, row)) for row in cursor.fetchall()]
            
            # En popüler 5 etkinlik
            cursor.execute("""
                SELECT 
                    e.id,
                    e.title,
                    e.start_date,
                    COUNT(er.id) as registration_count,
                    e.capacity,
                    (COUNT(er.id) * 100.0 / e.capacity) as fill_rate
                FROM events_event e
                LEFT JOIN events_eventregistration er ON e.id = er.event_id
                WHERE e.start_date > datetime('now')
                GROUP BY e.id
                ORDER BY registration_count DESC
                LIMIT 5
            """)
            
            columns = [col[0] for col in cursor.description]
            popular_events = [dict(zip(columns, row)) for row in cursor.fetchall()]
        
        return Response({
            'monthly_statistics': monthly_stats,
            'category_statistics': category_stats,
            'popular_events': popular_events
        })

class DuyuruViewSet(viewsets.ReadOnlyModelViewSet):
    """Duyurular için salt-okunur görünüm"""
    queryset = Duyuru.objects.filter(aktif=True)
    serializer_class = DuyuruSerializer
    permission_classes = [permissions.AllowAny]
