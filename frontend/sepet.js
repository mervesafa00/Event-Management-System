// sepet.js

document.addEventListener('DOMContentLoaded', function() {
    const sepetListesi = document.getElementById('sepet-listesi');
    const sepetBosMesaji = document.getElementById('sepet-bos-mesaji');
    const biletTuruSecimiDiv = document.getElementById('bilet-turu-secimi');
    const toplamFiyatDegerSpan = document.getElementById('toplam-fiyat-deger');
    
    // LocalStorage'dan sepet verilerini al
    let sepet = JSON.parse(localStorage.getItem('sepet')) || [];
    
    // Sepetteki etkinlikleri çek ve göster
    async function sepetEtkinlikleriniGoster() {
        // Sepet boşsa mesaj göster
        if (!sepet.length) {
            sepetBosMesaji.style.display = 'block';
            sepetListesi.innerHTML = '';
            biletTuruSecimiDiv.innerHTML = '';
            toplamFiyatDegerSpan.textContent = '0.00 TL';
            return;
        }
        
        sepetBosMesaji.style.display = 'none';
        sepetListesi.innerHTML = '<p>Sepet yükleniyor...</p>';
        biletTuruSecimiDiv.innerHTML = '';
        
        try {
            // Her etkinlik ID'si için veri çek
            const etkinliklerPromises = sepet.map(etkinlikId => 
                ApiService.getEvent(etkinlikId)
                .catch(error => {
                    console.error(`Etkinlik verisi çekilemedi (ID: ${etkinlikId}):`, error);
                    // Hata durumunda varsayılan etkinlik bilgileri
                    return {
                        id: etkinlikId,
                        title: `Etkinlik #${etkinlikId}`,
                        ticket_price: 0,
                        error: true
                    };
                })
            );
            
            const etkinlikler = await Promise.all(etkinliklerPromises);
            let toplamFiyat = 0;
            
            // Hiç başarılı sonuç yoksa mesaj göster
            if (etkinlikler.every(e => e.error)) {
                sepetListesi.innerHTML = `
                    <p>Sepetinizdeki etkinliklere erişilemedi. API bağlantınızı kontrol edin veya sepeti temizleyin.</p>
                    <button id="sepeti-temizle" class="buton-sepete-ekle">Sepeti Temizle</button>
                `;
                
                // Sepeti temizle butonuna olay ekle
                document.getElementById('sepeti-temizle').addEventListener('click', function() {
                    sepet = [];
                    localStorage.setItem('sepet', JSON.stringify(sepet));
                    sepetEtkinlikleriniGoster();
                    updateCartCounter();
                    alert('Sepet temizlendi!');
                });
                
                return;
            }
            
            // Hatasız etkinlikleri göster
            sepetListesi.innerHTML = '';
            
            etkinlikler.forEach(etkinlik => {
                if (etkinlik.error) return; // Hatalı etkinlikleri atla
                
                const li = document.createElement('li');
                li.dataset.id = etkinlik.id;
                
                li.innerHTML = `
                    <div class="sepet-etkinlik-bilgi">
                        <h4>${etkinlik.title}</h4>
                        <p>Bilet Fiyatı: ${etkinlik.ticket_price} TL</p>
                    </div>
                    <div class="sepet-islem">
                        <button class="sepetten-cikar" data-id="${etkinlik.id}">Çıkar</button>
                    </div>
                `;
                
                sepetListesi.appendChild(li);
                
                // Bilet türü seçimi ekle
                const biletSecimDiv = document.createElement('div');
                biletSecimDiv.dataset.etkinlikId = etkinlik.id;
                
                const select = document.createElement('select');
                select.classList.add('bilet-turu-select');
                select.dataset.etkinlikId = etkinlik.id;
                
                // Fiyat değerini sayısal olarak doğru şekilde işle
                const rawFiyat = etkinlik.ticket_price;
                const fiyat = typeof rawFiyat === 'number' ? rawFiyat : 
                             (typeof rawFiyat === 'string' ? parseFloat(rawFiyat) : 0);
                
                select.innerHTML = `
                    <option value="standart" data-price="${fiyat}">Standart (${fiyat} TL)</option>
                    <option value="ogrenci" data-price="${fiyat * 0.7}">Öğrenci (${(fiyat * 0.7).toFixed(2)} TL)</option>
                    <option value="vip" data-price="${fiyat * 1.5}">VIP (${(fiyat * 1.5).toFixed(2)} TL)</option>
                `;
                
                biletSecimDiv.appendChild(document.createTextNode(`${etkinlik.title} - Bilet Türü: `));
                biletSecimDiv.appendChild(select);
                biletTuruSecimiDiv.appendChild(biletSecimDiv);
                
                toplamFiyat += fiyat;
            });
            
            // Toplam fiyatı güvenli bir şekilde formatlayarak göster
            toplamFiyatDegerSpan.textContent = (isNaN(toplamFiyat) ? 0 : toplamFiyat).toFixed(2) + ' TL';
            
            // Sepetten çıkar butonlarına tıklama olayı ekle
            document.querySelectorAll('.sepetten-cikar').forEach(button => {
                button.addEventListener('click', function() {
                    const etkinlikId = this.getAttribute('data-id');
                    sepettenCikar(etkinlikId);
                });
            });
            
            // Bilet türü değişikliği dinleyicisi
            biletTuruSecimiDiv.addEventListener('change', function(event) {
                if (event.target.classList.contains('bilet-turu-select')) {
                    guncelleTotalFiyat();
                }
            });
            
        } catch (error) {
            console.error('Sepet etkinlikleri getirilirken hata:', error);
            sepetListesi.innerHTML = `
                <p>Sepetinizdeki etkinlikler yüklenirken hata oluştu.</p>
                <p>Hata detayı: ${error.message || 'Bilinmeyen hata'}</p>
                <button id="sepeti-temizle" class="buton-sepete-ekle">Sepeti Temizle</button>
            `;
            
            // Sepeti temizle butonuna olay ekle
            document.getElementById('sepeti-temizle').addEventListener('click', function() {
                sepet = [];
                localStorage.setItem('sepet', JSON.stringify(sepet));
                sepetEtkinlikleriniGoster();
                updateCartCounter();
                alert('Sepet temizlendi!');
            });
        }
    }
    
    // Sepetten ürün çıkar
    function sepettenCikar(etkinlikId) {
        // LocalStorage'dan sepeti güncelle
        sepet = sepet.filter(id => id !== etkinlikId);
        localStorage.setItem('sepet', JSON.stringify(sepet));
        
        // UI'ı güncelle
        sepetEtkinlikleriniGoster();
        
        // Kullanıcıya bilgi ver
        alert(`Etkinlik sepetten çıkarıldı!`);
        
        // Sepet sayısını güncelle
        updateCartCounter();
    }
    
    // Sepet sayacını güncelle
    function updateCartCounter() {
        const sepetAlaniLink = document.querySelector('.sepet-alani a');
        if (sepetAlaniLink) {
            sepetAlaniLink.textContent = `Sepetim (${sepet.length})`;
        }
    }
    
    // Toplam fiyatı hesapla ve güncelle
    function guncelleTotalFiyat() {
        let toplamFiyat = 0;
        const biletSecimler = biletTuruSecimiDiv.querySelectorAll('.bilet-turu-select');
        
        biletSecimler.forEach(select => {
            const seciliOption = select.options[select.selectedIndex];
            const fiyatStr = seciliOption.getAttribute('data-price');
            // Fiyatı güvenli bir şekilde sayıya dönüştür
            const fiyat = fiyatStr ? parseFloat(fiyatStr) : 0;
            // NaN kontrolü yap
            if (!isNaN(fiyat)) {
                toplamFiyat += fiyat;
            }
        });
        
        toplamFiyatDegerSpan.textContent = (isNaN(toplamFiyat) ? 0 : toplamFiyat).toFixed(2) + ' TL';
    }
    
    // Ödeme işlemi
    async function odemeyiTamamla() {
        if (!sepet.length) {
            alert('Sepetinizde ürün bulunmamaktadır.');
            return;
        }
        
        if (!ApiService.isAuthenticated()) {
            alert('Ödeme yapmak için lütfen giriş yapın!');
            window.location.href = 'giris.html?redirect=sepet.html';
            return;
        }
        
        // Ödeme işlemi butonunu devre dışı bırak
        const odemeButonu = document.querySelector('#odeme-formu button[type="submit"]');
        if (odemeButonu) {
            const originalText = odemeButonu.textContent;
            odemeButonu.disabled = true;
            odemeButonu.textContent = 'İşleminiz gerçekleştiriliyor...';
            
            try {
                // Seçilen bilet türlerini al
                const biletler = [];
                document.querySelectorAll('.bilet-turu-select').forEach(select => {
                    const etkinlikId = select.dataset.etkinlikId;
                    const biletTuru = select.value;
                    const fiyat = parseFloat(select.options[select.selectedIndex].getAttribute('data-price'));
                    
                    biletler.push({
                        event_id: etkinlikId,
                        ticket_type: biletTuru,
                        count: 1,
                        price: fiyat
                    });
                });
                
                // Her bilet için kayıt oluştur
                const kayitPromises = biletler.map(bilet => 
                    ApiService.registerForEvent(bilet.event_id, {
                        ticket_type: bilet.ticket_type,
                        count: bilet.count,
                        price: bilet.price
                    })
                );
                
                await Promise.all(kayitPromises);
                
                // Başarılı ödeme
                alert('Ödeme işleminiz başarıyla tamamlandı!');
                
                // Sepeti temizle
                sepet = [];
                localStorage.setItem('sepet', JSON.stringify(sepet));
                
                // Kullanıcıyı profil sayfasına yönlendir
                window.location.href = 'profil.html';
                
            } catch (error) {
                console.error('Ödeme sırasında hata:', error);
                
                let errorMessage = 'Ödeme işlemi sırasında bir hata oluştu.';
                if (error.data && error.data.detail) {
                    errorMessage = error.data.detail;
                }
                
                alert(`Hata: ${errorMessage}`);
                
                // Ödeme butonunu tekrar aktif et
                odemeButonu.disabled = false;
                odemeButonu.textContent = originalText;
            }
        }
    }
    
    // Ödeme formu varsa işle
    const odemeFormu = document.getElementById('odeme-formu');
    if (odemeFormu) {
        odemeFormu.addEventListener('submit', function(e) {
            e.preventDefault();
            odemeyiTamamla();
        });
    }
    
    // Sepete ekle fonksiyonu (sayfa dışından çağrılabilir)
    window.sepeteEkle = function(etkinlikId) {
        if (!sepet.includes(etkinlikId)) {
            sepet.push(etkinlikId);
            localStorage.setItem('sepet', JSON.stringify(sepet));
            
            // UI güncellemesi (eğer sepet sayfasındaysak)
            if (sepetListesi) {
                sepetEtkinlikleriniGoster();
            }
            
            // Sepet sayacını güncelle
            updateCartCounter();
            
            alert('Etkinlik sepete eklendi!');
        } else {
            alert('Bu etkinlik zaten sepetinizde bulunuyor.');
        }
    };
    
    // Sayfa yüklendiğinde sepeti göster
    sepetEtkinlikleriniGoster();
    
    // Sepet sayacını güncelle
    updateCartCounter();
});