from django.db import models
from django.conf import settings


class EventCategory(models.Model):
    """Etkinlik kategorileri"""
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name = "Etkinlik Kategorisi"
        verbose_name_plural = "Etkinlik Kategorileri"

class Event(models.Model):
    """Etkinlik modeli"""
    title = models.CharField(max_length=255)
    description = models.TextField()
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    location = models.CharField(max_length=255)
    address = models.TextField()
    capacity = models.PositiveIntegerField()
    category = models.ForeignKey(EventCategory, on_delete=models.SET_NULL, null=True, related_name='events')
    cover_image = models.ImageField(upload_to='event_covers/', null=True, blank=True)
    ticket_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_free = models.BooleanField(default=True)
    organizer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='organized_events')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_published = models.BooleanField(default=False)
    
    CATEGORY_CHOICES = [
        ('muzik', 'Müzik'),
        ('konser', 'Konser'),
        ('spor', 'Spor'),
        ('sanat', 'Sanat'),
        ('bilim', 'Bilim ve Teknoloji'),
        ('teknoloji', 'Teknoloji'),
        ('egitim', 'Eğitim'),
        ('eglence', 'Eğlence'),
        ('yemek', 'Yemek'),
        ('seyahat', 'Seyahat'),
        ('sinema', 'Sinema'),
        ('tiyatro', 'Tiyatro'),
        ('edebiyat', 'Edebiyat'),
        ('doga', 'Doğa Aktivitesi'),
        ('seminer', 'Seminer'),
    ]
    
    interest_category = models.CharField(
        max_length=50, 
        choices=CATEGORY_CHOICES,
        blank=True,
        verbose_name="İlgi Alanı Kategorisi"
    )
    
    def __str__(self):
        return self.title
    
    @property
    def registered_count(self):
        return self.registrations.count()
    
    @property
    def available_seats(self):
        return max(0, self.capacity - self.registered_count)
    
    class Meta:
        verbose_name = "Etkinlik"
        verbose_name_plural = "Etkinlikler"
        ordering = ['-start_date']

class EventRegistration(models.Model):
    """Etkinlik kayıtları"""
    STATUS_CHOICES = (
        ('registered', 'Kayıtlı'),
        ('attended', 'Katıldı'),
        ('cancelled', 'İptal Edildi'),
        ('waiting', 'Bekleme Listesinde')
    )
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='event_registrations')
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='registrations')
    registration_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='registered')
    ticket_number = models.CharField(max_length=50, blank=True, null=True, unique=True)
    notes = models.TextField(blank=True)
    
    class Meta:
        unique_together = ['user', 'event']
        verbose_name = "Etkinlik Kaydı"
        verbose_name_plural = "Etkinlik Kayıtları"
    
    def __str__(self):
        return f"{self.user.username} - {self.event.title}"

class EventComment(models.Model):
    """Etkinlik yorumları"""
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.TextField()
    rating = models.PositiveSmallIntegerField(default=5, help_text="1-5 arası puanlama")
    created_at = models.DateTimeField(auto_now_add=True)
    is_approved = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = "Etkinlik Yorumu"
        verbose_name_plural = "Etkinlik Yorumları"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.event.title} - {self.rating}/5"

class Duyuru(models.Model):
    """Site duyuruları için model"""
    baslik = models.CharField(max_length=200, verbose_name="Başlık")
    icerik = models.TextField(verbose_name="İçerik")
    tarih = models.DateTimeField(auto_now_add=True, verbose_name="Yayın Tarihi")
    aktif = models.BooleanField(default=True, verbose_name="Aktif")
    
    class Meta:
        verbose_name = "Duyuru"
        verbose_name_plural = "Duyurular"
        ordering = ['-tarih']
    
    def __str__(self):
        return self.baslik
