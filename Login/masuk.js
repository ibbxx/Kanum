/**
 * KANUM – Login/Masuk Page Logic
 */
(function () {
  'use strict';

  async function doLogin() {
    const email    = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
      window.showToast('Isi email dan kata sandi', 'error');
      return;
    }

    const btn = document.querySelector('button[onclick="doLogin()"]');
    if (btn) { btn.disabled = true; btn.textContent = 'Memproses...'; }

    const { data, error } = await window._sb.auth.signInWithPassword({ email, password });

    if (btn) { btn.disabled = false; btn.textContent = 'Masuk'; }

    if (error) {
      window.showToast('Gagal masuk: ' + error.message, 'error');
      return;
    }

    const profile = await window.getCurrentProfile();
    window.location.href = profile?.role === 'admin' ? '/admin' : '/dashboard';
  }

  async function doGoogleLogin() {
    const { error } = await window._sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/dashboard' }
    });
    if (error) window.showToast('Gagal: ' + error.message, 'error');
  }

  // Expose ke onclick attribute
  window.doLogin       = doLogin;
  window.doGoogleLogin = doGoogleLogin;

  document.addEventListener('DOMContentLoaded', function () {
    const toggleIcon = document.getElementById('toggle-password-icon');
    if (toggleIcon) {
      toggleIcon.parentElement.addEventListener('click', function () {
        const passInput = document.getElementById('password');
        const isHidden  = passInput.type === 'password';
        passInput.type  = isHidden ? 'text' : 'password';
        toggleIcon.textContent = isHidden ? 'visibility_off' : 'visibility';
        toggleIcon.parentElement.setAttribute(
          'aria-label',
          isHidden ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'
        );
      });
    }
  });
})();
