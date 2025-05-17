from django.urls import path
from .views import RegisterView, LoginView, UserDetailView, UserListView, UserDetailAPIView, CurrentUserView, UserEventHistoryView, UserRegistrationsView, ChangePasswordView, ResetPasswordView

app_name = 'users'

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('me/', UserDetailView.as_view(), name='user-detail'),
    path('', UserListView.as_view(), name='user-list'),
    path('<int:pk>/', UserDetailAPIView.as_view(), name='user-detail-api'),
    path('current/', CurrentUserView.as_view(), name='current-user'),
    path('event-history/', UserEventHistoryView.as_view(), name='user-event-history'),
    path('registrations/', UserRegistrationsView.as_view(), name='user-registrations'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset-password'),
]
