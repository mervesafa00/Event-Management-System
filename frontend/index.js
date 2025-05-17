/**
 * Index page script for Etkinlik Yönetim Sistemi
 */

document.addEventListener('DOMContentLoaded', function() {
    // Kullanıcı giriş yapmışsa ana ekrana yönlendir
    if (ApiService.isAuthenticated()) {
        window.location.href = 'ana-ekran.html';
    }
}); 