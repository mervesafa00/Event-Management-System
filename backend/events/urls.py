from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EventViewSet, EventCategoryViewSet, EventRegistrationViewSet, EventStatisticsView, DuyuruViewSet

router = DefaultRouter()
router.register(r'events', EventViewSet, basename='event')
router.register(r'categories', EventCategoryViewSet)
router.register(r'registrations', EventRegistrationViewSet, basename='registrations')
router.register(r'duyurular', DuyuruViewSet, basename='duyuru')

app_name = 'events'

urlpatterns = [
    path('', include(router.urls)),
    path('statistics/', EventStatisticsView.as_view(), name='event-statistics'),
]
