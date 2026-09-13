/**
 * KANUM – Pengaturan Page Logic
 */
(function () {
  'use strict';

  var _session = null;

  (async function () {
    _session = await window.getSession();
    if (!_session) {
      window.location.href = '/login';
      return;
    }

    var result = await window._sb
      .from('profiles')
      .select('full_name, class_name, email')
      .eq('id', _session.user.id)
      .single();

    if (result.error) {
      window.showToast('Gagal memuat profil: ' + result.error.message, 'error');
      return;
    }

    var profile = result.data;
    if (profile) {
      var nameEl  = document.getElementById('input-name');
      var classEl = document.getElementById('input-class');
      var emailEl = document.getElementById('input-email');
      if (nameEl)  nameEl.value  = profile.full_name  || '';
      if (classEl) classEl.value = profile.class_name || '';
      if (emailEl) emailEl.value = profile.email      || '';
    }
  })();

  async function saveProfile() {
    if (!_session) return;

    var full_name  = (document.getElementById('input-name')?.value  || '').trim();
    var class_name = (document.getElementById('input-class')?.value || '').trim();

    if (!full_name) {
      window.showToast('Nama tidak boleh kosong.', 'error');
      return;
    }

    var btn = document.getElementById('btn-save');
    if (btn) { btn.disabled = true; btn.textContent = 'Menyimpan...'; }

    var result = await window._sb
      .from('profiles')
      .update({ full_name: full_name, class_name: class_name })
      .eq('id', _session.user.id);

    if (btn) { btn.disabled = false; btn.textContent = 'Simpan Perubahan'; }

    if (result.error) {
      window.showToast('Gagal menyimpan: ' + result.error.message, 'error');
      return;
    }

    // Perbarui localStorage agar topbar langsung terupdate
    localStorage.setItem('etno_user_name', full_name);
    localStorage.setItem('etno_user_class', class_name);

    var topbarNameEl = document.querySelector('.app-profile-name');
    if (topbarNameEl) topbarNameEl.textContent = full_name;

    window.showToast('Profil berhasil disimpan!');
  }

  window.saveProfile = saveProfile;
})();
