/**
 * User registration script for Etkinlik Yönetim Sistemi
 */

document.addEventListener('DOMContentLoaded', function() {
    // Redirect if already logged in
    if (ApiService.isAuthenticated()) {
        window.location.href = 'ana-ekran.html';
        return;
    }

    const kayitFormu = document.getElementById('kayitFormu');
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
            kayitMesaji.textContent = 'Kaydınız alınmıştır. Yönetici onayından sonra hesabınız aktifleşecektir.';
            kayitMesaji.className = 'mesaj basarili';
            kayitFormu.reset();
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

    // Ana sayfaya dön butonu ekle
    const formFooter = document.querySelector('.form-footer');
    if (formFooter && !formFooter.querySelector('.go-back-btn')) {
        const goBackBtn = document.createElement('button');
        goBackBtn.textContent = '← Ana Sayfaya Dön';
        goBackBtn.className = 'go-back-btn';
        goBackBtn.addEventListener('click', function() {
            window.location.href = 'index.html';
        });
        
        formFooter.appendChild(goBackBtn);
    }

    const form = document.getElementById('kayitFormu');
    const mesajDiv = document.getElementById('kayitMesaji');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const ad = document.getElementById('ad').value;
        const soyad = document.getElementById('soyad').value;
        const sifre = document.getElementById('sifre').value;
        const sifreTekrar = document.getElementById('sifreTekrar').value;
        const ilgiAlanlari = Array.from(document.querySelectorAll('input[name="ilgiAlanlari"]:checked')).map(cb => cb.value);

        if (sifre !== sifreTekrar) {
            mesajDiv.innerText = "Şifreler aynı olmalı!";
            mesajDiv.style.display = "block";
            return;
        }
        if (ilgiAlanlari.length < 3) {
            mesajDiv.innerText = "En az 3 ilgi alanı seçmelisiniz!";
            mesajDiv.style.display = "block";
            return;
        }

        try {
            const response = await ApiService.register({
                email,
                ad,
                soyad,
                password: sifre,
                ilgi_alanlari: ilgiAlanlari
            });

            if (response && (response.success || response.basarili)) {
                mesajDiv.innerText = "Kaydınız alınmıştır. Yönetici onayından sonra hesabınız aktifleşecektir. Giriş sayfasına yönlendiriliyorsunuz...";
                mesajDiv.style.display = "block";
                form.reset();
                setTimeout(function() {
                    window.location.href = "giris.html";
                }, 2500);
            } else {
                mesajDiv.innerText = (response && (response.message || response.mesaj)) || "Kayıt başarısız!";
                mesajDiv.style.display = "block";
            }
        } catch (err) {
            mesajDiv.innerText = "Bir hata oluştu!";
            mesajDiv.style.display = "block";
        }
    });
});