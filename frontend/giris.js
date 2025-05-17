/**
 * User login script for Etkinlik Yönetim Sistemi
 */

document.addEventListener('DOMContentLoaded', function() {
    // Kullanıcı zaten giriş yapmışsa ana ekrana yönlendir
    if (ApiService.isAuthenticated()) {
        window.location.href = 'ana-ekran.html';
        return;
    }

    const girisFormu = document.getElementById('girisFormu');
    // E-mail ile giriş için inputu güncelle
    const emailInput = document.getElementById('email');
    const sifreInput = document.getElementById('sifre');
    const girisMesaji = document.getElementById('girisMesaji');

    girisFormu.addEventListener('submit', async function(event) {
        event.preventDefault(); // Sayfanın yenilenmesini engelle

        // Giriş butonunu devre dışı bırak ve yükleniyor göster
        const submitButton = girisFormu.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Giriş yapılıyor...';

        // Mesajı temizle veya yükleniyor olarak güncelle
        girisMesaji.textContent = 'Giriş yapılıyor...';
        girisMesaji.className = 'mesaj yukleniyor';

        // E-mail ile giriş
        const email = emailInput.value;
        const password = sifreInput.value;

        try {
            // API Service ile giriş işlemi
            const response = await ApiService.login(email, password);

            // Token'ı yerel depolamaya kaydet
            if (response && response.token) {
                ApiService.setToken(response.token);

                girisMesaji.textContent = 'Giriş başarılı! Yönlendiriliyorsunuz...';
                girisMesaji.className = 'mesaj basarili';

                // Kullanıcı bilgilerini al ve ilk giriş durumunu kontrol et
                try {
                    const userInfo = await ApiService.getCurrentUser();
                    // Kullanıcı bilgilerini yerel depolamaya kaydet (opsiyonel)
                    localStorage.setItem('currentUser', JSON.stringify(userInfo));

                    // İlk giriş veya şifre sıfırlama durumunu kontrol et (backend'den gelen bir bilgi olabilir)
                    if (userInfo.first_login === true || response.ilkGiris) {
                        window.location.href = 'sifre-degistir.html?ilkGiris=true';
                    } else {
                        window.location.href = 'ana-ekran.html';
                    }
                } catch (userError) {
                    // Hata olsa bile ana ekrana yönlendir
                    window.location.href = 'ana-ekran.html';
                }
            } else {
                throw new Error('Token alınamadı.');
            }
        } catch (error) {
            // Hata mesajını göster
            let errorMessage = 'Giriş yapılırken bir hata oluştu.';

            // Backend'den gelen hata mesajlarını işle
            if (error.data) {
                if (error.data.non_field_errors) {
                    errorMessage = error.data.non_field_errors.join(' ');
                } else if (error.data.detail) {
                    errorMessage = error.data.detail;
                } else if (error.data.message) {
                    errorMessage = error.data.message;
                }
            }

            girisMesaji.textContent = errorMessage;
            girisMesaji.className = 'mesaj hatali';

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
        goBackBtn.type = 'button';
        goBackBtn.addEventListener('click', function() {
            window.location.href = 'index.html';
        });

        formFooter.appendChild(goBackBtn);

        // Back butonu için stil ekle
        if (!document.querySelector('style.go-back-btn-style')) {
            const style = document.createElement('style');
            style.className = 'go-back-btn-style';
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
});