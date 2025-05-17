# Etkinlik Yönetim Sistemi

Bu proje, etkinliklerin yönetilmesi için geliştirilmiş bir Django backend API'sidir.

## Özellikler

- Kullanıcı kaydı ve kimlik doğrulama
- Etkinlik oluşturma, düzenleme ve silme
- Etkinliklere kayıt olma
- Etkinlik yorumları ve değerlendirmeleri
- Etkinlik kategorileri
- Etkinlik istatistikleri

## Kurulum

1. Sanal ortam oluşturun ve aktive edin:

```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate  # Windows
```

2. Gerekli paketleri yükleyin:

```bash
pip install -r requirements.txt
```

3. Örnek .env dosyasını kopyalayın ve düzenleyin:

```bash
cp .env.example .env
# .env dosyasını düzenleyin
```

4. Veritabanı geçişlerini uygulayın:

```bash
python manage.py migrate
```

5. Süper kullanıcı oluşturun:

```bash
python manage.py createsuperuser
```

6. Geliştirme sunucusunu başlatın:

```bash
python manage.py runserver
```

## API Endpointleri

- `api/users/`: Kullanıcı işlemleri
- `api/users/register/`: Kullanıcı kaydı
- `api/users/login/`: Kullanıcı girişi
- `api/users/me/`: Mevcut kullanıcı bilgileri
- `api/events/`: Etkinlik işlemleri
- `api/events/categories/`: Etkinlik kategorileri
- `api/events/registrations/`: Etkinlik kayıtları
- `api/events/statistics/`: Etkinlik istatistikleri

## Örnek SQL Sorguları

Proje, Django ORM'nin yanı sıra raw SQL sorguları kullanımını da göstermektedir:

1. Kullanıcı etkinlik geçmişi için SQL sorgusu:
```sql
SELECT e.id, e.title, e.description, e.start_date, e.end_date, e.location,
       r.registration_date, r.status
FROM events_event e
JOIN events_eventregistration r ON e.id = r.event_id
WHERE r.user_id = %s
ORDER BY e.start_date DESC
```

2. Etkinlik istatistikleri için SQL sorgusu:
```sql
SELECT 
    strftime('%Y-%m', start_date) as month,
    COUNT(*) as event_count,
    SUM(capacity) as total_capacity,
    AVG(ticket_price) as avg_price
FROM events_event
GROUP BY strftime('%Y-%m', start_date)
ORDER BY month DESC
```
