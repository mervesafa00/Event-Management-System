document.addEventListener('DOMContentLoaded', function() {
    // Kullanıcı giriş yapmamışsa giriş sayfasına yönlendir
    if (!ApiService.isAuthenticated()) {
        window.location.href = 'giris.html';
        return;
    }
    
    // İlgi alanları seçimi izleme
    const profilIlgiAlanlariCheckboxes = document.querySelectorAll('input[name="profilIlgiAlanlari"]');
    const profilIlgiAlanlariSayisi = document.getElementById('profilIlgiAlanlariSayisi');
    const kategoriSiralama = document.getElementById('kategoriSiralama');
    
    profilIlgiAlanlariCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const seciliSayi = document.querySelectorAll('input[name="profilIlgiAlanlari"]:checked').length;
            profilIlgiAlanlariSayisi.textContent = `${seciliSayi}/3 seçildi`;
            
            if (seciliSayi >= 3) {
                profilIlgiAlanlariSayisi.className = 'ilgi-alanlari-bilgi yeterli';
                // İlgi alanı seçimleri yeterli olduğunda favori kategori sıralama bölümünü güncelle
                updateFavoriteCategoriesUI();
            } else {
                profilIlgiAlanlariSayisi.className = 'ilgi-alanlari-bilgi yetersiz';
                // İlgi alanı seçimleri yetersiz olduğunda sıralama alanını temizle
                kategoriSiralama.innerHTML = '<div class="siralama-bilgi">Kategori seçmek için ilgi alanlarından en az 3 adet seçin</div>';
            }
        });
    });

    // Profil bilgilerini yükle
    function profilBilgileriniYukle() {
        const profilAvatar = document.getElementById('profilAvatar');
        const profilIsim = document.getElementById('profilIsim');
        const profilEmail = document.getElementById('profilEmail');
        
        // Kullanıcı bilgilerini API'den çek
        ApiService.getCurrentUser()
            .then(data => {
                // Avatar için kullanıcının baş harfini göster
                const username = data.username;
                if (username) {
                    profilAvatar.textContent = username.charAt(0).toUpperCase();
                    profilIsim.textContent = username;
                }
                
                profilEmail.textContent = data.email || 'E-posta bilgisi yok';
                document.getElementById('profilUyelikTarihi').textContent = 
                    `Üyelik: ${new Date(data.date_joined).toLocaleDateString('tr-TR')}`;
                
                // Form alanlarını doldur (ayarlar sekmesi için)
                if (document.getElementById('ad')) {
                    document.getElementById('ad').value = data.first_name || '';
                }
                if (document.getElementById('soyad')) {
                    document.getElementById('soyad').value = data.last_name || '';
                }
                if (document.getElementById('email')) {
                    document.getElementById('email').value = data.email || '';
                }
                
                // İlgi alanlarını seç
                if (data.interests) {
                    const userInterests = data.interests.split(',');
                    profilIlgiAlanlariCheckboxes.forEach(checkbox => {
                        if (userInterests.includes(checkbox.value)) {
                            checkbox.checked = true;
                        }
                    });
                    
                    // İlgi alanları sayısını güncelle
                    const seciliSayi = document.querySelectorAll('input[name="profilIlgiAlanlari"]:checked').length;
                    profilIlgiAlanlariSayisi.textContent = `${seciliSayi}/3 seçildi`;
                    
                    if (seciliSayi >= 3) {
                        profilIlgiAlanlariSayisi.className = 'ilgi-alanlari-bilgi yeterli';
                        // İlgi alanı seçimleri yeterli olduğunda favori kategori sıralama bölümünü güncelle
                        updateFavoriteCategoriesUI(data.favorite_categories);
                    } else {
                        profilIlgiAlanlariSayisi.className = 'ilgi-alanlari-bilgi yetersiz';
                    }
                }
            })
            .catch(error => {
                console.error('Profil bilgileri yüklenirken hata:', error);
            });
    }
    
    // Favori kategori sıralama UI'sını güncelle
    function updateFavoriteCategoriesUI(savedCategories = null) {
        // İlgi alanı seçimleri
        const seciliIlgiAlanlari = Array.from(document.querySelectorAll('input[name="profilIlgiAlanlari"]:checked')).map(cb => cb.value);
        
        if (seciliIlgiAlanlari.length < 3) {
            kategoriSiralama.innerHTML = '<div class="siralama-bilgi">Kategori seçmek için ilgi alanlarından en az 3 adet seçin</div>';
            return;
        }
        
        // Kategori isimleri ve kodlarını eşleştir
        const kategoriIsimMap = {
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
        
        // Seçili kategorileri alalım
        let favoriteCategories = [];
        
        // Eğer kaydedilmiş favori kategoriler varsa, onları kullan
        if (savedCategories) {
            // Virgülle ayrılmış kategorileri diziye çevir
            const savedArray = savedCategories.split(',');
            
            // Önce kaydedilmiş kategorileri ekle (seçili olanlardan)
            savedArray.forEach(category => {
                if (seciliIlgiAlanlari.includes(category)) {
                    favoriteCategories.push(category);
                }
            });
            
            // Sonra kaydedilmemiş olan seçili kategorileri ekle
            seciliIlgiAlanlari.forEach(category => {
                if (!favoriteCategories.includes(category)) {
                    favoriteCategories.push(category);
                }
            });
        } else {
            // Kaydedilmiş kategori yoksa, seçili kategorileri kullan
            favoriteCategories = [...seciliIlgiAlanlari];
        }
        
        // Sıralama UI'ını oluştur
        kategoriSiralama.innerHTML = '';
        
        // Bilgi metni ekle
        const infoText = document.createElement('p');
        infoText.className = 'siralama-bilgi';
        infoText.textContent = 'Sıralamak için kategorileri sürükleyip bırakın';
        kategoriSiralama.appendChild(infoText);
        
        // Kategorileri sıralamak için listeyi oluştur
        const kategorilerListesi = document.createElement('ul');
        kategorilerListesi.id = 'favoriteCategories';
        kategorilerListesi.className = 'favorite-categories-list';
        
        favoriteCategories.forEach((category, index) => {
            if (seciliIlgiAlanlari.includes(category)) { // Sadece seçili kategorileri göster
                const li = document.createElement('li');
                li.setAttribute('data-category', category);
                li.className = 'kategori-item';
                li.draggable = true;
                
                // Sıralama göstergesi ekle
                const siraNo = document.createElement('span');
                siraNo.className = 'sira-no';
                siraNo.textContent = index + 1;
                
                // Kategori adını ekle
                const kategoriAdi = document.createElement('span');
                kategoriAdi.className = 'kategori-adi';
                kategoriAdi.textContent = kategoriIsimMap[category] || category;
                
                // Sürükleme tutamacı ekle
                const handle = document.createElement('span');
                handle.className = 'drag-handle';
                handle.innerHTML = '&#8285;';
                
                li.appendChild(siraNo);
                li.appendChild(kategoriAdi);
                li.appendChild(handle);
                kategorilerListesi.appendChild(li);
            }
        });
        
        kategoriSiralama.appendChild(kategorilerListesi);
        
        // Sürükle bırak işlevselliğini ekle
        setupDragAndDrop();
    }
    
    // Sürükle bırak işlevselliği
    function setupDragAndDrop() {
        const lista = document.getElementById('favoriteCategories');
        if (!lista) return;
        
        let draggedItem = null;
        
        const items = lista.querySelectorAll('li');
        items.forEach(item => {
            // Sürükleme başladığında
            item.addEventListener('dragstart', function(e) {
                draggedItem = this;
                setTimeout(() => {
                    this.style.opacity = '0.5';
                }, 0);
            });
            
            // Sürükleme bittiğinde
            item.addEventListener('dragend', function() {
                setTimeout(() => {
                    this.style.opacity = '1';
                    draggedItem = null;
                }, 0);
                
                // Sıra numaralarını güncelle
                updateOrderNumbers();
            });
            
            // Sürüklenen öğe üzerine gelindiğinde
            item.addEventListener('dragover', function(e) {
                e.preventDefault();
            });
            
            // Sürüklenen öğe üzerine girildiğinde
            item.addEventListener('dragenter', function(e) {
                e.preventDefault();
                this.classList.add('over');
            });
            
            // Sürüklenen öğe üzerinden çıkıldığında
            item.addEventListener('dragleave', function() {
                this.classList.remove('over');
            });
            
            // Öğe bırakıldığında
            item.addEventListener('drop', function(e) {
                e.preventDefault();
                if (draggedItem) {
                    const thisIndex = Array.from(lista.children).indexOf(this);
                    const draggedIndex = Array.from(lista.children).indexOf(draggedItem);
                    
                    // Sürüklenene öğe bırakılan öğeden önceyse
                    if (draggedIndex < thisIndex) {
                        this.parentNode.insertBefore(draggedItem, this.nextSibling);
                    } else {
                        this.parentNode.insertBefore(draggedItem, this);
                    }
                    
                    this.classList.remove('over');
                }
            });
        });
    }
    
    // Sıra numaralarını güncelle
    function updateOrderNumbers() {
        const items = document.querySelectorAll('#favoriteCategories li');
        items.forEach((item, index) => {
            const siraNo = item.querySelector('.sira-no');
            if (siraNo) {
                siraNo.textContent = index + 1;
            }
        });
    }
    
    // Favori kategorilerin sıralanmış listesini al
    function getSortedFavoriteCategories() {
        const items = document.querySelectorAll('#favoriteCategories li');
        const categories = [];
        
        items.forEach(item => {
            categories.push(item.getAttribute('data-category'));
        });
        
        return categories;
    }
    
    // Biletleri yükle
    function biletleriYukle() {
        const biletlerListesi = document.getElementById('biletlerListesi');
        
        // Yükleniyor mesajı göster
        biletlerListesi.innerHTML = '<div class="loading">Biletler yükleniyor...</div>';
        
        // İki API'yi birlikte kullanan zenginleştirilmiş bilet verilerini getir
        ApiService.getEnhancedUserRegistrations()
            .then(data => {
                console.log('İki API\'den zenginleştirilmiş bilet verileri:', data);
                
                if (!data || data.length === 0) {
                    biletlerListesi.innerHTML = '<p>Henüz bilet satın almadınız.</p>';
                    return;
                }
                
                // İşlenecek biletleri takip etmek için sayaç
                let islemBekleyenSayisi = data.length;
                
                // İşleme tamamlandığında yüklenme mesajını kaldır
                biletlerListesi.innerHTML = '';
                
                // Her bir bilet için
                data.forEach(bilet => {
                    // Debug: Bilet nesnesini detaylı görüntüle
                    console.log('İşlenen bilet:', JSON.stringify(bilet, null, 2));
                    
                    // Etkinlik ID'si varsa diğer eksik bilgileri getir
                    const etkinlikId = bilet.event_id || bilet.event?.id;
                    
                    const islemiBitir = () => {
                        islemBekleyenSayisi--;
                        if (islemBekleyenSayisi === 0) {
                            console.log('Tüm biletler yüklendi');
                        }
                    };
                    
                    // Etkinlik verilerini birleştir (veritabanından gelen + ek sorgu)
                    const renderBilet = (eventData = null) => {
                        // Veriyi güvenli bir şekilde çıkar - eventData varsa birleştir
                        const tamVeri = eventData ? { ...bilet, event: { ...bilet.event, ...eventData } } : bilet;
                        
                        // Debug: Tarih bilgileri için kontrol
                        console.log('Bilet için tüm veri:', JSON.stringify(tamVeri, null, 2));
                        
                        // Etkinlik adı
                        const etkinlikAdi = tamVeri.event?.title || tamVeri.event_title || tamVeri.event_name || 'Etkinlik adı alınamadı';
                        
                        // Doğrudan start_date'e erişmeye çalış
                        let tarihStr = 'Tarih bilgisi yok';
                        let tarihKaynagi = null;
                        
                        // Sık kullanılan alanlar için doğrudan erişim yolları (öncelik sırasıyla)
                        const tarihKaynaklari = [
                            {alan: tamVeri.event?.start_date, aciklama: 'event.start_date'}, 
                            {alan: eventData?.start_date, aciklama: 'eventData.start_date'},
                            {alan: tamVeri.start_date, aciklama: 'start_date'},
                            {alan: tamVeri.event?.event_date, aciklama: 'event.event_date'},
                            {alan: tamVeri.event?.date, aciklama: 'event.date'},
                            {alan: tamVeri.event_date, aciklama: 'event_date'},
                            {alan: tamVeri.date, aciklama: 'date'},
                            {alan: tamVeri.event?.created_at, aciklama: 'event.created_at'},
                            {alan: tamVeri.created_at, aciklama: 'created_at'},
                            {alan: tamVeri.updated_at, aciklama: 'updated_at'},
                            // Kayıt tarihi en son kontrol edilmeli - etkinlik tarihi değil!
                            {alan: tamVeri.registration_date, aciklama: 'registration_date'}
                        ];
                        
                        // En uygun tarih kaynağını bul
                        for (const kaynak of tarihKaynaklari) {
                            if (kaynak.alan && (typeof kaynak.alan === 'string' || typeof kaynak.alan === 'number' || kaynak.alan instanceof Date)) {
                                try {
                                    const tarih = new Date(kaynak.alan);
                                    if (!isNaN(tarih.getTime())) {
                                        tarihKaynagi = kaynak.alan;
                                        console.log(`Tarih kaynağı bulundu: ${kaynak.aciklama} = ${kaynak.alan}`);
                                        break;
                                    }
                                } catch (e) {
                                    console.warn(`${kaynak.aciklama} için tarih dönüştürme hatası:`, e.message);
                                }
                            }
                        }
                        
                        // -----------------------------------------------------------------------
                        // Tarih Formatı İşleme Bölümü
                        // -----------------------------------------------------------------------
                        if (tarihKaynagi) {
                            try {
                                const tarih = new Date(tarihKaynagi);
                                
                                if (!isNaN(tarih.getTime())) {
                                    // GG-AA-YYYY formatında tarih
                                    const gun = tarih.getDate().toString().padStart(2, '0');
                                    const ay = (tarih.getMonth() + 1).toString().padStart(2, '0');
                                    const yil = tarih.getFullYear();
                                    tarihStr = `${gun}-${ay}-${yil}`;
                                    console.log(`Tarih başarıyla dönüştürüldü: ${tarihStr}`);
                                    
                                    // Tarih kaynağını işaretleyelim
                                    if (tarihKaynagi === tamVeri.registration_date) {
                                        console.warn('DİKKAT: Tarihi registration_date\'den aldık - ideal değil!');
                                        tarihStr += ' (Kayıt Tarihi)'; // Kullanıcı için not ekleyelim
                                    }
                                } else {
                                    console.error('Tarih dönüştürme başarısız (geçersiz):', tarihKaynagi);
                                }
                            } catch (e) {
                                console.error('Tarih işleme hatası:', e, tarihKaynagi);
                            }
                        } else {
                            console.warn('Bilet için geçerli tarih bulunamadı:', tamVeri);
                        }
                        
                        // CSS sınıf belirle
                        let tarihCssClass = '';
                        if (tarihStr.includes('Kayıt Tarihi')) {
                            tarihCssClass = 'kayit-tarihi';
                        } else if (tarihStr === 'Tarih bilgisi yok') {
                            tarihCssClass = 'no-date';
                        }
                        
                        // Bilet numarası formatı
                        const biletNo = tamVeri.ticket_number || 
                                      `TKT-${tamVeri.id || tamVeri.event_id || Math.floor(Math.random() * 1000)}`;
                        
                        // Bilet durumu
                        const durum = tamVeri.status === 'registered' ? 'Onaylandı' : (tamVeri.status || 'Onaylandı');
                        
                        // Ek etkinlik bilgileri
                        const yer = tamVeri.event?.location || '';
                        const kategori = tamVeri.event?.interest_category || 
                                        tamVeri.event?.category || 
                                        tamVeri.category || '';
                        
                        // Bilet kartını oluştur ve göster
                        const biletKarti = document.createElement('div');
                        biletKarti.className = 'bilet-karti';
                        biletKarti.innerHTML = `
                            <h3>${etkinlikAdi}</h3>
                            <p class="tarih-bilgisi ${tarihCssClass}">Tarih: ${tarihStr}</p>
                            ${yer ? `<p>Yer: ${yer}</p>` : ''}
                            ${kategori ? `<p>Kategori: ${kategori}</p>` : ''}
                            <p>Bilet No: ${biletNo}</p>
                            <p>Durum: ${durum}</p>
                        `;
                        biletlerListesi.appendChild(biletKarti);
                        
                        // Bu bilet işlemi tamamlandı
                        islemiBitir();
                    };

                    // API'den gelen veriler zaten zenginleştirilmiş olduğundan direkt olarak render et
                    renderBilet();
                });
            })
            .catch(error => {
                console.error('Biletler yüklenirken hata:', error);
                
                // API hatası durumunda migrasyon uyarısını göster
                if (error.status === 500) {
                    showMigrationWarning();
                }
                
                biletlerListesi.innerHTML = '<p>Biletleriniz yüklenirken bir hata oluştu. <button id="retryBiletler" class="retry-btn">Tekrar Dene</button></p>';
                
                // Tekrar deneme butonu ekle
                const retryBtn = document.getElementById('retryBiletler');
                if (retryBtn) {
                    retryBtn.addEventListener('click', biletleriYukle);
                }
            });
    }
    
    // Duyuruları yükle
    function duyurulariYukle() {
        const duyurularListesi = document.getElementById('duyurularListesi');
        
        ApiService.getAnnouncements()
            .then(data => {
                console.log("Duyurular API yanıtı:", data);
                
                // API yanıtı yapısını kontrol et
                let duyurular;
                if (Array.isArray(data)) {
                    duyurular = data;
                } else if (data.results && Array.isArray(data.results)) {
                    // DRF genellikle sayfalı sonuçlar döndürür (results içinde)
                    duyurular = data.results;
                } else {
                    // Eğer başka bir yapı varsa, direkt veriyi kullan
                    duyurular = [data];
                }
                
                if (!duyurular || duyurular.length === 0) {
                    duyurularListesi.innerHTML = '<p>Henüz duyuru bulunmuyor.</p>';
                    return;
                }
                
                duyurularListesi.innerHTML = '';
                duyurular.forEach(duyuru => {
                    const duyuruDiv = document.createElement('div');
                    duyuruDiv.className = 'duyuru';
                    duyuruDiv.innerHTML = `
                        <div class="duyuru-tarih">${new Date(duyuru.tarih).toLocaleDateString('tr-TR')}</div>
                        <h3>${duyuru.baslik}</h3>
                        <div>${duyuru.icerik}</div>
                    `;
                    duyurularListesi.appendChild(duyuruDiv);
                });
            })
            .catch(error => {
                console.error('Duyurular yüklenirken hata:', error);
                
                // API hatası durumunda migrasyon uyarısını göster
                if (error.status === 500 || error.message?.includes('aktif')) {
                    showMigrationWarning();
                }
                
                duyurularListesi.innerHTML = '<p>Duyurular yüklenirken hata oluştu.</p>';
            });
    }
    
    // Migrasyon hatası uyarısı göster
    function showMigrationWarning() {
        console.warn("Veritabanı migrasyon hatası tespit edildi");
        const warningDiv = document.createElement('div');
        warningDiv.className = 'migration-warning';
        warningDiv.innerHTML = `
            <strong>Veritabanı Hatası:</strong> 
            API'den gelen hatanın veritabanı migrasyonu ile ilgili olduğu tespit edildi.
            Bu sorunu çözmek için terminal/komut isteminde şu komutları çalıştırın:
            <pre>cd backend</pre>
            <pre>python manage.py makemigrations</pre>
            <pre>python manage.py migrate</pre>
            <button onclick="this.parentElement.style.display='none'" class="kapat-btn">Kapat</button>
        `;
        document.body.insertBefore(warningDiv, document.body.firstChild);
    }
    
    // Sekme değiştirme fonksiyonu
    function sekmeAktifEt(sekmeId) {
        document.querySelectorAll('.sekme').forEach(sekme => sekme.classList.remove('aktif'));
        document.querySelectorAll('.sekme-icerik').forEach(icerik => icerik.classList.remove('aktif'));
        
        document.querySelector(`.sekme[data-sekme="${sekmeId}"]`).classList.add('aktif');
        document.getElementById(`${sekmeId}Sekme`).classList.add('aktif');
        
        // İçeriği dinamik olarak yükle
        if (sekmeId === 'duyurular') {
            duyurulariYukle();
        } else if (sekmeId === 'biletlerim') {
            biletleriYukle();
        }
    }
    
    // Sekme değiştirme işlemleri
    document.querySelectorAll('.sekme').forEach(sekme => {
        sekme.addEventListener('click', function() {
            const sekmeId = this.getAttribute('data-sekme');
            sekmeAktifEt(sekmeId);
        });
    });

    // Kullanıcı ayarları formunu işle
    const kullaniciAyarlarForm = document.getElementById('kullaniciAyarlarForm');
    if (kullaniciAyarlarForm) {
        kullaniciAyarlarForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const ayarlarMesaj = document.getElementById('ayarlarMesaj');
            ayarlarMesaj.className = 'mesaj yukleniyor';
            ayarlarMesaj.textContent = 'Değişiklikler kaydediliyor...';
            
            // Form verilerini al
            const ad = document.getElementById('ad').value;
            const soyad = document.getElementById('soyad').value;
            const email = document.getElementById('email').value;
            const sifreDegistir = document.getElementById('sifreDegistir')?.value;
            const sifreTekrar = document.getElementById('sifreTekrar')?.value;
            
            // İlgi alanlarını al
            const seciliIlgiAlanlari = Array.from(document.querySelectorAll('input[name="profilIlgiAlanlari"]:checked')).map(cb => cb.value);
            
            // İlgi alanları kontrolü
            if (seciliIlgiAlanlari.length < 3) {
                ayarlarMesaj.className = 'mesaj hatali';
                ayarlarMesaj.textContent = 'Lütfen en az 3 ilgi alanı seçiniz.';
                return;
            }
            
            // Şifre kontrolü
            if (sifreDegistir && sifreDegistir !== sifreTekrar) {
                ayarlarMesaj.className = 'mesaj hatali';
                ayarlarMesaj.textContent = 'Şifreler eşleşmiyor!';
                return;
            }
            
            // Favori kategorileri al (sıralı)
            const favoriteCategories = getSortedFavoriteCategories();
            
            // Gönderilecek veri
            const userData = {
                first_name: ad,
                last_name: soyad,
                email: email,
                interests: seciliIlgiAlanlari.join(','),
                favorite_categories: favoriteCategories.join(',')
            };
            
            // Şifre değişikliği varsa ekle
            if (sifreDegistir && sifreDegistir.length > 0) {
                userData.password = sifreDegistir;
            }
            
            // API'ye kayıt isteği gönder
            ApiService.updateCurrentUser(userData)
                .then(data => {
                    console.log('Kullanıcı bilgileri güncellendi:', data);
                    ayarlarMesaj.className = 'mesaj basarili';
                    ayarlarMesaj.textContent = 'Değişiklikler başarıyla kaydedildi!';

                    // Şifre alanlarını temizle
                    if (document.getElementById('sifreDegistir')) {
                        document.getElementById('sifreDegistir').value = '';
                    }
                    if (document.getElementById('sifreTekrar')) {
                        document.getElementById('sifreTekrar').value = '';
                    }

                    // Profil bilgilerini tekrar yükle
                    profilBilgileriniYukle();
                })
                .catch(error => {
                    console.error('Kullanıcı bilgileri güncellenirken hata:', error);

                    let errorMessage = 'Ayarlar kaydedilirken bir hata oluştu.';
                    if (error.data) {
                        if (error.data.email) errorMessage = `E-posta: ${error.data.email.join(' ')}`;
                        else if (error.data.password) errorMessage = `Şifre: ${error.data.password.join(' ')}`;
                        else if (error.data.non_field_errors) errorMessage = error.data.non_field_errors.join(' ');
                    }

                    ayarlarMesaj.className = 'mesaj hatali';
                    ayarlarMesaj.textContent = errorMessage;
                });
        });
    }
    
    // Çıkış butonu işlemleri
    const cikisButonu = document.getElementById('cikisBtn');
    if (cikisButonu) {
        cikisButonu.addEventListener('click', function(e) {
            e.preventDefault();
            ApiService.logout();
            window.location.href = 'index.html';
        });
    }
    
    // İlk yüklemede tüm verileri getir
    profilBilgileriniYukle();
    
    // Yenile butonu işlevselliği
    const yenileBiletlerBtn = document.getElementById('yenileBiletler');
    if (yenileBiletlerBtn) {
        yenileBiletlerBtn.addEventListener('click', function() {
            console.log('Biletler yenileniyor...');
            
            // Biletleri yeniden yükle
            const biletlerListesi = document.getElementById('biletlerListesi');
            if (biletlerListesi) {
                biletlerListesi.innerHTML = '<div class="loading">Biletler yükleniyor...</div>';
                biletleriYukle();
            }
        });
    }
    
    // Varsayılan sekme (başlangıçta aktif olan) verilerini yükle
    const aktifSekme = document.querySelector('.sekme.aktif');
    if (aktifSekme) {
        sekmeAktifEt(aktifSekme.getAttribute('data-sekme'));
    } else {
        // Varsayılan olarak biletlerim sekmesini aktifleştir
        sekmeAktifEt('biletlerim');
    }
});
