# PANDUAN LENGKAP — Supabase × Resend (KANUM)

Tutorial genggam: setiap langkah dijabarkan klik-per-klik, apa yang tampil di
layar, dan cara memastikan langkah itu berhasil. Ikuti urut — total ±20 menit.

**Prasyarat:** project Supabase `vantlmdcqziaccglfayb` aktif; aplikasi jalan di
`http://localhost:3000` (`npm run dev`).

---

## LANGKAH 1 — URL Configuration (WAJIB, ±2 menit)

1. Buka **https://supabase.com/dashboard** → login jika diminta.
2. Klik kartu project **KANUM** (`vantlmdcqziaccglfayb`).
3. Di sidebar kiri, klik ikon perisai **Authentication**.
4. Di baris tab horizontal di atas halaman Authentication, klik **URL Configuration**.
5. Bagian **Site URL** → klik **Edit** / langsung isi kotak teks:
   ```
   http://localhost:3000
   ```
   → klik **Save**.
6. Bagian **Redirect URLs** → klik **Add URL** satu per satu untuk keempat baris ini:
   ```
   http://localhost:3000/auth/confirm
   http://localhost:3000/auth/callback
   http://localhost:3000/auth/reset
   http://localhost:3000/daftar
   ```
   Setiap baris: tempel URL → tekan Enter/Save kecil di sampingnya.
   Hapus URL lain bila ada (klik ikon tempat sampah) supaya daftar bersih.
7. Klik **Save changes** (jika tombolnya muncul di bawah).

**✅ Tanda berhasil:** daftar Redirect URLs menampilkan tepat 4 URL di atas,
Site URL = `http://localhost:3000`.

> Kenapa penting: semua link dari email (verifikasi, reset) dan balikan Google
> ditolak Supabase bila URL-nya tidak ada di daftar ini.

---

## LANGKAH 2 — Template Email "Confirm signup" (±2 menit, opsional tapi disarankan)

1. Masih di **Authentication**, klik tab **Emails**.
2. Klik sub-tab **Templates**.
3. Klik template **Confirm signup**.
4. Kotak editor menampilkan HTML bawaan. Ganti seluruh isinya dengan:
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
   <p style="color:#888;font-size:12px;">Tautan berlaku 24 jam. Abaikan email ini jika Anda tidak merasa mendaftar.</p>
   ```
   > Variabel `{{ .ConfirmationURL }}` WAJIB dipertahankan — Supabase
   > mengisinya dengan link verifikasi yang diarahkan ke `/auth/confirm`.
5. Klik **Save**.
6. (Sambil di sini) klik juga template **Reset Password** → ganti teks
   "Aktifkan Akun" menjadi **"Atur Ulang Kata Sandi"** → Save. Mekanismenya sama.

**✅ Tanda berhasil:** template tersimpan; pratinjau di kanan menampilkan tombol hijau KANUM.

---

## LANGKAH 3A — Buat API Key Resend (±3 menit)

1. Tab baru: buka **https://resend.com** → klik **Sign Up**.
2. Pilih **Continue with Google** (paling cepat) atau email → lengkapi.
   Gunakan **email yang benar-benar Anda pantau** — di Jalur tanpa-domain,
   hanya email inilah yang bisa menerima email uji.
3. Setelah masuk dashboard, klik **API Keys** di sidebar kiri.
4. Klik tombol **Create API Key**.
5. Isi form kecil:
   - Name: `supabase-kanum`
   - Permission: **Full access**
   - Domain: biarkan / pilih yang ada
6. Klik **Create**.
7. **SEGERA salin** key `re_................................` yang tampil.
   - Klik ikon salin di kanan key.
   - Tempel sementara di Notepad — key ini **tidak akan ditampilkan lagi**.

**✅ Tanda berhasil:** ada 1 key di daftar API Keys bernama `supabase-kanum`,
dan Anda menyimpan nilai `re_...`-nya.

---

## LANGKAH 3B — (Opsional sekarang) Verifikasi Domain di Resend

> Lewati dulu jika baru testing sendiri. WAJIB nanti sebelum dipakai siswa/guru.

1. Di Resend, klik **Domains** (sidebar) → **Add Domain**.
2. Masukkan domain Anda (contoh `kanum.sch.id`) → **Add**.
3. Resend menampilkan tabel record DNS. Biarkan tab ini terbuka.
4. Buka pengelola DNS domain Anda (Cloudflare/cPanel/registrar) → tambahkan
   SEMUA record yang diminta (SPF = TXT, DKIM = TXT `resend._domainkey`,
   DMARC jika ditampilkan). Salin persis nama & nilainya.
5. Kembali ke Resend → klik **Verify**.
6. Tunggu status berubah **Pending → Verified** (5 menit – beberapa jam).

**✅ Tanda berhasil:** badge hijau **Verified** di baris domain Anda.

---

## LANGKAH 3C — Isi SMTP Settings di Supabase (±3 menit) ⭐ inti

1. Kembali ke tab **Supabase Dashboard**.
2. **Authentication** → tab **Emails** → klik **SMTP Settings**.
3. Toggle **Enable Custom SMTP** → **ON** (muncul form + peringatan — abaikan).
4. Isi setiap field:

   | Field | Nilai | Catatan |
   |---|---|---|
   | **Sender email** | `onboarding@resend.dev` | Tanpa domain. Setelah domain Verified, ganti `noreply@domain-anda.com` |
   | **Sender name** | `KANUM` | Tampil sebagai nama pengirim |
   | **Host** | `smtp.resend.com` | Persis, tanpa https |
   | **Port number** | `465` | SSL |
   | **Username** | `resend` | Huruf kecil, persis |
   | **Password** | `re_...` | API key dari Langkah 3A |
   | **Minimum interval** | `60` | Biarkan default |

5. Klik **Save changes** di bawah form.
6. **Refresh halaman (F5)** → pastikan toggle masih ON.
   (Kotak Password kosong setelah refresh itu NORMAL — nilainya tersimpan.)

**✅ Tanda berhasil:** toggle ON bertahan setelah refresh, tanpa pesan error.

> Alternatif 1-klik: sidebar Supabase → **Integrations** → **Resend** →
> Connect — API key & SMTP terisi otomatis. Sender name tetap diisi manual.

---

## LANGKAH 3D — Naikkan Rate Limit Email (±1 menit)

1. **Authentication** → tab **Rate Limits**.
2. Temukan baris **"Emails sent per hour"**.
3. Ubah nilainya menjadi `100` (atau maksimum yang diizinkan).
4. Klik **Save**.

> Batas ini berlaku TERPISAH dari SMTP — meski sudah pakai Resend, angka
> kecil di sini tetap bisa memblokir kirim ulang batch.

**✅ Tanda berhasil:** nilai baru tersimpan tanpa error.

---

## LANGKAH 4 — UJI END-TO-END (±5 menit) — jangan dilewati

Aplikasi: `npm run dev` → **http://localhost:3000**. Siapkan email penerima:

- **Tanpa domain (Jalur cepat):** gunakan persis **email akun Resend Anda**.
- **Dengan domain Verified:** email apa pun boleh.

### Uji 1 — Daftar + Verifikasi
1. Buka `http://localhost:3000/daftar`.
2. Isi: Nama lengkap, Email (sesuai jalur di atas), Kata sandi (min 6),
   ulangi sandi → pilih **Siswa** → centang persetujuan → **Daftar Sekarang**.
3. Harus diarahkan ke halaman **"Cek Email Anda"** (alamat `/cek-email?...`).
4. Buka inbox → cari email dari **KANUM** → (tak ada? cek Spam/Promosi).
5. Klik tombol **Aktifkan Akun** di email.
6. Browser mendarat otomatis di **`/dashboard`** dan sudah login. ✅

### Uji 2 — Kirim ulang tanpa 429
1. Logout → daftar lagi dengan email lain milik Anda (atau /login pakai
   akun belum terverifikasi → otomatis dilempar ke /cek-email).
2. Di `/cek-email` klik **"Kirim Ulang Email Verifikasi"**.
3. Setelah cooldown 60 detik selesai, klik lagi 1–2×.
4. Semua pengiriman berhasil, email masuk lagi. ✅

### Uji 3 — Lupa Kata Sandi
1. `/login` → klik **"Lupa kata sandi?"**.
2. Isi email terdaftar → **Kirim Tautan Reset**.
3. Halaman sukses tampil → cek inbox → klik **Atur Ulang Kata Sandi**.
4. Isi sandi baru 2× → **Simpan** → otomatis masuk dashboard. ✅

### Uji 4 — Google (bonus, tanpa email)
1. `/daftar` → pilih role → **Daftar dengan Google** → pilih akun Google.
2. Kembali ke aplikasi → masuk sesuai role (siswa → `/dashboard`,
   guru → `/guru`). ✅

---

## LANGKAH 5 — Troubleshooting Cepat

| Gejala | Solusi |
|---|---|
| Masih `429 over_email_send_rate_limit` | 1) SMTP Settings belum di-Save/toggle OFF — ulangi 3C. 2) Rate limit per jam masih kecil — ulangi 3D. 3) Kirim ulang <60 detik — tunggu cooldown. |
| Galat *"You can only send testing emails to your own email address..."* | Jalur tanpa-domain — pakai email akun Resend Anda, atau selesaikan Langkah 3B lalu ganti Sender email. |
| Email tak kunjung masuk | Cek Spam/Promosi → **Logs → Auth** di Supabase (sidebar, ikon garis) → lihat error kirim terakhir. |
| Tautan email "tidak valid / sudah dipakai" | Link sekali pakai / >24 jam — minta kirim ulang via `/cek-email`. |
| Reset password gagal, verifikasi normal | Redirect URL `/auth/reset` kurang — ulangi Langkah 1 langkah 6. |
| SMTP tak bisa disimpan | Isi ulang Password dengan `re_...` utuh (tanpa spasi/baris baru), coba browser lain. |
| Email masuk Spam | Selesaikan domain Verified + DMARC (Langkah 3B); gunakan domain sekolah. |

---

## Ringkasan Nilai (copy-paste)

```
Site URL        : http://localhost:3000
Redirect URLs   : /auth/confirm  /auth/callback  /auth/reset  /daftar
SMTP Host       : smtp.resend.com
SMTP Port       : 465
SMTP Username   : resend
SMTP Password   : re_API_KEY_ANDA
Sender (tes)    : onboarding@resend.dev
Sender (prod)   : noreply@domain-anda.com   ← setelah domain Verified
Sender name     : KANUM
Rate/hour       : 100
```

## Peta Alur (referensi)

```
DAFTAR EMAIL   /daftar → signUp → /cek-email → email → /auth/confirm → session → /dashboard | /guru
LOGIN          /login → signInWithPassword → per role  (belum verifikasi → /cek-email)
LUPA SANDI     /lupa-password → email → /auth/reset → /reset-password → sandi baru → auto-login
GOOGLE         /daftar (pilih role) → Google → /auth/callback?next=/auth/oauth-role → per role
ROLE           student=/dashboard  teacher=/guru  admin=/admin  (ubah via Admin→Kelola Akun)
```

Selesai semua ✅ → sistem email KANUM siap dipakai. Dokumen pendukung:
`EMAIL_SETUP.md` (ringkas), `RESEND_TUTORIAL.md` (fokus Resend),
`../001_multi_role.sql` (migrasi DB tiga peran — jalankan di SQL Editor bila belum).
