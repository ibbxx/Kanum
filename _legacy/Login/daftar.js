/**
 * KANUM – Login/Daftar Page Logic
 */
(function () {
  'use strict';

  async function doRegister() {
    const name   = document.getElementById('name').value.trim();
    const email  = document.getElementById('email').value.trim();
    const pass   = document.getElementById('password').value;
    const pass2  = document.getElementById('confirm-password').value;
    const terms  = document.getElementById('terms').checked;
    const roleUI = document.querySelector('input[name="role"]:checked')?.value || 'siswa';

    if (!name || !email || !pass) { window.showToast('Lengkapi semua kolom', 'error'); return; }
    if (pass !== pass2)           { window.showToast('Kata sandi tidak cocok', 'error'); return; }
    if (!terms)                   { window.showToast('Setujui syarat & ketentuan terlebih dahulu', 'error'); return; }

    // Mapping role UI ke metadata Supabase
    // 'guru' → 'teacher' → trigger PostgreSQL akan menyimpan sebagai 'admin'
    const metaRole = roleUI === 'guru' ? 'teacher' : 'student';

    const btn = document.querySelector('button[onclick="doRegister()"]');
    if (btn) {
      btn.disabled = true;
      btn.childNodes[0].textContent = 'Memproses... ';
    }

    const { data, error } = await window._sb.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          full_name: name,
          role: metaRole
        }
      }
    });

    if (btn) {
      btn.disabled = false;
      btn.childNodes[0].textContent = 'Daftar Sekarang ';
    }

    if (error) { window.showToast('Gagal daftar: ' + error.message, 'error'); return; }

    if (roleUI === 'guru') {
      window.showToast('Akun guru berhasil dibuat! Cek email untuk verifikasi. Setelah verifikasi, masuk ke Admin Panel.');
    } else {
      window.showToast('Akun berhasil dibuat! Silakan cek email untuk verifikasi.');
    }

    setTimeout(() => { window.location.href = '/login'; }, 2500);
  }

  // Expose ke onclick attribute
  window.doRegister = doRegister;

  document.addEventListener('DOMContentLoaded', function () {
    // Focus state untuk ikon input
    document.querySelectorAll('input').forEach(function (input) {
      input.addEventListener('focus', function () {
        var icon = input.parentElement.querySelector('.material-symbols-outlined');
        if (icon) icon.classList.add('text-primary');
      });
      input.addEventListener('blur', function () {
        var icon = input.parentElement.querySelector('.material-symbols-outlined');
        if (icon) icon.classList.remove('text-primary');
      });
    });

    // Toggle visibility kata sandi
    var passToggle = document.getElementById('toggle-password-icon');
    if (passToggle) {
      passToggle.parentElement.addEventListener('click', function () {
        var passInput = document.getElementById('password');
        if (passInput.type === 'password') {
          passInput.type = 'text';
          passToggle.textContent = 'visibility_off';
        } else {
          passInput.type = 'password';
          passToggle.textContent = 'visibility';
        }
      });
    }
  });
})();
