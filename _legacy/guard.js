/**
 * KANUM — Centralized Auth Guard
 * 
 * Cara pakai di setiap halaman HTML:
 * 
 *   <script>window.PAGE_ROLE = 'student';</script>  <!-- atau 'admin' / 'public' -->
 *   <script src="/supabase.js"></script>
 *   <script src="/guard.js"></script>
 * 
 * PAGE_ROLE values:
 *   'public'  — tidak perlu sesi, langsung tampil
 *   'student' — perlu sesi; admin diarahkan ke /admin
 *   'admin'   — perlu sesi + role admin; student diarahkan ke /dashboard
 *   (undefined) — diperlakukan sebagai 'public'
 */
(function () {
  'use strict';

  const role = window.PAGE_ROLE || 'public';

  // Sembunyikan body untuk mencegah flash konten terproteksi
  if (role !== 'public') {
    document.documentElement.style.visibility = 'hidden';
  }

  async function checkAccess() {
    if (role === 'public') return;

    try {
      const { data: { session }, error: sessionErr } = await window._sb.auth.getSession();

      if (sessionErr || !session) {
        window.location.replace('/login');
        return;
      }

      // Ambil profil untuk mengetahui role di database
      const { data: profile, error: profileErr } = await window._sb
        .from('profiles')
        .select('id, full_name, class_name, role')
        .eq('id', session.user.id)
        .single();

      if (profileErr || !profile) {
        window.location.replace('/login');
        return;
      }

      const userRole = profile.role || 'student';

      if (role === 'student') {
        if (userRole === 'admin') {
          window.location.replace('/admin');
          return;
        }
        // Simpan profil ke localStorage agar dashboard.js dan halaman lain bisa membacanya
        try {
          localStorage.setItem('etno_user_name', profile.full_name || '');
          localStorage.setItem('etno_user_class', profile.class_name || '');
        } catch (_) {}
      }

      if (role === 'admin') {
        if (userRole !== 'admin') {
          window.location.replace('/dashboard');
          return;
        }
      }

      // Akses diizinkan — tampilkan halaman
      document.documentElement.style.visibility = '';

    } catch (err) {
      console.warn('[KANUM guard] Gagal memeriksa sesi:', err);
      // Redirect ke login sebagai fallback aman
      window.location.replace('/login');
    } finally {
      // Pastikan visibility selalu dikembalikan (kecuali sudah redirect)
      // Delay kecil untuk menghindari flash jika redirect segera terjadi
      setTimeout(function () {
        document.documentElement.style.visibility = '';
      }, 50);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAccess);
  } else {
    checkAccess();
  }
})();
