from rest_framework import serializers
from .models import Event, EventCategory, EventRegistration, EventComment, Duyuru

class EventCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = EventCategory
        fields = ['id', 'name', 'description']

class EventCommentSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    
    class Meta:
        model = EventComment
        fields = ['id', 'event', 'user', 'user_name', 'content', 'rating', 'created_at', 'is_approved']
        read_only_fields = ['id', 'user', 'user_name', 'created_at', 'is_approved']
    
    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.username
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class EventSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')
    organizer_name = serializers.ReadOnlyField(source='organizer.get_full_name')
    registered_count = serializers.ReadOnlyField()
    available_seats = serializers.ReadOnlyField()
    
    class Meta:
        model = Event
        fields = ['id', 'title', 'description', 'start_date', 'end_date', 'location', 
                  'address', 'capacity', 'category', 'category_name', 'cover_image', 
                  'ticket_price', 'is_free', 'organizer', 'organizer_name', 'created_at', 
                  'updated_at', 'is_published', 'registered_count', 'available_seats']
        read_only_fields = ['id', 'created_at', 'updated_at', 'organizer', 'organizer_name']
    
    def create(self, validated_data):
        validated_data['organizer'] = self.context['request'].user
        return super().create(validated_data)

class EventDetailSerializer(EventSerializer):
    comments = EventCommentSerializer(many=True, read_only=True)
    
    class Meta(EventSerializer.Meta):
        fields = EventSerializer.Meta.fields + ['comments']

class EventRegistrationSerializer(serializers.ModelSerializer):
    event_title = serializers.ReadOnlyField(source='event.title')
    user_name = serializers.ReadOnlyField(source='user.get_full_name')
    
    class Meta:
        model = EventRegistration
        fields = ['id', 'user', 'user_name', 'event', 'event_title', 
                  'registration_date', 'status', 'ticket_number', 'notes']
        read_only_fields = ['id', 'user', 'user_name', 'registration_date', 'ticket_number']
    
    def create(self, validated_data):
        # Kullanıcıyı mevcut istekten alın
        validated_data['user'] = self.context['request'].user
        
        # Bilet numarası oluşturma işlemini modelde yapabilirsiniz
        # Burada basit bir örnek:
        import uuid
        validated_data['ticket_number'] = f"TKT-{uuid.uuid4().hex[:8].upper()}"
        
        return super().create(validated_data)

class DuyuruSerializer(serializers.ModelSerializer):
    """Duyurular için serializer"""
    class Meta:
        model = Duyuru
        fields = ['id', 'baslik', 'icerik', 'tarih', 'aktif']
