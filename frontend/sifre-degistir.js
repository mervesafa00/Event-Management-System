document.addEventListener('DOMContentLoaded', function() {
    const sifreDegistirFormu = document.getElementById('sifreDegistirFormu');
    const kullaniciAdiInput = document.getElementById('kullaniciAdi');
    const yeniSifreInput = document.getElementById('yeniSifre');
    const yeniSifreTekrarInput = document.getElementById('yeniSifreTekrar');
    const sifreDegistirMesaji = document.getElementById('sifreDegistirMesaji');
    
    // URL parametrelerini kontrol et - şifremi unuttum durumu için
    const urlParams = new URLSearchParams(window.location.search);
    const isForgotPassword = urlParams.has('reset');
    
    // Eğer şifremi unuttum değilse ve kullanıcı giriş yapmamışsa, giriş sayfasına yönlendir
    if (!isForgotPassword && !ApiService.isAuthenticated()) {
        window.location.href = 'giris.html';
        return;
    }
    
    // Şifremi unuttum durumunda başlığı güncelle
    if (isForgotPassword) {
        document.querySelector('h2').textContent = 'Şifremi Unuttum';
    }

    // Mesaj gösterme fonksiyonu
    const showMessage = (message, isSuccess) => {
        sifreDegistirMesaji.textContent = message;
        sifreDegistirMesaji.className = isSuccess ? 'mesaj basarili' : 'mesaj hatali';
        sifreDegistirMesaji.style.display = 'block';
        
        // Sayfayı mesaja kaydır
        sifreDegistirMesaji.scrollIntoView({ behavior: 'smooth' });
    };

    sifreDegistirFormu.addEventListener('submit', async function(event) {
        event.preventDefault();

        const kullaniciAdi = kullaniciAdiInput.value;
        const yeniSifre = yeniSifreInput.value;
        const yeniSifreTekrar = yeniSifreTekrarInput.value;

        // Validasyon kontrolü
        if (!kullaniciAdi) {
            showMessage('Kullanıcı adınızı girmelisiniz.', false);
            return;
        }

        if (yeniSifre.length < 6) {
            showMessage('Yeni şifre en az 6 karakter olmalıdır.', false);
            return;
        }

        if (yeniSifre !== yeniSifreTekrar) {
            showMessage('Yeni şifreler eşleşmiyor.', false);
            return;
        }

        try {
            // API isteği için uygun metodu seç
            let response;
            if (isForgotPassword) {
                // Şifremi unuttum durumu için farklı API uç noktası kullan
                response = await ApiService.resetPassword(kullaniciAdi, yeniSifre);
            } else {
                // Normal şifre değiştirme
                response = await ApiService.changePassword(kullaniciAdi, yeniSifre);
            }
            
            // Normal şifre değiştirmede çıkış yap
            if (!isForgotPassword) {
                ApiService.logout();
            }
            
            // Hemen giriş sayfasına yönlendir
            window.location.href = 'giris.html';
        } catch (error) {
            // API hata mesajını ayrıştır
            let errorMessage = 'Şifre değiştirme işlemi başarısız oldu.';
            
            if (error.data && error.data.error) {
                errorMessage = error.data.error;
            } else if (error.data && error.data.detail) {
                errorMessage = error.data.detail;
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            showMessage(errorMessage, false);
            console.error('Şifre değiştirme hatası:', error);
        }
    });
});