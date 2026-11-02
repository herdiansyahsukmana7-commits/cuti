/**
 * assets/js/auth.js
 * E-Cuti Dinas Kesehatan Kota Tangerang Selatan
 * Modul Proteksi Sesi & Autentikasi Petugas
 */

let petugasAuth = JSON.parse(localStorage.getItem('DINKES_PETUGAS_AUTH') || 'null') || {
  nama: 'Admin Kepegawaian',
  username: 'admin',
  password: 'dinkes123'
};

function checkAuthSession() {
      const loginScreen = document.getElementById('loginScreen');
      if (state.isLoggedIn) {
        loginScreen.classList.add('hidden');
      } else {
        loginScreen.classList.remove('hidden');
        setTimeout(() => {
          const u = document.getElementById('loginUsername');
          if (u) u.focus();
        }, 100);
      }
    }

    function togglePasswordVisibility() {
      const passInput = document.getElementById('loginPassword');
      const icon = document.getElementById('eyeIconLogin');
      if (passInput.type === 'password') {
        passInput.type = 'text';
        icon.setAttribute('data-lucide', 'eye-off');
      } else {
        passInput.type = 'password';
        icon.setAttribute('data-lucide', 'eye');
      }
      lucide.createIcons();
    }

    function submitLogin(e) {
      e.preventDefault();
      const u = document.getElementById('loginUsername').value.trim();
      const p = document.getElementById('loginPassword').value;
      const errBox = document.getElementById('loginErrorAlert');

      if (u.toLowerCase() === petugasAuth.username.toLowerCase() && p === petugasAuth.password) {
        errBox.classList.add('hidden');
        state.isLoggedIn = true;
        sessionStorage.setItem('DINKES_LOGGED_IN', 'true');
        document.getElementById('sidebarPetugasNama').textContent = petugasAuth.nama || petugasAuth.username;
        document.getElementById('loginPassword').value = '';
        checkAuthSession();
        showToast(`Selamat datang, ${petugasAuth.nama || petugasAuth.username}`);
      } else {
        errBox.classList.remove('hidden');
      }
    }

    function logoutPetugas() {
      if (!confirm('Keluar dari sesi Petugas Penginput E-Cuti?')) return;
      state.isLoggedIn = false;
      sessionStorage.removeItem('DINKES_LOGGED_IN');
      checkAuthSession();
      showToast('Anda telah keluar dari sistem');
    }

// Dukungan halaman login.html mandiri
if (window.location.pathname.toLowerCase().endsWith('/login.html') || window.location.pathname.toLowerCase().endsWith('login.html')) {
  window.addEventListener('DOMContentLoaded', () => {
    if (typeof lucide !== 'undefined') lucide.createIcons();
    if (sessionStorage.getItem('DINKES_LOGGED_IN') === 'true') {
      window.location.replace('index.html');
    }
  });
}
