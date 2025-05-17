from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

@admin.action(description='Seçili kullanıcıları onayla')
def approve_users(modeladmin, request, queryset):
    queryset.update(is_approved=True, is_active=True)  # Onay ve aktif etme

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_approved', 'is_active', 'is_staff')
    list_filter = ('is_approved', 'is_active', 'is_staff')
    actions = [approve_users]
    fieldsets = UserAdmin.fieldsets + (
        ('Ek Bilgiler', {'fields': ('phone_number', 'birth_date', 'profile_image', 
                                    'notification_email', 'notification_sms')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Ek Bilgiler', {'fields': ('email', 'phone_number', 'birth_date', 'profile_image',
                                    'notification_email', 'notification_sms')}),
    )
