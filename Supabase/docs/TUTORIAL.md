# TUTORIAL LENGKAP — Supabase & Resend (KANUM)

Ini **satu-satunya** panduan yang Anda butuhkan. Mencakup semuanya: migrasi
database, URL config, template email, SMTP Resend, sampai pengujian akhir.
Ikuti urut dari atas ke bawah. Total ±30 menit.

**Prasyarat:**
- Project Supabase `vantlmdcqziaccglfayb` aktif
- Aplikasi jalan di `http://localhost:3000` (`npm run dev`)
- File `.env` berisi `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Peta langkah:**

| Tahap | Isi | Waktu |
|-------|-----|-------|
| 1 | Jalankan migrasi database (2 file SQL) | 5 mnt |
| 2 | URL Configuration | 2 mnt |
| 3 | Template email verifikasi & reset | 3 mnt |
| 4 | Akun + API key Resend | 3 mnt |
| 5 | (Opsional) Verifikasi domain | tunggu DNS |
| 6 | SMTP Settings di Supabase ⭐ | 3 mnt |
| 7 | Rate limit email | 1 mnt |
| 8 | Uji end-to-end 4 alur | 8 mnt |
| 9 | Kalau macet: troubleshooting | — |

---

# TAHAP 1 — Migrasi Database (WAJIB, jalankan sekali)

Database KANUM butuh 2 migrasi berurutan. Keduanya idempotent — kalau
dijalankan dua kali tidak akan merusak apa pun.

1. Buka **https://supabase.com/dashboard** → login.
2. Klik project **KANUM** (`vantlmdcqziaccglfayb`).
3. Sidebar kiri → ikon terminal **SQL Editor**.
4. Klik **New query** (kanan atas).
5. Buka file `Supabase/000_rebuild.sql` di VS Code → **Ctrl+A → Ctrl+C**
   (salin SEMUA isinya).
6. Tempel di kotak query Supabase → klik **Run** (atau Ctrl+Enter).
7. Tunggu. Bawah kotak muncul `Success. No rows returned` — itu **berhasil**.
8. Klik **New query** lagi → ulangi langkah 5–7 dengan
   `Supabase/001_multi_role.sql`.

**✅ Verifikasi cepat:** sidebar kiri → ikon tabel **Table Editor** → pastikan
ada tabel: `profiles, exercises, questions, question_options,
exercise_attempts, student_answers, student_progress, materi, budaya,
classes, class_members`.
Di Table Editor → klik tabel `profiles` → kolom **role** boleh berisi
`admin`, `teacher`, atau `student`.

> ❗ Error `relation "public.class_members" does not exist` berarti Anda
> menjalankan versi lama file. Ambil versi terbaru dari repo dan jalankan ulang.

---

# TAHAP 2 — URL Configuration (WAJIB)

Tanpa langkah ini, SEMUA link dari email akan ditolak Supabase.

1. Sidebar kiri → ikon perisai **Authentication**.
2. Baris tab atas → klik **URL Configuration**.
3. **Site URL** → isi:
   ```
   http://localhost:3000
   ```
4. Bagian **Redirect URLs** → klik **Add URL** untuk TAMBAHKAN keempat URL ini
   (satu per satu; tempel → Enter):
   ```
   http://localhost:3000/auth/confirm
   http://localhost:3000/auth/callback
   http://localhost:3000/auth/reset
   http://localhost:3000/daftar
   ```
5. Hapus URL lain/lama (ikon tempat sampah) supaya daftar bersih.
6. Klik **Save changes**.

**✅ Tanda berhasil:** Site URL = `http://localhost:3000`, daftar Redirect
URLs berisi tepat 4 URL di atas.

> Saat deploy produksi nanti: tambahkan juga `https://domain-anda.com/auth/confirm`
> dst., dan ubah Site URL.

---

# TAHAP 3 — Template Email (disarankan)

## 3.1 — Template "Confirm signup"

1. Masih di **Authentication** → tab **Emails**.
2. Klik **Templates** → pilih **Confirm signup**.
3. Hapus seluruh HTML bawaan di kotak kiri, ganti dengan:

```html
<h2>Selamat datang di KANUM 👋</h2>
<p>Klik tombol di bawah untuk mengaktifkan akun Anda:</p>
<p>
  <a href="{{ .ConfirmationURL }}"
     style="background:#1b4332;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
    Aktifkan Akun
  </a>
</p>
<p>Atau salin tautan ini ke browser:<br />{{ .ConfirmationURL }}</p>
<p style="color:#888;font-size:12px;">
  Tautan berlaku 24 jam dan hanya bisa dipakai sekali.
  Abaikan email ini jika Anda tidak merasa mendaftar.
</p>
```

4. Klik **Save**.

> ⚠️ `{{ .ConfirmationURL }}` JANGAN dihapus — di situlah link verifikasi.

## 3.2 — Template "Reset Password"

1. Masih di daftar Templates → klik **Reset Password**.
2. Ganti isinya dengan kode yang sama persis seperti di atas, hanya ubah:
   - Judul: `Atur Ulang Kata Sandi KANUM`
   - Teks tombol: `Atur Ulang Kata Sandi`
3. Klik **Save**.

**✅ Tanda berhasil:** pratinjau di kanan menampilkan tombol hijau KANUM.

---

# TAHAP 4 — Akun & API Key Resend (±3 menit)

1. Tab browser baru → **https://resend.com** → **Sign Up**.
2. Pilih **Continue with Google** (tercepat) atau daftar via email.
3. ⚠️ **PENTING:** gunakan email yang benar-benar Anda pantau. Selama domain
   belum diverifikasi (Tahap 5), hanya email inilah yang bisa menerima email uji.
4. Setelah masuk: sidebar kiri → **API Keys**.
5. Klik **Create API Key**.
6. Isi form:
   - **Name:** `supabase-kanum`
   - **Permission:** `Full access`
7. Klik **Create**.
8. **SEGERA salin** key yang tampil — formatnya `re_........................`.
   - Klik ikon copy di samping key.
   - Tempel sementara di Notepad.
   - ⚠️ Key **hanya tampil satu kali** — kalau hilang, buat key baru saja.

**✅ Tanda berhasil:** 1 key bernama `supabase-kanum` di daftar, dan Anda
pegang nilainya di Notepad.

---

# TAHAP 5 — (Opsional) Verifikasi Domain di Resend

> **Lewati dulu** kalau baru testing sendiri (Tahap 4 sudah cukup).
> **WAJIB** sebelum aplikasi dipakai siswa/guru — tanpa ini Resend menolak
> kirim ke email di luar milik Anda.

1. Di Resend: sidebar → **Domains** → **Add Domain**.
2. Ketik domain Anda, mis. `kanum.sch.id` → **Add**.
3. Resend menampilkan daftar record DNS (SPF, DKIM, DMARC). **Biarkan tab
   ini terbuka.**
4. Buka tab baru: dashboard DNS domain Anda:
   - **Cloudflare:** pilih domain → DNS → Records → Add record
   - **cPanel:** Domain → Zone Editor → Manage
   - **Registrar lain:** cari menu DNS Management
5. Tambahkan SEMUA record persis seperti ditampilkan Resend:
   - Type `TXT`, Name sesuai tampilan (mis. `resend._domainkey`), Value = string panjang dari Resend
   - Type `TXT`, Name `@` (root), Value = SPF `v=spf1 include:...`
   - Type `TXT`, Name `_dmarc`, Value = DMARC (kalau diminta)
6. Kembali ke tab Resend → klik **Verify**.
7. Status berubah **Pending → Verified** (5 menit – beberapa jam; klik
   refresh sesekali).

**✅ Tanda berhasil:** badge hijau **Verified** di baris domain.

---

# TAHAP 6 — SMTP Settings di Supabase ⭐ (inti)

1. Kembali ke tab **Supabase** → **Authentication** → tab **Emails** →
   klik **SMTP Settings**.
2. Toggle **Enable Custom SMTP** → **ON**. (Muncul dialog peringatan →
   klik **Confirm** / **I understand**.)
3. Isi form PERSIS seperti ini:

   | Field | Nilai |
   |---|---|
   | **Sender email** | `onboarding@resend.dev` — tanpa domain. Setelah Tahap 5 Verified: ganti jadi `noreply@domain-anda.com` |
   | **Sender name** | `KANUM` |
   | **Host** | `smtp.resend.com` |
   | **Port number** | `465` |
   | **Username** | `resend` |
   | **Password** | `re_...` — API key dari Tahap 4 |
   | **Minimum interval between emails** | `60` |

4. Gulir ke bawah → klik **Save changes**.
5. **Tekan F5 (refresh)** → buka lagi SMTP Settings.
6. ⚠️ Kotak **Password** terlihat KOSONG setelah refresh — itu **NORMAL**
   (Supabase menyimpannya tersembunyi). Jangan isi ulang.

**✅ Tanda berhasil:** toggle ON bertahan setelah refresh, tanpa pesan galat.

> 💡 Alternatif tanpa copy-paste: sidebar Supabase → **Integrations** →
> **Resend** → Connect — API key dan SMTP terisi otomatis. Nama pengirim tetap
> diisi manual seperti tabel di atas.

---

# TAHAP 7 — Naikkan Rate Limit Email

Batas jam Supabase berlaku TERPISAH dari SMTP — kalau tetap kecil, kirim
ulang batch tetap diblok.

1. **Authentication** → tab **Rate Limits**.
2. Cari baris **"Emails sent per hour"**.
3. Ubah nilainya → `100` (atau maksimum yang diizinkan).
4. Klik **Save**.

**✅ Tanda berhasil:** nilai baru tersimpan tanpa error.

---

# TAHAP 8 — Uji End-to-End (jangan dilewati)

Aplikasi harus jalan: `npm run dev` → http://localhost:3000

**Aturan penerima email:**
- Domain BELUM diverifikasi (Tahap 5 dilewati) → pakai **persis email akun
  Resend Anda**.
- Domain SUDAH Verified → email apa pun boleh.

## Uji 1 — Daftar + Verifikasi Email
1. Buka `http://localhost:3000/daftar`.
2. Isi: Nama lengkap, Email, Kata sandi (min 6 karakter), ulangi sandi.
3. Pilih **Siswa** → centang setuju → **Daftar Sekarang**.
4. Anda diarahkan ke halaman **"Cek Email Anda"** (`/cek-email?...`).
5. Buka inbox → cari pengirim **KANUM** → tidak ada? Cek **Spam/Promosi**.
6. Klik tombol **Aktifkan Akun**.
7. **✅** Browser mendarat di `/dashboard`, sudah login.

## Uji 2 — Kirim Ulang (bukti tanpa 429)
1. Logout → `/login` → masuk dengan akun yang BELUM terverifikasi
   (atau daftar akun lain).
2. Di `/cek-email` klik **Kirim Ulang Email Verifikasi**.
3. Tunggu cooldown 60 detik habis → klik lagi 1–2 kali.
4. **✅** Semua terkirim, email masuk lagi, TIDAK ada pesan galat 429.

## Uji 3 — Lupa Kata Sandi
1. `/login` → klik **Lupa kata sandi?**
2. Isi email terdaftar → **Kirim Tautan Reset**.
3. Halaman sukses tampil → cek inbox → klik **Atur Ulang Kata Sandi**.
4. Isi sandi baru 2× → **Simpan Kata Sandi Baru**.
5. **✅** Otomatis masuk ke dashboard sesuai peran.

## Uji 4 — Google (bonus, tidak pakai email)
1. `/daftar` → pilih role (Siswa/Guru) → **Daftar dengan Google**.
2. Pilih akun Google → setuju.
3. **✅** Kembali ke aplikasi, masuk sesuai role: siswa → `/dashboard`,
   guru → `/guru`.

---

# TAHAP 9 — Troubleshooting

| Gejala | Penyebab & Solusi |
|---|---|
| `429 over_email_send_rate_limit` masih muncul | 1) SMTP Settings belum di-Save / toggle OFF → ulangi Tahap 6. 2) Rate limit per jam masih kecil → ulangi Tahap 7. 3) Kirim ulang < 60 detik → tunggu cooldown. |
| Galat *"You can only send testing emails to your own email address (until you verify your domain)"* | Normal di mode tanpa domain → pakai email akun Resend Anda, atau selesaikan Tahap 5 lalu ganti Sender email di Tahap 6. |
| Email tidak masuk sama sekali | 1) Cek folder Spam/Promosi. 2) Supabase sidebar → **Logs** → **Auth** → lihat error kirim terakhir. 3) Pastikan Sender email cocok dengan status domain. |
| Link verifikasi: *"tidak valid atau sudah pernah dipakai"* | Link sekali pakai / sudah >24 jam → kirim ulang via `/cek-email`. |
| Reset password gagal, verifikasi normal | Redirect URL `/auth/reset` belum ada → ulangi Tahap 2 langkah 4. |
| Klik link malah ke `localhost:3000` padahal akses via HP | Normal di dev — `localhost` hanya di komputer yang sama. Uji di HP nanti setelah deploy. |
| SMTP tidak bisa disimpan | Isi ulang Password dengan `re_...` utuh (tanpa spasi/enter), coba browser lain, pastikan API key masih valid di Resend. |
| Email masuk Spam | Selesaikan Tahap 5 (SPF+DKIM+DMARC Verified), pakai domain sekolah, hindari kata promosi di subjek. |
| Login Google error / kembali ke /login | OAuth Google di Supabase: Authentication → Providers → Google harus ON dengan Client ID/Secret; Redirect `/auth/callback` ada di URL Configuration. |

---

# Lampiran — Cheat Sheet

```
── SQL (Tahap 1) ──────────────────────────────────────
SQL Editor → Run: 000_rebuild.sql → lalu 001_multi_role.sql

── URL (Tahap 2) ──────────────────────────────────────
Site URL       : http://localhost:3000
Redirect URLs  : /auth/confirm  /auth/callback  /auth/reset  /daftar

── SMTP (Tahap 6) ─────────────────────────────────────
Host     : smtp.resend.com     Port : 465
Username : resend              Pass : re_API_KEY
Sender   : onboarding@resend.dev            (testing)
           noreply@domain-anda.com          (setelah domain Verified)
Name     : KANUM               Interval : 60

── Rate (Tahap 7) ─────────────────────────────────────
Emails sent per hour : 100
```

**Peta peran:** `student` → `/dashboard` · `teacher` → `/guru` · `admin` →
`/admin`. Ubah role lewat UI: **Admin → Kelola Akun**.

**Setup Google OAuth** (Authentication → Providers → Google):
1. Buka https://console.cloud.google.com → buat project → **APIs & Services →
   Credentials → Create Credentials → OAuth client ID** (type Web application).
2. Authorized redirect URI:
   `https://vantlmdcqziaccglfayb.supabase.co/auth/v1/callback`
3. Salin Client ID & Client Secret → tempel di Supabase Providers → Google →
   Save.
