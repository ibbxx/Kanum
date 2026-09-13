# Setup Supabase — Alur Verifikasi Email KANUM

Panduan konfigurasi dashboard Supabase agar registrasi → verifikasi email → login
berjalan lancar. Semua langkah dilakukan di [Dashboard Supabase](https://supabase.com/dashboard)
project **vantlmdcqziaccglfayb**.

---

## 1. URL Configuration (WAJIB)

**Authentication → URL Configuration**

| Setting | Nilai |
|---|---|
| **Site URL** | `http://localhost:3000` (dev) / `https://domain-produksi.com` (prod) |
| **Redirect URLs** | `http://localhost:3000/auth/confirm` |
| | `http://localhost:3000/auth/callback` |
| | `http://localhost:3000/auth/reset` |
| | `http://localhost:3000/daftar` (fallback error OAuth) |

> Dev server sekarang **selalu jalan di port 3000** (`npm run dev` sudah di-pin),
> jadi URL di atas tidak berubah-ubah lagi.

---

## 2. Email Template "Confirm signup"

**Authentication → Emails → Templates → Confirm signup**

Template bawaan Supabase sudah memakai `{{ .ConfirmationURL }}` dan akan
otomatis mengarah ke `/auth/confirm` karena URL tersebut ada di daftar Redirect.
Tidak perlu diubah. Contoh template yang lebih rapi jika ingin dipakai:

```html
<h2>Selamat datang di KANUM 👋</h2>
<p>Klik tombol di bawah untuk mengaktifkan akun Anda:</p>
<p><a href="{{ .ConfirmationURL }}" style="background:#1b4332;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;">Aktifkan Akun</a></p>
<p>Atau salin tautan ini ke browser: {{ .ConfirmationURL }}</p>
<p>Tautan berlaku 24 jam. Abaikan email ini jika Anda tidak merasa mendaftar.</p>
```

---

## 3. SMTP Kustom dengan Resend (WAJIB untuk pengiriman lancar)

> **Jawaban singkat: YA, wajib** jika aplikasi akan dipakai orang lain
> (siswa/guru mendaftar sendiri via email biasa). SMTP bawaan dibatasi
> ~2–4 email/jam — cukup hanya untuk 1–2 orang pengujian. Opsional sementara
> jika semua akun dibuat via **Google** (OAuth tidak butuh email verifikasi).

SMTP bawaan Supabase dibatasi **~2–4 email/jam** — verifikasi & reset akan sering
kena `429 over_email_send_rate_limit` saat pengujian. Pasang Resend (gratis
3.000 email/bulan, ±100/hari) supaya tidak dibatasi.

> **Mulai cepat tanpa domain:** pakai sender `onboarding@resend.dev` — tanpa
> verifikasi domain, Resend hanya mengirim ke email akun Resend Anda sendiri
> (cukup untuk solo-testing). Untuk siswa/guru: verifikasi domain dulu
> (bagian 3a langkah 2), lalu ganti sender.
>
> **Tips skala sekolah:** jadikan "Masuk/Daftar dengan Google" jalur utama
> siswa — OAuth tidak memakai kuota email sama sekali.

### 3a. Di Resend (resend.com)

1. Daftar → **API Keys → Create API Key** → salin kunci `re_...` (hanya tampil sekali).
2. **Domains → Add Domain** → masukkan domain Anda (mis. `kanum.sch.id`) → tambahkan
   record DNS (SPF, DKIM) yang ditampilkan → tunggu status **Verified**.
   > Tanpa domain terverifikasi, Resend hanya mengizinkan kirim ke **email akun
   > Resend Anda sendiri** (sender `onboarding@resend.dev`) — cukup untuk tes pribadi,
   > tidak untuk siswa/guru dengan email lain.

### 3b. Di Supabase Dashboard

**Authentication → Emails (section Notifications) → SMTP Settings**

| Setting | Nilai |
|---|---|
| Enable Custom SMTP | **ON** |
| Sender email | `noreply@domain-anda.com` (harus cocok domain terverifikasi di Resend) |
| Sender name | `KANUM` |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | API key Resend Anda (`re_...`) |

Klik **Save**. Semua email auth (verifikasi, reset, magic link) kini lewat Resend.

> Alternatif tanpa copy-paste: **Integrations → Resend** di Supabase (integrasi
> bawaan) membuat API key dan mengisi SMTP otomatis.

### 3c. Naikkan rate limit Supabase (opsional tapi disarankan)

**Authentication → Rate Limits** → naikkan **"Emails sent per hour"** (mis. 100)
agar pengujian batch tidak diblok di sisi Supabase.

### 3d. Troubleshooting

- Email masih tak terkirim → cek **Logs → Auth** di Supabase; error umum:
  sender tidak cocok dengan domain terverifikasi Resend.
- Reset password gagal tapi verifikasi jalan → pastikan Redirect URL
  `/auth/reset` sudah ada di URL Configuration (bagian 1).
- Simpan SMTP gagal / password tak tersimpan → refresh halaman, isi ulang,
  pastikan API key valid di Resend.

---

## 4. Alur Lengkap Setelah Setup

```
Daftar (/daftar)
  └─► signUp + role metadata (student/teacher)
        └─► /cek-email?email=...  ( instruksi + tombol kirim ulang )
              └─► Email berisi link → /auth/confirm?token_hash=...&type=signup
                    └─► verifyOtp → session cookie
                          └─► redirect /dashboard (siswa) | /admin (guru/admin)

Login (/login)
  ├─ email belum verifikasi → toast + redirect /cek-email (bisa kirim ulang)
  ├─ password salah → pesan jelas
  └─ berhasil → /dashboard atau /admin sesuai role

Google OAuth
  └─► /auth/callback?code=... → session → redirect per role
```

---

## 4b. Alur Lupa Kata Sandi

Template **Authentication → Emails → Templates → Reset Password** memakai
`{{ .ConfirmationURL }}` dan otomatis diarahkan ke `/auth/reset` (sudah di
daftar Redirect URL). Alurnya:

```
/lupa-password  →  resetPasswordForEmail (link → /auth/reset)
    └─► /auth/reset?code=... (atau token_hash) → session recovery
          └─► /reset-password  (guard: tanpa session → ditolak)
                └─► updateUser({ password }) → redirect per role
```

Link reset berlaku 1 jam (default Supabase).

### 4c. Daftar dengan Google (alur role guru)

Halaman **Daftar** kini punya tombol "Daftar dengan Google". Pilihan role
(Siswa/Guru) dikirim lewat cookie `kanum-oauth-role` dan diterapkan oleh gate
`/auth/oauth-role` setelah OAuth kembali:

```
/daftar (pilih Guru) → cookie kanum-oauth-role=admin
  └─► Google → /auth/callback?next=/auth/oauth-role
        └─► /auth/oauth-role: buat profil dengan role admin → /admin

/daftar (Siswa) → cookie student → ... → /dashboard
```

Catatan: cookie hanya berpengaruh untuk akun Google yang **baru** (belum punya
profil). Akun lama tetap memakai role tersimpannya — tidak bisa dinaikkan via
cookie.

---

## 5. Sistem 3 Role (Siswa / Guru / Admin)

Mulai migrasi `Supabase/multi_role.sql` (jalankan SETELAH `schema.sql`),
role di database: **`student`** → `/dashboard`, **`teacher`** → `/guru`,
**`admin`** → `/admin`.

- Guru mengelola **kelasnya sendiri** (`/guru/kelas`) dan konten miliknya;
- Guru hanya melihat progres **siswa di kelasnya** (RLS `is_teacher_of`);
- Admin mengelola semua + **Kelola Akun** (`/admin/akun`).

**Review akun admin lama** (dibuat sebelum migrasi — semuanya dianggap admin):

```sql
-- Lihat daftar:
SELECT email, full_name, created_at FROM public.profiles WHERE role = 'admin' ORDER BY created_at;
-- Turunkan yang sebenarnya guru:
UPDATE public.profiles SET role = 'teacher' WHERE email = 'email-guru@domain.com';
```

Setelah itu, ubah role bisa langsung dari UI: **Admin → Kelola Akun**.

---

## 6. Testing Checklist

- [ ] Daftar akun baru → diarahkan ke `/cek-email?email=...`
- [ ] Email verifikasi masuk (cek Spam jika tidak ada)
- [ ] Klik link → diarahkan ke `/dashboard` atau `/admin`
- [ ] Login tanpa verifikasi → toast "Email belum diverifikasi" + redirect `/cek-email`
- [ ] Tombol kirim ulang jalan, cooldown 60 detik
- [ ] Link yang sudah dipakai → pesan "tidak valid / sudah dipakai"
- [ ] Login Google → masuk sesuai role
- [ ] (Setelah SMTP Resend aktif) kirim ulang 3–4× berturut-turut tanpa 429
- [ ] Lupa kata sandi → email reset masuk → sandi baru → masuk otomatis
