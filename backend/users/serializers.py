from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()

class CustomUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'password2', 'first_name', 'last_name', 'interests', 'favorite_categories', 'date_joined')
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': False},
            'last_name': {'required': False},
            'interests': {'required': False},
            'favorite_categories': {'required': False},
            'date_joined': {'read_only': True}
        }
    
    def validate(self, attrs):
        # Only validate passwords if both are provided (during registration or password change)
        if 'password' in attrs and 'password2' in attrs:
            if attrs['password'] != attrs['password2']:
                raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs
    
    def create(self, validated_data):
        # Remove password2 before creating user
        if 'password2' in validated_data:
            validated_data.pop('password2')
            
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            interests=validated_data.get('interests', ''),
            favorite_categories=validated_data.get('favorite_categories', '')
        )
        return user
    
    def update(self, instance, validated_data):
        # Handle password update separately
        if 'password' in validated_data:
            password = validated_data.pop('password')
            instance.set_password(password)
        
        # Remove password2 if it exists
        if 'password2' in validated_data:
            validated_data.pop('password2')
        
        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance

class UserLoginSerializer(serializers.ModelSerializer):
    password = serializers.CharField(required=True, write_only=True)
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'first_name', 'last_name', 'interests', 'date_joined')
        extra_kwargs = {
            'id': {'read_only': True},
            'email': {'read_only': True},
            'first_name': {'read_only': True},
            'last_name': {'read_only': True},
            'interests': {'read_only': True},
            'date_joined': {'read_only': True}
        }
