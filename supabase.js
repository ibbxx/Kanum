/**
 * KANUM – Supabase Client (shared)
 * Ganti SUPABASE_URL dan SUPABASE_ANON_KEY dengan nilai dari project Supabase Anda.
 * Lihat: Supabase Dashboard → Project Settings → API
 */

const SUPABASE_URL =
  window.ENV_SUPABASE_URL ||
  'https://vantlmdcqziaccglfayb.supabase.co/';

const SUPABASE_KEY =
  window.ENV_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhbnRsbWRjcXppYWNjZ2xmYXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwMjY2MTQsImV4cCI6MjEwNDYwMjYxNH0.aXvU4jBhjDGnUIQ-mQz3wnN0FI-sgZyZhHt5RfGRTik';

const _supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

/** Dapatkan session aktif */
async function getSession() {
  const { data } = await _supabase.auth.getSession();
  return data.session;
}

/** Dapatkan profil user yang sedang login */
async function getCurrentProfile() {
  const session = await getSession();
  if (!session) return null;
  const { data } = await _supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();
  return data;
}

/** Redirect ke halaman login jika belum login */
async function requireAuth(redirectTo = '/login') {
  const session = await getSession();
  if (!session) {
    window.location.href = redirectTo;
    return null;
  }
  return session;
}

/** Redirect jika bukan admin */
async function requireAdmin(redirectTo = '/dashboard') {
  const session = await requireAuth();
  if (!session) return null;
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') {
    window.location.href = redirectTo;
    return null;
  }
  return profile;
}

/** Tampilkan toast notifikasi */
function showToast(message, type = 'success') {
  const existing = document.getElementById('kanum-toast');
  if (existing) existing.remove();

  const color = type === 'success'
    ? 'bg-primary text-on-primary'
    : type === 'error'
      ? 'bg-error text-on-error'
      : 'bg-on-surface text-surface';

  const el = document.createElement('div');
  el.id = 'kanum-toast';
  el.className = `fixed bottom-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-lg font-semibold text-sm transition-all ${color}`;
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

window._sb = _supabase;
window.getSession = getSession;
window.getCurrentProfile = getCurrentProfile;
window.requireAuth = requireAuth;
window.requireAdmin = requireAdmin;
window.showToast = showToast;
