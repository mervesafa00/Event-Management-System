from django.db import connection
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import CustomUser
from django.contrib.auth import authenticate, login
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from .serializers import CustomUserSerializer, UserLoginSerializer
from rest_framework.authtoken.views import ObtainAuthToken
from events.models import EventRegistration
from events.serializers import EventRegistrationSerializer

class UserListView(generics.ListAPIView):
    """Tüm kullanıcıların listesini döndüren görünüm"""
    queryset = CustomUser.objects.all()
    serializer_class = UserLoginSerializer
    permission_classes = [permissions.IsAdminUser]

class UserDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """Kullanıcı detayları, güncelleme ve silme işlemleri için görünüm"""
    queryset = CustomUser.objects.all()
    serializer_class = UserLoginSerializer
    
    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.IsAuthenticated()]
        return [permissions.IsAdminUser()]

class UserRegistrationView(generics.CreateAPIView):
    """Kullanıcı kaydı için görünüm"""
    serializer_class = CustomUserSerializer  # Changed from UserCreateSerializer
    permission_classes = [permissions.AllowAny]

class CurrentUserView(APIView):
    """Mevcut oturum açmış kullanıcının bilgilerini döndüren görünüm"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        serializer = CustomUserSerializer(request.user)
        return Response(serializer.data)

class UserEventHistoryView(APIView):
    """Bir kullanıcının etkinlik geçmişini döndüren görünüm (SQLite raw SQL örneği)"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user_id = request.user.id
        
        with connection.cursor() as cursor:
            # Kullanıcının katıldığı etkinlikleri getiren SQL sorgusu
            cursor.execute("""
                SELECT e.id, e.title, e.description, e.start_date, e.end_date, e.location,
                       r.registration_date, r.status
                FROM events_event e
                JOIN events_eventregistration r ON e.id = r.event_id
                WHERE r.user_id = %s
                ORDER BY e.start_date DESC
            """, [user_id])
            
            # Sütun adlarını alıyoruz
            columns = [col[0] for col in cursor.description]
            
            # Sonuçları sözlük listesi olarak dönüştürüyoruz
            event_history = [
                dict(zip(columns, row))
                for row in cursor.fetchall()
            ]
        
        return Response(event_history)

class RegisterView(APIView):
    """API endpoint for user registration"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = CustomUserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            # Create token for the new user
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'user': serializer.data,
                'token': token.key
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    """API endpoint for user login"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        try:
            username = request.data.get('username')
            password = request.data.get('password')
            
            if not username or not password:
                return Response({'error': 'Please provide both username and password'}, 
                                status=status.HTTP_400_BAD_REQUEST)
            
            # Authenticate user
            user = authenticate(username=username, password=password)
            
            if not user:
                return Response({'error': 'Invalid credentials'}, 
                                status=status.HTTP_401_UNAUTHORIZED)
            
            # Get or create token
            token, created = Token.objects.get_or_create(user=user)
            
            return Response({
                'token': token.key,
                'user_id': user.id,
                'username': user.username,
                'email': user.email
            }, status=status.HTTP_200_OK)
        except Exception as e:
            # Log the error for debugging purposes
            import logging
            logger = logging.getLogger('django')
            logger.error(f"Login error: {str(e)}")
            # Return a proper JSON error response
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserDetailView(APIView):
    """API endpoint for retrieving and updating user details"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        serializer = CustomUserSerializer(request.user)
        return Response(serializer.data)
    
    def put(self, request):
        serializer = CustomUserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserRegistrationsView(APIView):
    """API endpoint for retrieving a user's event registrations"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        # Get registrations for the current user
        registrations = EventRegistration.objects.filter(user=request.user)
        serializer = EventRegistrationSerializer(registrations, many=True)
        return Response(serializer.data)

class ChangePasswordView(APIView):
    """
    API endpoint for changing user password
    
    Requires authentication and username verification
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, *args, **kwargs):
        user = request.user
        username = request.data.get('username')
        new_password = request.data.get('new_password')
        
        # Kullanıcı adı kontrolü
        if not username:
            return Response({'error': 'Kullanıcı adı belirtilmedi.'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Kullanıcı adı doğrulama
        if username != user.username:
            return Response({'error': 'Kullanıcı adı hatalı.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Şifre kontrolü
        if not new_password:
            return Response({'error': 'Yeni şifre belirtilmedi.'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Minimum şifre uzunluğu kontrolü
        if len(new_password) < 6:
            return Response({'error': 'Şifre en az 6 karakter olmalıdır.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Şifreyi değiştir
        user.set_password(new_password)
        user.save()
        
        # Kullanıcıyı çıkış yap (tokeni sil), böylece yeni şifre ile giriş yapacak
        Token.objects.filter(user=user).delete()
        
        return Response({'message': 'Şifre başarıyla değiştirildi.'}, status=status.HTTP_200_OK)

class ResetPasswordView(APIView):
    """
    API endpoint for resetting forgotten password
    
    Does not require authentication, but validates username
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        new_password = request.data.get('new_password')
        
        # Kullanıcı adı kontrolü
        if not username:
            return Response({'error': 'Kullanıcı adı belirtilmedi.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Kullanıcıyı bul
        try:
            user = CustomUser.objects.get(username=username)
        except CustomUser.DoesNotExist:
            # Güvenlik için genel bir hata mesajı verelim
            return Response({'error': 'Kullanıcı adı veya şifre geçersiz.'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Şifre kontrolü
        if not new_password:
            return Response({'error': 'Yeni şifre belirtilmedi.'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Minimum şifre uzunluğu kontrolü
        if len(new_password) < 6:
            return Response({'error': 'Şifre en az 6 karakter olmalıdır.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Şifreyi değiştir
        user.set_password(new_password)
        user.save()
        
        # Kullanıcının tüm tokenlerini sil
        Token.objects.filter(user=user).delete()
        
        return Response({'message': 'Şifre başarıyla sıfırlandı. Yeni şifre ile giriş yapabilirsiniz.'}, status=status.HTTP_200_OK)
