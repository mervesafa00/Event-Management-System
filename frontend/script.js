document.addEventListener('DOMContentLoaded', function() {
    const API_URL = 'http://127.0.0.1:8000';
    
    // Kullanıcı giriş kontrolü ve yönlendirme
    const authToken = localStorage.getItem('authToken');
    const currentPage = window.location.pathname;
    
    if (authToken) {
        // Eğer giriş veya kayıt sayfasındaysa ana ekrana yönlendir
        if (currentPage.includes('giris.html') || currentPage.includes('kayit.html')) {
            console.log('Kullanıcı zaten giriş yapmış, ana ekrana yönlendiriliyor...');
            window.location.href = 'ana-ekran.html';
            return;
        }
    }
    
    // Bir önceki sayfaya dön butonu ekle (kayıt ve giriş sayfalarında)
    if (document.querySelector('.auth-form-container')) {
        const formFooter = document.querySelector('.form-footer');
        
        if (formFooter && !formFooter.querySelector('.go-back-btn')) {
            const goBackBtn = document.createElement('button');
            goBackBtn.textContent = '← Ana Sayfaya Dön';
            goBackBtn.className = 'go-back-btn';
            goBackBtn.addEventListener('click', function() {
                window.location.href = 'index.html';
            });
            
            formFooter.appendChild(goBackBtn);
            
            // Back butonu için stil ekle
            const style = document.createElement('style');
            style.textContent = `
                .go-back-btn {
                    background: none;
                    border: none;
                    color: #1976d2;
                    cursor: pointer;
                    font-size: 14px;
                    padding: 0;
                    text-decoration: underline;
                    margin-top: 10px;
                }
                .go-back-btn:hover {
                    color: #0d47a1;
                }
                .form-footer {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 15px;
                    margin-top: 20px;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Kayıt formu işlemleri
    const kayitFormu = document.getElementById('kayitFormu');
    if (kayitFormu) {
        const emailInput = document.getElementById('email');
        const kullaniciAdiInput = document.getElementById('kullaniciAdi');
        const sifreInput = document.getElementById('sifre');
        const sifreTekrarInput = document.getElementById('sifreTekrar');
        const adInput = document.getElementById('ad');
        const soyadInput = document.getElementById('soyad');
        const kayitMesaji = document.getElementById('kayitMesaji');
        
        // İlgi alanları seçimi için
        const ilgiAlanlariCheckboxes = document.querySelectorAll('input[name="ilgiAlanlari"]');
        const ilgiAlanlariSayisi = document.getElementById('ilgiAlanlariSayisi');
        
        // İlgi alanları seçimi izleme
        ilgiAlanlariCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const seciliSayi = document.querySelectorAll('input[name="ilgiAlanlari"]:checked').length;
                ilgiAlanlariSayisi.textContent = `${seciliSayi}/3 seçildi`;
                
                if (seciliSayi >= 3) {
                    ilgiAlanlariSayisi.className = 'ilgi-alanlari-bilgi yeterli';
                } else {
                    ilgiAlanlariSayisi.className = 'ilgi-alanlari-bilgi yetersiz';
                }
            });
        });

        kayitFormu.addEventListener('submit', async function(event) {
            event.preventDefault(); // Sayfanın yenilenmesini engelle

            // Form verilerini al
            const email = emailInput.value;
            const username = kullaniciAdiInput ? kullaniciAdiInput.value : email;
            const password = sifreInput.value;
            const password_confirm = sifreTekrarInput ? sifreTekrarInput.value : password;
            const first_name = adInput ? adInput.value : '';
            const last_name = soyadInput ? soyadInput.value : '';
            
            // İlgi alanlarını al
            const seciliIlgiAlanlari = Array.from(document.querySelectorAll('input[name="ilgiAlanlari"]:checked')).map(cb => cb.value);
            
            // İlgi alanları kontrolü
            if (seciliIlgiAlanlari.length < 3) {
                kayitMesaji.textContent = 'Lütfen en az 3 ilgi alanı seçiniz.';
                kayitMesaji.className = 'mesaj hatali';
                return;
            }

            // Gelişmiş form doğrulama - backend hata mesajlarına göre güncellenmiş
            if (!username || username.length < 3) {
                kayitMesaji.textContent = 'Kullanıcı adı en az 3 karakter olmalıdır.';
                kayitMesaji.className = 'mesaj hatali';
                return;
            }

            if (!email || !email.includes('@') || !email.includes('.')) {
                kayitMesaji.textContent = 'Geçerli bir e-posta adresi giriniz.';
                kayitMesaji.className = 'mesaj hatali';
                return;
            }

            if (!password || password.length < 8) {
                kayitMesaji.textContent = 'Şifre en az 8 karakter olmalıdır.';
                kayitMesaji.className = 'mesaj hatali';
                return;
            }

            if (password !== password_confirm) {
                kayitMesaji.textContent = 'Şifreler eşleşmiyor.';
                kayitMesaji.className = 'mesaj hatali';
                return;
            }

            // Submit butonunu devre dışı bırak ve yükleniyor göster
            const submitButton = kayitFormu.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.textContent = 'Kayıt yapılıyor...';

            // Yükleniyor mesajı göster
            kayitMesaji.textContent = 'Kayıt işlemi yapılıyor...';
            kayitMesaji.className = 'mesaj yukleniyor';

            try {
                // ApiService ile kayıt işlemi
                const userData = {
                    username,
                    email,
                    password,
                    password2: password_confirm,
                    first_name,
                    last_name,
                    interests: seciliIlgiAlanlari.join(',')
                };
                
                const response = await ApiService.register(userData);
                
                // Başarılı kayıt
                kayitMesaji.textContent = 'Kayıt işlemi başarıyla tamamlandı. Giriş yapabilirsiniz.';
                kayitMesaji.className = 'mesaj basarili';
                kayitFormu.reset();
                
                // Başarılı kayıttan sonra giriş sayfasına yönlendir
                setTimeout(() => {
                    window.location.href = 'giris.html';
                }, 2000);
            } catch (error) {
                console.error('Kayıt hatası:', error);
                
                // Hata mesajını göster
                let errorMessage = 'Kayıt yapılırken bir hata oluştu.';
                
                // Backend'den gelen hata mesajlarını işle
                if (error.data) {
                    if (error.data.username) errorMessage = `Kullanıcı adı: ${error.data.username.join(' ')}`;
                    else if (error.data.email) errorMessage = `E-posta: ${error.data.email.join(' ')}`;
                    else if (error.data.password) errorMessage = `Şifre: ${error.data.password.join(' ')}`;
                    else if (error.data.non_field_errors) errorMessage = error.data.non_field_errors.join(' ');
                }
                
                kayitMesaji.textContent = errorMessage;
                kayitMesaji.className = 'mesaj hatali';
                
                // Butonun durumunu geri al
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
            }
        });
    }

    // Giriş formu işlemleri
    const girisFormu = document.getElementById('girisFormu');
    if (girisFormu) {
        const kullaniciAdiInput = document.getElementById('kullaniciAdi');
        const sifreInput = document.getElementById('sifre');
        const girisMesaji = document.getElementById('girisMesaji');

        girisFormu.addEventListener('submit', async function(event) {
            event.preventDefault(); // Sayfanın yenilenmesini engelle

            const username = kullaniciAdiInput.value;
            const password = sifreInput.value;

            // Basit form doğrulama
            if (!username || !password) {
                girisMesaji.textContent = 'Kullanıcı adı ve şifre gereklidir.';
                girisMesaji.className = 'mesaj hatali';
                return;
            }

            // Yükleniyor mesajı göster
            girisMesaji.textContent = 'Giriş yapılıyor...';
            girisMesaji.className = 'mesaj yukleniyor';

            try {
                // Backend API'ye giriş isteği gönder
                const response = await fetch(`${API_URL}/api/users/login/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        username,
                        password
                    })
                });
                
                // İlk olarak ham yanıtı text olarak al
                const responseText = await response.text();
                
                // Yanıt içeriğini konsola yazdır (hata ayıklama)
                console.log("API login yanıtı:", responseText.substring(0, 500)); // İlk 500 karakteri göster
                
                let data;
                try {
                    // Text'i JSON'a çevirmeye çalış
                    data = JSON.parse(responseText);
                } catch (parseError) {
                    console.error("JSON ayrıştırma hatası:", parseError);
                    // HTML döndüyse backend'de bir hata oluşmuş olabilir
                    if (responseText.includes("<!DOCTYPE html>")) {
                        throw new Error("Backend sunucusu bir hata sayfası döndürdü. Sunucu loglarını kontrol edin.");
                    } else {
                        throw new Error("Geçersiz yanıt formatı: " + responseText.substring(0, 100));
                    }
                }

                if (response.ok) {
                    // Başarılı giriş
                    girisMesaji.textContent = 'Giriş başarılı. Yönlendiriliyorsunuz...';
                    girisMesaji.className = 'mesaj basarili';
                    
                    // Token'ı localStorage'a kaydet
                    localStorage.setItem('authToken', data.token);
                    localStorage.setItem('username', username);
                    
                    // Ana sayfaya yönlendir - 'index.html'den 'ana-ekran.html'e değiştirildi
                    setTimeout(() => {
                        window.location.href = 'ana-ekran.html';
                    }, 1500);
                } else {
                    // API hata mesajlarını göster
                    const errorMessage = data.detail || data.non_field_errors || 'Giriş başarısız.';
                    girisMesaji.textContent = `Giriş hatası: ${errorMessage}`;
                    girisMesaji.className = 'mesaj hatali';
                }
            } catch (error) {
                console.error('Giriş sırasında hata:', error);
                girisMesaji.textContent = 'Sunucu hatası: ' + error.message;
                girisMesaji.className = 'mesaj hatali';
                
                // Daha detaylı hata analizi
                console.log("Lütfen şunları kontrol edin:");
                console.log("1. Backend sunucunuzun çalıştığından emin olun");
                console.log("2. Doğru endpoint kullanıldığından emin olun: /api/users/login/");
                console.log("3. Backend loglarını kontrol edin");
            }
        });
    }

    // Oturum durumu kontrolü
    function checkAuthStatus() {
        const authToken = localStorage.getItem('authToken');
        const isLoggedIn = !!authToken;
        
        // Sayfadaki giriş/çıkış butonlarını güncelle
        const loginBtn = document.querySelector('.giris-btn');
        const registerBtn = document.querySelector('.kayit-btn');
        const logoutBtn = document.querySelector('.cikis-btn');
        const userProfileBtn = document.querySelector('.profil-btn');
        
        if (isLoggedIn) {
            // Kullanıcı giriş yapmışsa
            if (loginBtn) loginBtn.style.display = 'none';
            if (registerBtn) registerBtn.style.display = 'none';
            
            // Çıkış ve profil butonları yoksa ekle
            if (!logoutBtn && document.querySelector('.navbar-auth')) {
                const logoutLink = document.createElement('a');
                logoutLink.href = '#';
                logoutLink.className = 'cikis-btn';
                logoutLink.textContent = 'Çıkış Yap';
                logoutLink.addEventListener('click', logout);
                document.querySelector('.navbar-auth').appendChild(logoutLink);
            }
            
            if (!userProfileBtn && document.querySelector('.navbar-auth')) {
                const username = localStorage.getItem('username');
                const profileLink = document.createElement('a');
                profileLink.href = 'profil.html';
                profileLink.className = 'profil-btn';
                profileLink.textContent = `Profil (${username || 'Kullanıcı'})`;
                document.querySelector('.navbar-auth').insertBefore(profileLink, logoutBtn);
            }
        } else {
            // Kullanıcı giriş yapmamışsa
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (userProfileBtn) userProfileBtn.style.display = 'none';
            
            // Giriş ve kayıt butonları görünür olsun
            if (loginBtn) loginBtn.style.display = 'inline-block';
            if (registerBtn) registerBtn.style.display = 'inline-block';
        }
    }
    
    // Çıkış yapma fonksiyonu
    function logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('username');
        window.location.href = 'index.html';
    }
    
    // Sayfa yüklendiğinde oturum durumunu kontrol et
    checkAuthStatus();
});