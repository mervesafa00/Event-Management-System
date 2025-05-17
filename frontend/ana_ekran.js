document.addEventListener('DOMContentLoaded', function() {
    

    // Sahte Öneri Verileri
    const sahteOneriler = [
        { baslik: 'Konser: Senfoni Orkestrası', link: '#' },
        { baslik: 'Tiyatro: Romeo ve Juliet', link: '#' },
        { baslik: 'Festival: Yaz Müzik Şöleni', link: '#' },
        { baslik: 'Sergi: Modern Sanatlar', link: '#' }
    ];
    
   
    // DOM elemanlarını güvenli şekilde seç - Eğer yoksa hata vermesini engelle
    const etkinlikListesiDiv = document.querySelector('.etkinlik-listesi');
    const onerilerListesiDiv = document.querySelector('.oneriler-listesi');
    const havaDurumuBilgisiDiv = document.getElementById('hava-durumu-bilgisi');
    const populerEtkinliklerListesiDiv = document.querySelector('.populer-etkinlikler-listesi');
    
    // Hava Durumu API Ayarları
    const WEATHER_API_KEY = '8ecc0fe802204f048a0113059250105'; // WeatherAPI.com API Key
    const WEATHER_API_URL = 'https://api.weatherapi.com/v1/current.json';
    const WEATHER_CITY = 'Istanbul'; // Varsayılan şehir - yağışlı bir şehir olarak değiştirilebilir

    // Sahte Hava Durumu (API bağlantısı başarısız olduğunda yedek olarak kullanılır)
    const sahteHavaDurumu = {
        durum: 'Yağmurlu',
        sicaklik: '18°C',
        planlanabilirlik: 'Yağışlı bir gün, şemsiye almanızı öneririz.'
    };

    // Hava durumu bilgilerini getir
    if (havaDurumuBilgisiDiv) {
        getHavaDurumu();
    }

    // Hava durumu API'sinden güncel hava durumu bilgilerini getirir
    function getHavaDurumu() {
        // Yükleniyor göstergesi
        havaDurumuBilgisiDiv.innerHTML = '<p>Hava durumu bilgisi yükleniyor...</p>';
        
        // Gerçek WeatherAPI.com API çağrısı
        const weatherUrl = `${WEATHER_API_URL}?key=${WEATHER_API_KEY}&q=${WEATHER_CITY}&lang=tr&aqi=no`;
        
        fetch(weatherUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Hava durumu bilgisi alınamadı');
                }
                return response.json();
            })
            .then(data => {
                console.log("Hava durumu verisi:", data);
                
                const sicaklik = Math.round(data.current.temp_c);
                const durum = data.current.condition.text;
                const icon = data.current.condition.icon;
                const ruzgar = data.current.wind_kph;
                
                let planlanabilirlik = '';
                if (sicaklik > 25) {
                    planlanabilirlik = 'Sıcak bir gün, açık hava etkinlikleri için su bulundurun!';
                } else if (sicaklik < 10) {
                    planlanabilirlik = 'Soğuk bir gün, kapalı mekan etkinlikleri önerilir.';
                } else if (durum.toLowerCase().includes('yağmur') || durum.toLowerCase().includes('yağış')) {
                    planlanabilirlik = 'Yağışlı bir gün, şemsiye almanızı öneririz.';
                } else {
                    planlanabilirlik = 'Bugün etkinlikler için harika bir gün!';
                }
                
                havaDurumuBilgisiDiv.innerHTML = `
                    <div class="hava-durumu-container">
                        <img src="${icon}" alt="${durum}" class="hava-durumu-icon">
                        <div class="hava-durumu-detay">
                            <p class="hava-durum">${durum.charAt(0).toUpperCase() + durum.slice(1)}</p>
                            <p class="hava-sicaklik">${sicaklik}°C</p>
                            <p class="hava-ruzgar">Rüzgar: ${ruzgar} km/s</p>
                            <p class="hava-oneri">${planlanabilirlik}</p>
                        </div>
                    </div>
                `;
            })
            .catch(error => {
                console.error('Hava durumu API hatası:', error);
                // API hatası durumunda sahte hava durumu verilerini göster
                havaDurumuBilgisiDiv.innerHTML = `
                    <div class="hava-durumu-container">
                        <div class="hava-durumu-detay">
                            <p class="hava-durum">${sahteHavaDurumu.durum}</p>
                            <p class="hava-sicaklik">${sahteHavaDurumu.sicaklik}</p>
                            <p>${sahteHavaDurumu.planlanabilirlik}</p>
                            <p class="hata-mesaji">Not: Gerçek hava durumu verisi alınamadı.</p>
                        </div>
                    </div>
                `;
            });
    }

    // Sadece DOM öğeleri varsa içeriği doldur
    if (onerilerListesiDiv) {
        // API bağlantısı yoksa veya boşsa sahte önerileri göster
        if (!ApiService.isAuthenticated()) {
            // Önerileri Ekrana Ekleme
            sahteOneriler.forEach(oneri => {
                const oneriDiv = document.createElement('div');
                oneriDiv.classList.add('onerilen-etkinlik');
                oneriDiv.innerHTML = `
                    <h4>${oneri.baslik}</h4>
                    <a href="${oneri.link}">Göz At</a>
                `;
                onerilerListesiDiv.appendChild(oneriDiv);
            });
        } else {
            // İlgi alanlarına göre önerileri getir
            ilgiAlaninaGoreOneriler();
        }
    }

    if (populerEtkinliklerListesiDiv) {
        // API'den gerçek etkinlikleri getir ve popülerliğe göre sırala
        if (!ApiService.isAuthenticated()) {
            // Kullanıcı giriş yapmamışsa sahte verileri göster
            displayPopulerEtkinlikler(sahtePopulerEtkinlikler, populerEtkinliklerListesiDiv);
        } else {
            // Yükleniyor mesajı göster
            populerEtkinliklerListesiDiv.innerHTML = '<div class="loading">Popüler etkinlikler yükleniyor...</div>';
            
            // Gerçek etkinlikleri getir
            ApiService.getEvents()
                .then(data => {
                    // API yanıtından etkinlikleri al
                    let etkinlikler = Array.isArray(data) ? data : (data.results || []);
                    
                    if (etkinlikler.length === 0) {
                        populerEtkinliklerListesiDiv.innerHTML = '<p>Henüz etkinlik bulunmuyor.</p>';
                        return;
                    }
                    
                    // Satış sayısına göre sırala (toplam kapasite - kalan kapasite)
                    etkinlikler = etkinlikler.map(etkinlik => {
                        const capacity = etkinlik.capacity || 0;
                        const availableSeats = etkinlik.available_seats !== undefined ? 
                            etkinlik.available_seats : (capacity - (etkinlik.registered_count || 0));
                        const soldTickets = capacity - availableSeats;
                        
                        return {
                            ...etkinlik,
                            soldTickets: soldTickets,
                            isSoldOut: availableSeats <= 0
                        };
                    });
                    
                    etkinlikler.sort((a, b) => {
                        if (a.isSoldOut && !b.isSoldOut) return 1;
                        if (!a.isSoldOut && b.isSoldOut) return -1;
                        return b.soldTickets - a.soldTickets;
                    });
                    
                    const populerEtkinlikler = etkinlikler.slice(0, 5);
                    displayPopulerEtkinlikler(populerEtkinlikler, populerEtkinliklerListesiDiv, true);
                })
                .catch(error => {
                    console.error("Popüler etkinlikleri getirirken hata:", error);
                    populerEtkinliklerListesiDiv.innerHTML = '<p>Popüler etkinlikler yüklenemedi.</p>';
                });
        }
    }

    // API bağlantısı için güvenli kontrol
    if (etkinlikListesiDiv) {
        // Etkinlikleri backend'den çek
        setTimeout(() => {
            // Sayfa tamamen yüklendiğinde API'yi çağır
            fetchEtkinlikler();
        }, 500);

        // Etkinlikleri getiren fonksiyon
        function fetchEtkinlikler() {
            console.log("API'den etkinlikler getiriliyor...");
            
            // Kullanıcı giriş yapmış mı kontrol et
            if (!ApiService.isAuthenticated()) {
                // Kullanıcı giriş yapmamışsa etkinlikleri gösterme
                document.querySelector('.etkinlik-listesi').innerHTML = `
                    <div class="login-required">
                        <p>Etkinlikleri görmek için lütfen giriş yapmalısınız.</p>
                        <div class="auth-buttons">
                            <a href="giris.html" class="buton-detay">Giriş Yap</a>
                            <a href="kayit.html" class="buton-sepete-ekle">Kayıt Ol</a>
                        </div>
                    </div>
                `;
                return;
            }
            
            // Yükleniyor mesajı göster
            etkinlikListesiDiv.innerHTML = '<div class="loading">Etkinlikler yükleniyor...</div>';
            
            // ApiService ile etkinlikleri getir
            ApiService.getEvents()
                .then(data => {
                    console.log("Etkinlikler alındı:", data);
                    
                                // API yanıtı yapısını kontrol et
                                let etkinlikler;
                                
                                // Farklı veri yapıları için kontrol
                                if (Array.isArray(data)) {
                                    console.log("API direkt olarak dizi döndürdü");
                                    etkinlikler = data;
                                } else if (data.results && Array.isArray(data.results)) {
                                    console.log("API bir 'results' dizisi döndürdü (paginated)");
                                    etkinlikler = data.results;
                                } else {
                                    // API bir nesne döndürdüyse anahtarları kontrol edelim
                                    console.log("API bir nesne döndürdü, anahtarları:", Object.keys(data));
                                    
                                    // Eğer bir sonuç dizisi bulunamazsa, tek bir etkinlik nesnesinin kendisi olabilir
                                    etkinlikler = [data];
                                }
                                
                                // Etkinliklerin yapısını kontrol et
                                if (etkinlikler && etkinlikler.length > 0) {
                                    console.log("İlk etkinlik örneği:", etkinlikler[0]);
                                    console.log(`${etkinlikler.length} adet etkinlik bulundu, görüntüleniyor...`);
                                    
                                    // Etkinlikleri satış durumuna göre sırala, satışları dolan etkinlikler sona
                                    etkinlikler = etkinlikler.map(etkinlik => {
                                        // Kalan koltuk sayısı hesapla
                                        const capacity = etkinlik.capacity || 0;
                                        const availableSeats = etkinlik.available_seats !== undefined ? 
                                            etkinlik.available_seats : (capacity - (etkinlik.registered_count || 0));
                                        
                                        // Satışları dolmuş mu?
                                        const isSoldOut = availableSeats <= 0;
                                        
                                        return {
                                            ...etkinlik,
                                            isSoldOut: isSoldOut
                                        };
                                    });
                                    
                                    // Satışları dolanlara düşük öncelik ver (sona al)
                                    etkinlikler.sort((a, b) => {
                                        if (a.isSoldOut && !b.isSoldOut) return 1;
                                        if (!a.isSoldOut && b.isSoldOut) return -1;
                                        return 0; // Diğer sıralama kriterleri korunur
                                    });
                                    
                                    displayEtkinlikler(etkinlikler);
                                } else {
                                    console.log("Hiç etkinlik bulunamadı.");
                                    document.querySelector('.etkinlik-listesi').innerHTML = '<p>Henüz etkinlik bulunmuyor.</p>';
                        }
                    })
                    .catch(error => {
                    console.error("Etkinlikleri getirirken hata:", error);
                document.querySelector('.etkinlik-listesi').innerHTML = `
                    <div class="error">
                            <p>Etkinlikler yüklenemedi!</p>
                            <p>Hata: ${error.message || 'Bilinmeyen bir hata oluştu.'}</p>
                        <p>Lütfen aşağıdaki adımları takip edin:</p>
                        <ol>
                            <li>Tarayıcınızda <a href="http://127.0.0.1:8000/api/events/" target="_blank">http://127.0.0.1:8000/api/events/</a> adresini açın.</li>
                            <li>Bu adres çalışıyorsa, sayfada JSON veri görmelisiniz.</li>
                            <li>Sayfadan gördüğünüz JSON veri yapısını kontrol edin ve konsola yazdırarak yapısal farklılıkları belirleyin.</li>
                            <li>Backend sunucunuzun çalışır durumda olduğunu kontrol edin.</li>
                        </ol>
                    </div>
                `;
                });
        }
    }
    
    // Etkinlikleri görüntüleyen fonksiyon - veri adaptasyonu ile güncellendi
    function displayEtkinlikler(etkinlikler) {
        const etkinlikListesi = document.querySelector('.etkinlik-listesi');
        etkinlikListesi.innerHTML = ''; // Önce mevcut içeriği temizle
        
        // Etkinlik yoksa bilgi mesajı göster
        if (!etkinlikler || etkinlikler.length === 0) {
            etkinlikListesi.innerHTML = '<p>Henüz etkinlik bulunmuyor.</p>';
            return;
        }
        
        // Hava durumu kontrolü - sayfadaki hava durumu bilgisine göre
        let havaDurumu = 'normal';
        const havaDurumuElement = document.querySelector('.hava-durum');
        if (havaDurumuElement) {
            const durumText = havaDurumuElement.textContent.toLowerCase();
            if (durumText.includes('yağmur') || durumText.includes('yağış') || durumText.includes('yağışlı')) {
                havaDurumu = 'yağmurlu';
            }
        }
        console.log("Hava durumu:", havaDurumu); // Kontrol için yazdır
        
        // Her bir etkinlik için HTML oluştur
        etkinlikler.forEach(etkinlik => {
            try {
                // DEBUG: Tüm etkinlik objesini yazdır
                console.log("Etkinlik verisi:", JSON.stringify(etkinlik, null, 2));
                
                // API'den gelen anahtarları kontrol et ve uyarla
                // title veya baslik, start_date veya tarih gibi alanlar var mı kontrol et
                const title = etkinlik.title || etkinlik.baslik || "İsimsiz Etkinlik";
                const description = etkinlik.description || etkinlik.aciklama || "";
                const location = etkinlik.location || etkinlik.yer || etkinlik.konum || "";
                
                // Kategori bilgisini veritabanından al 
                // Kategori bilgisi farklı API yapılarında farklı alanlarda olabilir
                let category = '';
                
                // DEBUG: Kategori özelliklerini detaylı yazdır
                console.log("Kategori özellikleri:");
                console.log("- interest_category:", etkinlik.interest_category);
                console.log("- category:", etkinlik.category);
                console.log("- category_name:", etkinlik.category_name);
                
                if (etkinlik.category) {
                    if (typeof etkinlik.category === 'object') {
                        console.log("Category obje özellikleri:", Object.keys(etkinlik.category));
                        console.log("Category detay:", JSON.stringify(etkinlik.category, null, 2));
                    }
                }
                
                // ÖNCELİKLİ: category_name alanı - Django DRF API'den gelen değer
                if (etkinlik.category_name && typeof etkinlik.category_name === 'string') {
                    category = etkinlik.category_name;
                    console.log(`Kategori category_name alanından alındı: ${category}`);
                }
                // 1. Direkt interest_category alanı
                else if (typeof etkinlik.interest_category === 'string' && etkinlik.interest_category.trim() !== '') {
                    category = etkinlik.interest_category;
                    console.log(`Kategori interest_category alanından alındı: ${category}`);
                }
                // 2. category alanı (string veya object olabilir)
                else if (etkinlik.category) {
                    if (typeof etkinlik.category === 'string') {
                        category = etkinlik.category;
                        console.log(`Kategori category (string) alanından alındı: ${category}`);
                    } else if (typeof etkinlik.category === 'object') {
                        // Django admin'den geliyorsa category objesi name alanını içerir
                        if (etkinlik.category.name) {
                            category = etkinlik.category.name;
                            console.log(`Kategori category.name alanından alındı: ${category}`);
                        } 
                        // Bazen category sadece bir ID olabilir veya DRF HyperlinkedIdentityField olabilir
                        else if (typeof etkinlik.category === 'number' || 
                                 (etkinlik.category.url && typeof etkinlik.category.url === 'string')) {
                            // Eğer başka bir kategori bilgisi varsa onu kullan
                            if (etkinlik.category_name) {
                                category = etkinlik.category_name;
                                console.log(`Kategori category_name alanından alındı: ${category}`);
                            }
                            // Yoksa API'den kategori detayı çekmek gerekebilir (şimdilik ID kullan)
                            else if (typeof etkinlik.category === 'number') {
                                category = `Kategori ${etkinlik.category}`;
                                console.log(`Kategori ID'den alındı: ${category}`);
                            }
                            else if (etkinlik.category.url) {
                                // URL'den kategori ID'si çıkar
                                const urlParts = etkinlik.category.url.split('/');
                                const categoryId = urlParts[urlParts.length - 2]; // URL sonunda / varsa son önceki eleman
                                category = `Kategori ${categoryId}`;
                                console.log(`Kategori URL'den alındı: ${category}`);
                            }
                        }
                        // Bazen category objesi id ve display_name içerebilir (DRF formatı)
                        else if (etkinlik.category.display_name) {
                            category = etkinlik.category.display_name;
                            console.log(`Kategori category.display_name alanından alındı: ${category}`);
                        }
                        // Sadece ID varsa
                        else if (etkinlik.category.id) {
                            category = `kategori-${etkinlik.category.id}`;
                            console.log(`Kategori category.id alanından alındı: ${category}`);
                        }
                    }
                }
                // 3. categories dizisi (array of objects)
                else if (Array.isArray(etkinlik.categories) && etkinlik.categories.length > 0) {
                    const firstCategory = etkinlik.categories[0];
                    category = typeof firstCategory === 'string' ? firstCategory : 
                              (firstCategory.name || firstCategory.title || '');
                    console.log(`Kategori categories[0] alanından alındı: ${category}`);
                }
                
                // Kategori bulunamadıysa varsayılan değer
                if (!category || category.trim() === '') {
                    // Son çare olarak başlık içinde geçen kategori ipuçlarını kullan
                    // Başlık içinde kategori içeren kelimeler varsa ipucu olarak kullan
                    const titleLower = title.toLowerCase();
                    if (titleLower.includes('konser')) {
                        category = 'konser';
                        console.log(`Kategori başlıktan çıkarıldı: ${category}`);
                    } else if (titleLower.includes('seminer')) {
                        category = 'seminer';
                        console.log(`Kategori başlıktan çıkarıldı: ${category}`);
                    } else if (titleLower.includes('müzik') || titleLower.includes('muzik')) {
                        category = 'muzik';
                        console.log(`Kategori başlıktan çıkarıldı: ${category}`);
                    } else if (titleLower.includes('tiyatro')) {
                        category = 'tiyatro';
                        console.log(`Kategori başlıktan çıkarıldı: ${category}`);
                    } else if (titleLower.includes('film') || titleLower.includes('sinema')) {
                        category = 'sinema';
                        console.log(`Kategori başlıktan çıkarıldı: ${category}`);
                    } else {
                        category = 'Kategorisiz';
                        console.log(`Kategori bulunamadı, varsayılan değer kullanıldı: ${category}`);
                    }
                }

                // Django admin'de kategori ID'si form kategorisine çevirme
                // form_category değerini category alanından çıkarma
                if (category.startsWith('Kategori ') || category.startsWith('kategori-')) {
                    let categoryId = '';
                    if (category.startsWith('Kategori ')) {
                        categoryId = category.replace('Kategori ', '');
                    } else {
                        categoryId = category.replace('kategori-', '');
                    }

                    // Kategori ID'sine göre form kategori değerine eşleme
                    // NOT: Bu eşleme backend'deki kategori tablosu ile uyumlu olmalıdır
                    // `python manage.py shell` içinde `from events.models import EventCategory; print(list(EventCategory.objects.all().values()))` 
                    // komutu ile mevcut kategorilerin listesini alabilirsiniz
                    const categoryIdMap = {
                        '1': 'konser',
                        '2': 'tiyatro',
                        '3': 'sinema',
                        '4': 'seminer',
                        '5': 'sergi',
                        '6': 'doga',
                        '7': 'spor',
                        '8': 'teknoloji'
                        // Diğer kategori ID'leri buraya eklenebilir
                    };

                    if (categoryIdMap[categoryId]) {
                        category = categoryIdMap[categoryId];
                        console.log(`Kategori ID'den form değerine çevrildi: ${category}`);
                    }
                }
                
                // Kategori adını küçük harfe çevir - daha sonraki tüm işlemlerde bunu kullanacağız
                const categoryLower = category.toLowerCase();
                
                // Kategori adını daha güzel göstermek için isimlendirme eşleştirmesi
                const kategoriMap = {
                    'muzik': 'Müzik',
                    'konser': 'Konser',
                    'spor': 'Spor',
                    'sanat': 'Sanat',
                    'bilim': 'Bilim ve Teknoloji',
                    'teknoloji': 'Teknoloji',
                    'egitim': 'Eğitim',
                    'eglence': 'Eğlence',
                    'yemek': 'Yemek',
                    'seyahat': 'Seyahat',
                    'sinema': 'Sinema',
                    'tiyatro': 'Tiyatro',
                    'edebiyat': 'Edebiyat',
                    'doga': 'Doğa Aktivitesi',
                    'seminer': 'Seminer'
                };
                
                // Kategori adını güzelleştir - eşleştirme yap
                const displayCategory = kategoriMap[categoryLower] || category;
                
                console.log(`Etkinlik: ${title}, Kategori: "${category}", Görüntülenecek: "${displayCategory}"`);
                
                // Kategori kontrolü - büyük/küçük harf duyarsız kontrol
                // Konser kategorisi kontrolü - Django admin'den gelen değerleri de dikkate al
                const isKonserCategory = 
                    categoryLower.includes('konser') || 
                    categoryLower === 'konser' ||
                    categoryLower === 'muzik' || 
                    categoryLower === 'müzik';
                
                // Doğa kategorisi kontrolü - Django admin'den gelen değerleri de dikkate al
                const isDogaCategory = 
                    categoryLower.includes('doğa') || 
                    categoryLower.includes('doga') || 
                    categoryLower === 'doga';
                
                // Etkinliğin iptal edilip edilmediğine karar ver
                const iptalEdildi = havaDurumu === 'yağmurlu' && (isKonserCategory || isDogaCategory);
                
                console.log(`${title} iptal edildi mi? ${iptalEdildi ? 'EVET' : 'HAYIR'} (kategori: ${category}, lower: ${categoryLower})`); // İptal durumunu kontrol et
                
                // Kapasite kontrolü - etkinlik satışı dolu mu?
                const availableSeats = etkinlik.available_seats !== undefined ? etkinlik.available_seats : (etkinlik.capacity - (etkinlik.registered_count || 0));
                const satislarDoldu = etkinlik.isSoldOut !== undefined ? etkinlik.isSoldOut : availableSeats <= 0;
                
                console.log(`${title} - Mevcut Kontenjan: ${availableSeats}, Satışlar doldu mu? ${satislarDoldu ? 'EVET' : 'HAYIR'}`);
                
                // Tarih formatını düzgünce işle
                let formattedDate = "";
                if (etkinlik.start_date) {
                    formattedDate = new Date(etkinlik.start_date).toLocaleDateString('tr-TR');
                } else if (etkinlik.tarih) {
                    formattedDate = new Date(etkinlik.tarih).toLocaleDateString('tr-TR');
                }
                
                // Resim URL'sini oluştur
                let imageUrl = '';
                if (etkinlik.cover_image) {
                    // Eğer tam URL ise kullan, değilse API_URL ile birleştir
                    imageUrl = etkinlik.cover_image.startsWith('http') ? 
                        etkinlik.cover_image : 
                        `${ApiService.API_URL}${etkinlik.cover_image}`;
                } else if (etkinlik.resim) {
                    imageUrl = etkinlik.resim;
                } else {
                    // Varsayılan görüntü - veri URL'si olarak ekle (eksik resim hatasını önler)
                    imageUrl = getPlaceholderImage(`${title.substring(0, 10)}...`, '546e7a', 'ffffff');
                }
                
                const etkinlikKarti = document.createElement('div');
                etkinlikKarti.classList.add('etkinlik-karti', 'renkli-kart'); // Etkinlik kartlarına renkli sınıflar ekleme
                
                if (iptalEdildi) {
                    etkinlikKarti.classList.add('iptal-edildi');
                } else if (satislarDoldu) {
                    etkinlikKarti.classList.add('satislar-doldu');
                }
                
                // Butonlara renkli sınıflar ekleme
                etkinlikKarti.innerHTML = `
                    <div class="etkinlik-resim">
                        <img src="${imageUrl}" alt="${title}" 
                             onerror="this.src=getPlaceholderImage('${title.substring(0, 10).replace(/'/g, '')}', '546e7a', 'ffffff')">
                        ${iptalEdildi ? '<div class="iptal-badge">Etkinlik iptal edildi</div>' : ''}
                        ${!iptalEdildi && satislarDoldu ? '<div class="satislar-doldu-badge">Hepsi satıldı</div>' : ''}
                    </div>
                    <div class="etkinlik-detay">
                        <h3>${title}</h3>
                        <p class="etkinlik-tarih">${formattedDate}</p>
                        <p class="etkinlik-yer">${location}</p>
                        <p class="etkinlik-kategori">Kategori: ${displayCategory}</p>
                        ${!iptalEdildi && !satislarDoldu ? `<p class="etkinlik-kapasite">Kalan bilet: ${availableSeats}</p>` : ''}
                        <p class="etkinlik-aciklama">${description.substring(0, 100)}${description.length > 100 ? '...' : ''}</p>
                        <div class="etkinlik-butonlar">
                            <a href="etkinlik-detay.html?id=${etkinlik.id}" class="buton-detay renkli-buton">Detaylar</a>
                            ${!iptalEdildi && !satislarDoldu ? `<button class="buton-sepete-ekle renkli-buton" data-id="${etkinlik.id}">Sepete Ekle</button>` : ''}
                        </div>
                    </div>
                `;
                
                etkinlikListesi.appendChild(etkinlikKarti);
            } catch (err) {
                console.error("Etkinlik işlenirken hata:", err, etkinlik);
            }
        });
        
        // Sepete ekle butonlarına tıklama olayı ekle
        document.querySelectorAll('.buton-sepete-ekle').forEach(button => {
            button.addEventListener('click', function() {
                const etkinlikId = this.getAttribute('data-id');
                sepeteEkle(etkinlikId);
            });
        });
    }
    
    // Sepete etkinlik ekleyen fonksiyon
    function sepeteEkle(etkinlikId) {
        // Sepet verisi için yerel depolama kullan
        let sepet = JSON.parse(localStorage.getItem('sepet')) || [];
        
        // Etkinlik zaten sepette mi kontrol et
        if (!sepet.includes(etkinlikId)) {
            sepet.push(etkinlikId);
            localStorage.setItem('sepet', JSON.stringify(sepet));
            alert('Etkinlik sepete eklendi!');
            
            // Sepet sayısını güncelle
            updateSepetSayisi();
        } else {
            alert('Bu etkinlik zaten sepetinizde!');
        }
    }
    
    // Sepet sayısını güncelle
    function updateSepetSayisi() {
        const sepet = JSON.parse(localStorage.getItem('sepet')) || [];
        const sepetElement = document.querySelector('.sepet-alani a');
        if (sepetElement) {
            sepetElement.textContent = `Sepetim (${sepet.length})`;
        }
    }
    
    // Sayfa yüklendiğinde sepet sayısını güncelle
    updateSepetSayisi();
});

// İlgi alanlarına göre öneriler
function ilgiAlaninaGoreOneriler() {
    if (!ApiService.isAuthenticated()) return; // Kullanıcı giriş yapmamışsa önerileri gösterme
    
    const onerilerListesiDiv = document.querySelector('.oneriler-listesi');
    if (!onerilerListesiDiv) return;
    
    onerilerListesiDiv.innerHTML = '<div class="yukleniyor">Öneriler yükleniyor...</div>';
    
    // Kullanıcı bilgilerini getir ve doğrudan database'deki interests alanını kullan
    ApiService.getCurrentUser()
    .then(userData => {
            console.log("Kullanıcı bilgileri:", userData);
            
            // Database'den gelen ilgi alanları 
        const userInterests = userData.interests ? userData.interests.split(',') : [];
            console.log("Database'den alınan kullanıcı ilgi alanları:", userInterests);
        
        if (userInterests.length === 0) {
            onerilerListesiDiv.innerHTML = '<p>İlgi alanı seçimi yapmadınız. Profil sayfanızdan ilgi alanlarınızı güncelleyebilirsiniz.</p>';
            return;
        }
        
            // API'den doğrudan kullanıcının ilgi alanlarına göre filtreleme yap
            const params = { interest_category: userInterests.join(',') };
            console.log("API filtreleme parametreleri:", params);
            
            // API'den filtrelenmiş etkinlikleri getir
            ApiService.getEvents(params)
        .then(data => {
                    console.log("API'den alınan filtrelenmiş etkinlikler:", data);
                    
            // API yanıtından etkinlikleri al
                    let etkinlikler = Array.isArray(data) ? data : (data.results || []);
                    
                    if (etkinlikler.length === 0) {
                        onerilerListesiDiv.innerHTML = '<p>İlgi alanlarınıza göre mevcut etkinlik bulunamadı.</p>';
                        return null;
                    }
                    
                    // Satışı tükenmiş etkinlikleri filtrele
                    etkinlikler = etkinlikler.filter(etkinlik => {
                        const capacity = etkinlik.capacity || 0;
                        const availableSeats = etkinlik.available_seats !== undefined ? 
                            etkinlik.available_seats : (capacity - (etkinlik.registered_count || 0));
                        
                        // Satışları dolmuş etkinlikleri filtreleme
                        const soldOut = availableSeats <= 0;
                        if (soldOut) {
                            console.log(`Etkinlik ${etkinlik.id || 'ID yok'}: "${etkinlik.title}" satışları dolmuş, önerilerde gösterilmeyecek.`);
                        }
                        return !soldOut;
                    });
                    
                    if (etkinlikler.length === 0) {
                        // Etkinlik bulunamadıysa, varsayılan tüm etkinlikleri getir
                        console.log("İlgi alanına göre satılabilir etkinlik bulunamadı, tüm etkinlikler arasından öneriler getiriliyor...");
                        
                        return ApiService.getEvents()
                            .then(allData => {
                                const allEvents = Array.isArray(allData) ? allData : (allData.results || []);
                                console.log("Tüm etkinlikler:", allEvents);
                                
                                // Tüm etkinliklerden satışı dolu olanları filtrele
                                const availableEvents = allEvents.filter(event => {
                                    const capacity = event.capacity || 0;
                                    const availableSeats = event.available_seats !== undefined ? 
                                        event.available_seats : (capacity - (event.registered_count || 0));
                                    return availableSeats > 0;
                                });
                                
                                if (availableEvents.length === 0) {
                                    onerilerListesiDiv.innerHTML = '<p>Henüz satılabilir etkinlik bulunmuyor.</p>';
                                    return null;
                                }
                                
                                // Manuel eşleştirme yap
                                const matchedEvents = findMatchingEvents(availableEvents, userInterests);
            
                                if (matchedEvents.length > 0) {
                                    return matchedEvents;
                                }
                                
                                // Hala eşleşme bulunamadıysa rastgele etkinlik göster
                                const randomEvents = availableEvents
                                    .sort(() => 0.5 - Math.random())
                                    .slice(0, 5);
                                    
                                onerilerListesiDiv.innerHTML = `
                                    <p>İlgi alanlarınıza uygun satılabilir etkinlik bulunamadı. Sizin için başka etkinlikler öneriyoruz:</p>
                                    <div class="random-events"></div>
                                `;
                                
                                const randomEventsContainer = onerilerListesiDiv.querySelector('.random-events');
                                displayOneriler(randomEvents, randomEventsContainer);
                                return null;
                            });
                    }
                    
                    return etkinlikler;
                })
                .then(etkinlikler => {
                    if (!etkinlikler) return; // Eğer önceki then'de işlem tamamlandıysa
            
            // En fazla 5 öneri göster
                    const gosterilecekOneriler = etkinlikler.slice(0, 5);
            
            onerilerListesiDiv.innerHTML = '';
                    
                    // Başlık ekle - ilgi alanlarına göre öneriler
                    const baslik = document.createElement('h3');
                    baslik.className = 'oneriler-baslik';
                    baslik.textContent = 'İlgi Alanlarınıza Özel Etkinlikler';
                    onerilerListesiDiv.appendChild(baslik);
                    
                    displayOneriler(gosterilecekOneriler, onerilerListesiDiv);
        })
        .catch(error => {
                    console.error('Etkinlikler alınamadı:', error);
            onerilerListesiDiv.innerHTML = '<p>Öneriler yüklenirken bir hata oluştu.</p>';
        });
    })
    .catch(error => {
        console.error('Kullanıcı bilgileri alınamadı:', error);
        onerilerListesiDiv.innerHTML = '<p>Öneriler yüklenirken bir hata oluştu.</p>';
    });
}

// Etkinliklerin kullanıcı ilgi alanları ile eşleşmesini inceleyen yardımcı fonksiyon
function findMatchingEvents(events, userInterests) {
    // Eşleşen etkinlikleri bulmak için direkt filtre kullanalım
    return events.filter(event => {
        // Kategori bilgisini al veya tahmin et
        let eventCategory = null;
        
        // 1. interest_category doğrudan varsa kullan
        if (event.interest_category && typeof event.interest_category === 'string') {
            eventCategory = event.interest_category.toLowerCase().trim();
            console.log(`Etkinlik ${event.id}: interest_category = "${eventCategory}"`);
        } 
        // 2. Kategori bilgisi yoksa başlıktan tahmin et
        else {
            const title = event.title.toLowerCase();
            
            // Başlıktan kategori çıkarımı
            if (title.includes('konser')) {
                eventCategory = 'konser';
            } else if (title.includes('seminer') || title.includes('yapay zeka')) {
                eventCategory = 'seminer';
            } else if (title.includes('tiyatro')) {
                eventCategory = 'tiyatro';
            } else if (title.includes('sinema') || title.includes('film')) {
                eventCategory = 'sinema';
            }
            
            if (eventCategory) {
                console.log(`Etkinlik ${event.id}: Başlıktan tahmin edilen kategori = "${eventCategory}"`);
                
                // Çıkarılan kategoriyi event nesnesine ekle (sonraki işlemler için)
                event.interest_category = eventCategory;
            } else {
                console.log(`Etkinlik ${event.id}: Kategori belirlenemedi, etkinlik atlanıyor...`);
                return false;
            }
        }
        
        // İlgi alanı eşleşmesi kontrolü
        const isInterestMatch = userInterests.some(interest => {
            const interestLower = interest.toLowerCase().trim();
            
            // Tam eşleşme
            if (eventCategory === interestLower) {
                console.log(`Etkinlik ${event.id} kategorisi '${eventCategory}' ile ilgi alanı '${interestLower}' arasında tam eşleşme`);
                return true;
            }
            
            // Kısmi eşleşme (konser vs Konser gibi)
            if (eventCategory.includes(interestLower) || interestLower.includes(eventCategory)) {
                console.log(`Etkinlik ${event.id} kategorisi '${eventCategory}' ile ilgi alanı '${interestLower}' arasında kısmi eşleşme`);
                return true;
            }
            
            // Özel durumlar için kontrol
            if ((eventCategory === 'konser' && interestLower === 'müzik') || 
                (eventCategory === 'seminer' && (interestLower === 'eğitim' || interestLower === 'teknoloji'))) {
                console.log(`Etkinlik ${event.id} kategorisi '${eventCategory}' ile ilgi alanı '${interestLower}' arasında semantik eşleşme`);
                return true;
            }
            
            return false;
        });
        
        // Başlık eşleşmesi kontrolü - Başlıkta ilgi alanlarından birinin adı geçiyor mu?
        const titleLower = event.title.toLowerCase();
        const isTitleMatch = userInterests.some(interest => {
            const interestLower = interest.toLowerCase().trim();
            return titleLower.includes(interestLower);
        });
        
        if (isTitleMatch) {
            console.log(`Etkinlik ${event.id} başlığında '${event.title}' ilgi alanlarından biri geçiyor`);
        }
        
        return isInterestMatch || isTitleMatch;
    });
}

// Önerileri görüntüleyen yardımcı fonksiyon
function displayOneriler(etkinlikler, container) {
    // Kategori isim eşleştirmesi (örn. veritabanındaki 'konser' ve 'Konser' gibi değerlerin düzgün gösterilmesi için)
    const categoryMap = {
        'konser': 'Konser',
        'seminer': 'Seminer',
        'muzik': 'Müzik',
        'tiyatro': 'Tiyatro',
        'sinema': 'Sinema',
        'spor': 'Spor',
        'sanat': 'Sanat',
        'edebiyat': 'Edebiyat',
        'egitim': 'Eğitim',
        'bilim': 'Bilim ve Teknoloji',
        'teknoloji': 'Teknoloji',
        'eglence': 'Eğlence',
        'yemek': 'Yemek',
        'seyahat': 'Seyahat',
        'doga': 'Doğa Aktivitesi'
    };

    console.log("Önerilecek etkinlikler:", etkinlikler);

    etkinlikler.forEach(etkinlik => {
        // Tüm etkinlik özelliklerini yazdır
        console.log("Etkinlik veri yapısı:", Object.keys(etkinlik));
        console.log("Etkinlik kategorisi (ham veri):", etkinlik.interest_category);
        
        const oneriDiv = document.createElement('div');
        oneriDiv.className = 'onerilen-etkinlik';
        
        const title = etkinlik.title || etkinlik.baslik || "İsimsiz Etkinlik";
        let formattedDate = "";
        if (etkinlik.start_date) {
            formattedDate = new Date(etkinlik.start_date).toLocaleDateString('tr-TR');
        } else if (etkinlik.tarih) {
            formattedDate = new Date(etkinlik.tarih).toLocaleDateString('tr-TR');
        }
        
        // Doğrudan kategori ismini al
        // Farklı API yanıt yapıları için farklı property'leri kontrol et
        let rawCategory = null;
        
        if (typeof etkinlik.interest_category === 'string' && etkinlik.interest_category.length > 0) {
            rawCategory = etkinlik.interest_category;
        } else if (etkinlik.category && typeof etkinlik.category === 'object') {
            // Bazı API'ler kategoriyi nesne olarak döndürebilir
            rawCategory = etkinlik.category.name || etkinlik.category;
        } else if (etkinlik.category_name) {
            // Veya category_name şeklinde
            rawCategory = etkinlik.category_name;
        }
        
        console.log(`Etkinlik ${etkinlik.id || 'ID yok'} için işlenen kategori:`, rawCategory);
        
        // Kategori bilgisini göster - kategori map kullanarak formatla
        let kategori = 'Kategori bilgisi yok';
        
        if (rawCategory) {
            // Önce direkt eşleşme deneyelim
            const normalizedCategory = rawCategory.toLowerCase().trim();
            
            if (categoryMap[normalizedCategory]) {
                kategori = categoryMap[normalizedCategory];
            } else {
                // Eşleşme bulunamadıysa direkt olarak kullan
                kategori = rawCategory;
            }
        } else {
            // Kategori bulunamamışsa başlıktan tahmin et
            const titleLower = title.toLowerCase();
            
            if (titleLower.includes('konser')) {
                kategori = 'Konser';
            } else if (titleLower.includes('seminer')) {
                kategori = 'Seminer';
            } else if (titleLower.includes('yapay zeka') || titleLower.includes('teknoloji')) {
                kategori = 'Teknoloji';
            }
        }
        
        console.log(`Etkinlik ${etkinlik.id || 'ID yok'} (${title}) için gösterilecek kategori: ${kategori}`);
        
        oneriDiv.innerHTML = `
            <h4>${title}</h4>
            <p>${formattedDate}</p>
            <p class="etkinlik-kategori">Kategori: ${kategori}</p>
            <a href="etkinlik-detay.html?id=${etkinlik.id}">Göz At</a>
        `;
        
        container.appendChild(oneriDiv);
    });
}

// Yerel placeholder resmi kullan (çevrimiçi servisler yerine)
function getPlaceholderImage(text, bgColor, textColor) {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect width='150' height='150' fill='%23${bgColor}' /%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='18' fill='%23${textColor}' text-anchor='middle' dominant-baseline='middle'%3E${text}%3C/text%3E%3C/svg%3E`;
}

// Varsayılan resmin eksik olması durumunda dinamik placeholder oluştur
function handleImageError(img) {
    // Doğrudan element içindeki alt özelliğini kullan
    const text = img.getAttribute('alt') || 'Resim';
    img.src = getPlaceholderImage(text.substring(0, 10), '546e7a', 'ffffff');
    return true;
}

// Popüler etkinlikleri görüntüleyen fonksiyon
function displayPopulerEtkinlikler(populerEtkinlikler, container, isRealData = false) {
    // Önce container'ı temizle
    container.innerHTML = '';
    
    // Her bir popüler etkinlik için kart oluştur
    populerEtkinlikler.forEach(populerEtkinlik => {
        const populerKarti = document.createElement('div');
        populerKarti.classList.add('populer-etkinlik-karti');
        
        // API'den gelen veriler için farklı alanları kontrol et
        const title = populerEtkinlik.title || populerEtkinlik.baslik || "İsimsiz Etkinlik";
        const description = populerEtkinlik.description || populerEtkinlik.aciklama || "";
        
        // Satış durumu ve bilgisi
        let soldOutBadge = '';
        let soldCountInfo = '';
        
        if (isRealData) {
            // Satış durumu badge'i (HTML)
            if (populerEtkinlik.isSoldOut) {
                soldOutBadge = '<div class="populer-satildi-badge">Hepsi satıldı</div>';
                populerKarti.classList.add('satislar-doldu');
            }
            
            // Satış sayısı bilgisi
            const capacity = populerEtkinlik.capacity || 0;
            const soldTickets = populerEtkinlik.soldTickets || 0;
            const soldPercentage = capacity > 0 ? Math.round((soldTickets / capacity) * 100) : 0;
            
            soldCountInfo = `<p class="satis-bilgisi">${soldTickets} bilet satıldı (${soldPercentage}%)</p>`;
        }
        
        // Resim URL'sini oluştur
        let imageUrl = '';
        if (isRealData && populerEtkinlik.cover_image) {
            // Eğer tam URL ise kullan, değilse API_URL ile birleştir
            imageUrl = populerEtkinlik.cover_image.startsWith('http') ? 
                populerEtkinlik.cover_image : 
                `${ApiService.API_URL}${populerEtkinlik.cover_image}`;
        } else if (populerEtkinlik.resim) {
            imageUrl = populerEtkinlik.resim;
        } else {
            // Varsayılan görüntü - veri URL'si olarak ekle (eksik resim hatasını önler)
            imageUrl = getPlaceholderImage(`${title.substring(0, 10)}...`, '2196f3', 'ffffff');
        }
        
        // Detay linki
        const detailLink = isRealData ? 
            `etkinlik-detay.html?id=${populerEtkinlik.id}` : 
            (populerEtkinlik.link || '#');
        
        populerKarti.innerHTML = `
            <div class="populer-resim-container">
                <img src="${imageUrl}" alt="${title}" 
                     onerror="this.src=getPlaceholderImage('${title.substring(0, 10).replace(/'/g, '')}', '2196f3', 'ffffff')">
                ${soldOutBadge}
            </div>
            <h4>${title}</h4>
            ${soldCountInfo}
            <p>${description.substring(0, 60)}${description.length > 60 ? '...' : ''}</p>
            <a href="${detailLink}">Detaylar</a>
        `;
        
        container.appendChild(populerKarti);
    });
}