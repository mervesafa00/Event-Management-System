from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('events', '0002_duyuru'),
    ]

    operations = [
        migrations.AddField(
            model_name='event',
            name='interest_category',
            field=models.CharField(
                blank=True,
                choices=[
                    ('muzik', 'Müzik'),
                    ('spor', 'Spor'),
                    ('sanat', 'Sanat'),
                    ('bilim', 'Bilim ve Teknoloji'),
                    ('egitim', 'Eğitim'),
                    ('yemek', 'Yemek'),
                    ('seyahat', 'Seyahat'),
                    ('sinema', 'Sinema'),
                    ('tiyatro', 'Tiyatro'),
                    ('edebiyat', 'Edebiyat'),
                ],
                default='',
                max_length=50,
                verbose_name='İlgi Alanı Kategorisi'
            ),
        ),
    ]
