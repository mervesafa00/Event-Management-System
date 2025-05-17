from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _

class CustomUser(AbstractUser):
    is_approved = models.BooleanField(default=False)  # Kullanıcı onayı
    """Özel kullanıcı modeli"""
    
    email = models.EmailField(_('email address'), unique=True)
    phone_number = models.CharField(_('phone number'), max_length=15, blank=True)
    birth_date = models.DateField(_('birth date'), null=True, blank=True)
    profile_image = models.ImageField(upload_to='profile_images/', null=True, blank=True)
    
    # Custom fields for user preferences
    notification_email = models.BooleanField(default=True)
    notification_sms = models.BooleanField(default=False)
    
    # İlgi alanları için çoklu seçim alanı ekleyelim
    INTEREST_CHOICES = [
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
    
    interests = models.CharField(
        max_length=255,
        blank=True,
        help_text="Virgülle ayrılmış ilgi alanları"
    )
    
    # Kullanıcının favori etkinlik kategorileri (sıralı)
    favorite_categories = models.CharField(
        max_length=255,
        blank=True,
        help_text="Kullanıcının favori kategorileri (sıralı, virgülle ayrılmış)"
    )
    
    # Set the username field to email (optional)
    # USERNAME_FIELD = 'email'
    # REQUIRED_FIELDS = ['username']
    
    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')
    
    def __str__(self):
        return self.username
    
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}" if self.first_name and self.last_name else self.username
