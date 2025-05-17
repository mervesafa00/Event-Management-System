from django.contrib import admin
from .models import Event, EventCategory, EventRegistration, EventComment, Duyuru


@admin.register(EventCategory)
class EventCategoryAdmin(admin.ModelAdmin):
    list_display = ['id', 'name']
    search_fields = ['name']

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'start_date', 'end_date', 'location', 'category', 'capacity', 'is_published']
    list_filter = ['is_published', 'is_free', 'category', 'start_date']
    search_fields = ['title', 'description', 'location']
    date_hierarchy = 'start_date'

@admin.register(EventRegistration)
class EventRegistrationAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'event', 'registration_date', 'status']
    list_filter = ['status', 'registration_date']
    search_fields = ['user__username', 'user__email', 'event__title', 'ticket_number']
    date_hierarchy = 'registration_date'
    raw_id_fields = ['user', 'event']

@admin.register(EventComment)
class EventCommentAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'event', 'rating', 'created_at', 'is_approved']
    list_filter = ['is_approved', 'rating', 'created_at']
    search_fields = ['user__username', 'user__email', 'event__title', 'content']
    date_hierarchy = 'created_at'
    raw_id_fields = ['user', 'event']
    actions = ['approve_comments', 'disapprove_comments']
    
    def approve_comments(self, request, queryset):
        queryset.update(is_approved=True)
    approve_comments.short_description = "Seçilen yorumları onayla"
    
    def disapprove_comments(self, request, queryset):
        queryset.update(is_approved=False)
    disapprove_comments.short_description = "Seçilen yorumların onayını kaldır"

@admin.register(Duyuru)
class DuyuruAdmin(admin.ModelAdmin):
    list_display = ('baslik', 'tarih', 'aktif')
    list_filter = ('aktif', 'tarih')
    search_fields = ('baslik', 'icerik')
    date_hierarchy = 'tarih'
    fieldsets = (
        ('Duyuru Bilgileri', {
            'fields': ('baslik', 'icerik', 'aktif')
        }),
    )
