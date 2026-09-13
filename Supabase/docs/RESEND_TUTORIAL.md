# Tutorial Lengkap: Resend SMTP × Supabase (KANUM)

Panduan ini membuat email verifikasi pendaftaran & reset kata sandi terkirim
lancar tanpa limit ~2–4 email/jam bawaan Supabase. Ikuti berurutan — selesai
sekitar **10 menit** (tanpa domain) atau **±30 menit** (dengan domain).

---

## Bagian A — Buat Akun & API Key Resend (±3 menit)

1. Buka **https://resend.com** → klik **Sign Up**
   (bisa login cepat pakai GitHub atau Google).
2. Setelah masuk dashboard, buka menu **API Keys** (sidebar kiri).
3. Klik **Create API Key**:
   - Name: `supabase-kanum`
   - Permission: **Full access** (default) — SMTP butuh izin kirim
   - Klik **Create**
4. **Salin API key** yang muncul (format `re_............`).
   ⚠️ Key hanya ditampilkan **satu kali** — simpan di tempat aman dulu.

✅ Checklist: saya punya API key `re_...`

---

## Bagian B — Pilih Jalur Pengirim (pilih SATU)

### Jalur 1: Cepat, TANPA domain (untuk testing sendiri) ← rekomendasi sekarang

Tanpa domain terverifikasi, Resend memakai pengirim bawaan
**`onboarding@resend.dev`**, dengan batasan:

> ⚠️ Email hanya bisa dikirim ke **alamat email milik akun Resend Anda**
> (email yang Anda pakai daftar Resend). Ke email lain akan ditolak.

Cocok untuk: menguji sendiri alur daftar → verifikasi → reset.
**Tidak perlu melakukan apa pun di bagian ini** — langsung ke Bagian C.

### Jalur 2: Dengan domain sendiri (WAJIB untuk dipakai siswa/guru)

Agar email bisa dikirim ke email siapa pun (dan tidak masuk Spam):

1. Di dashboard Resend, buka **Domains → Add Domain**.
2. Masukkan domain Anda, contoh: `kanum.sch.id` atau `namasekolah.or.id`
   (pakai domain sekolah/yayasan jika ada — jangan domain gratisan).
3. Resend menampilkan **record DNS** yang harus ditambahkan:
   - **SPF** (record TXT)
   - **DKIM** (record TXT `resend._domainkey`)
   - **DMARC** (opsional tapi disarankan)
4. Buka panel DNS domain Anda (Cloudflare/NIcxx/domain registrar masing-masing)
   → tambahkan record tersebut persis seperti ditampilkan.
   - Catatan Cloudflare: matikan dulu **proxy (awan oranye)** untuk record TXT
     — TXT tidak diproxy sih, tapi pastikan statusnya "DNS only".
5. Kembali ke Resend → klik **Verify**. Status berubah jadi **Verified**
   setelah DNS menyebar (5 menit – beberapa jam).
6. Catat domain terverifikasi — dipakai di Bagian C (sender email).

✅ Checklist: domain saya statusnya **Verified** di Resend

---

## Bagian C — Pasang SMTP di Supabase (±3 menit)

1. Buka **https://supabase.com/dashboard** → project **KANUM**
   (`vantlmdcqziaccglfayb`).
2. Sidebar kiri: **Authentication** (ikon perisai) → tab **Emails**
   (di bawah grup *Notifications*) → pilih **SMTP Settings**.
3. Isi formulir persis seperti ini:

   | Field | Isi |
   |---|---|
   | **Enable Custom SMTP** | ON (toggle) |
   | **Sender email** | Jalur 1: `onboarding@resend.dev` · Jalur 2: `noreply@domain-anda.com` |
   | **Sender name** | `KANUM` |
   | **Host** | `smtp.resend.com` |
   | **Port** | `465` |
   | **Username** | `resend` (huruf kecil, persis) |
   | **Password** | API key dari Bagian A: `re_...` |
   | **Minimum interval between emails** | `60` (detik, biarkan default) |

4. Klik **Save changes**.
5. **Refresh halaman** dan cek: toggle masih ON? Password kadang tampil kosong
   setelah refresh — itu normal (tersimpan tersembunyi).

✅ Checklist: SMTP Settings tersimpan, toggle ON

> 💡 Alternatif tanpa copy-paste: **Integrations → Resend** di sidebar Supabase
> (integrasi resmi) — membuat API key dan mengisi SMTP otomatis. Nama pengirim
> tetap diisi manual seperti tabel di atas.

---

## Bagian D — Naikkan Rate Limit Supabase (±1 menit, disarankan)

Batas "email per jam" Supabase **tetap berlaku** meski SMTP sudah custom,
jadi sekalian dinaikkan:

1. Masih di **Authentication** → tab **Rate Limits**.
2. Cari baris **"Emails sent per hour"** → ubah nilainya (mis. `100`,
   atau maksimum yang diizinkan tier Anda).
3. Klik **Save**.

---

## Bagian E — Uji Coba Sampai Selesai (±5 menit)

Pastikan dulu URL Configuration sudah benar
(**Authentication → URL Configuration**):

- Site URL: `http://localhost:3000`
- Redirect URLs: `http://localhost:3000/auth/confirm`, `/auth/callback`,
  `/auth/reset`, `/daftar`

Lalu jalankan aplikasi (`npm run dev` → http://localhost:3000) dan uji 3 alur:

### E1. Verifikasi Pendaftaran
1. Buka `/daftar` → isi nama + **email milik akun Resend Anda** (Jalur 1)
   atau email siapa pun (Jalur 2) → pilih Siswa → centang setuju → Daftar.
2. Anda diarahkan ke `/cek-email`. Buka inbox email → cari pengirim **KANUM**.
3. Klik tombol di email → harus mendarat di **`/dashboard`** (sudah login).
4. Coba juga tombol **"Kirim Ulang Email Verifikasi"** di `/cek-email` —
   kirim ulang ke-2 dan ke-3 harus tetap sukses (tidak ada 429).

### E2. Login Siswa & Guru
1. Logout → `/login` → masuk dengan akun tadi → masuk ke `/dashboard`.
2. Daftar satu akun lagi pilih **Guru** → setelah verifikasi masuk ke **`/guru`**.

### E3. Lupa Kata Sandi
1. `/login` → klik **"Lupa kata sandi?"** → isi email → kirim.
2. Cek inbox → klik tautan → halaman **"Atur Ulang Kata Sandi"** muncul.
3. Isi sandi baru → Simpan → otomatis masuk ke dashboard sesuai peran.

✅ Checklist: ketiga alur sukses, tidak ada galat 429

---

## Bagian F — Troubleshooting

| Gejala | Penyebab & Solusi |
|---|---|
| Masih `429 over_email_send_rate_limit` | (1) SMTP belum di-Save / toggle OFF; (2) Rate limit "Emails per hour" masih 2 — naikkan (Bagian D); (3) kirim ulang dalam <60 detik — tunggu interval minimum |
| Galat *"You can only send testing emails to your own email address (until you verify your domain)"* | Normal di Jalur 1 — tes hanya dengan email akun Resend Anda, atau selesaikan verifikasi domain (Jalur 2) |
| Email tidak masuk sama sekali | Cek **Spam/Promosi**; cek **Logs → Auth** di Supabase untuk error kirim; pastikan Sender email cocok dengan domain terverifikasi |
| SMTP gagal disimpan / password kosong terus | Isi ulang API key (pastikan `re_...` lengkap tanpa spasi), ganti browser/refresh |
| Email masuk Spam | Tambahkan record **DMARC**, pastikan SPF+DKIM Verified, gunakan domain sekolah, hindari kata spam di subject |
| Tautan verifikasi dibuka → "tidak valid" | Link sudah pernah dipakai (sekali pakai) atau >24 jam — pakai kirim ulang di `/cek-email` |
| Ganti pengirim di Supabase tapi email lama tampil | Tidak ada — pastikan Save sukses; pengirim berubah langsung untuk email berikutnya |

**Cek log kirim:** Supabase → **Logs → Auth** — setiap percobaan kirim email
tercatat di sini beserta error SMTP dari Resend.

---

## Ringkasan Nilai Konfigurasi (copy-paste cepat)

```
Host      : smtp.resend.com
Port      : 465
Username  : resend
Password  : re_API_KEY_ANDA
Sender    : onboarding@resend.dev        ← testing tanpa domain
            noreply@domain-anda.com      ← setelah domain Verified
Name      : KANUM
```

---

*Setelah Bagian E lulus semua, sistem email KANUM siap produksi.*
*Dokumen terkait: `EMAIL_SETUP.md` (URL config, template email, alur role),*
*`../001_multi_role.sql` (migrasi database tiga peran).*
