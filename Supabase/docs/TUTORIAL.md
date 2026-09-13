# TUTORIAL LENGKAP — Supabase & Resend (KANUM)

> **Status Anda:** ✅ Migrasi database selesai · 🌐 Produksi: **https://kanum-nine.vercel.app**
>
> Berarti **Tahap 1 sudah dilewati**. Mulai langsung dari **TAHAP 2**.
> Total sisa pekerjaan: **±15 menit**.

---

# TAHAP 2 — URL Configuration (WAJIB — pakai domain Vercel Anda)

Tanpa ini, semua link email ditolak Supabase.

1. Buka **https://supabase.com/dashboard** → project **KANUM** (`vantlmdcqziaccglfayb`).
2. Sidebar kiri → ikon perisai **Authentication**.
3. Tab atas → **URL Configuration**.
4. **Site URL** → ganti menjadi:
   ```
   https://kanum-nine.vercel.app
   ```
   > Karena aplikasi Anda sudah live di Vercel, jadikan **domain produksi** sebagai
   > Site URL (bukan localhost). Pengujian lokal tetap bisa — lihat catatan di bawah.
5. **Redirect URLs** → **Add URL** satu per satu, tambahkan KEDUA set ini:

   **Produksi (utama):**
   ```
   https://kanum-nine.vercel.app/auth/confirm
   https://kanum-nine.vercel.app/auth/callback
   https://kanum-nine.vercel.app/auth/reset
   https://kanum-nine.vercel.app/daftar
   ```

   **Development (agar bisa uji di laptop juga):**
   ```
   http://localhost:3000/auth/confirm
   http://localhost:3000/auth/callback
   http://localhost:3000/auth/reset
   http://localhost:3000/daftar
   ```
6. Hapus URL lama yang tidak dipakai (ikon tempat sampah).
7. Klik **Save changes**.

**✅ Tanda berhasil:** 8 Redirect URLs (4 produksi + 4 dev) tersimpan tanpa error.

> **Dev vs Produksi:** link email di-generate ke **Site URL**. Dengan Site URL
> produksi, email selalu membuka `kanum-nine.vercel.app` — aman, karena halaman
> yang sama sudah ter-deploy di sana. Uji dari laptop tetap berfungsi: browser
> Anda membuka domain produksi, bukan localhost.

---

# TAHAP 3 — Template Email (disarankan)

## 3.1 — "Confirm signup"

1. **Authentication** → tab **Emails** → **Templates** → klik **Confirm signup**.
2. Hapus seluruh HTML bawaan, ganti:

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

3. **Save**. ⚠️ Jangan hapus `{{ .ConfirmationURL }}`.

## 3.2 — "Reset Password"

1. Templates → klik **Reset Password**.
2. Ganti isinya sama dengan kode di atas, hanya ubah:
   - Judul → `Atur Ulang Kata Sandi KANUM`
   - Teks tombol → `Atur Ulang Kata Sandi`
3. **Save**.

---

# TAHAP 4 — Akun & API Key Resend (±3 menit)

1. Tab baru → **https://resend.com** → **Sign Up** → **Continue with Google**.
2. ⚠️ Gunakan email yang benar-benar Anda pantau — sampai domain diverifikasi
   (Tahap 5), hanya email inilah yang bisa menerima email uji.
3. Sidebar → **API Keys** → **Create API Key**:
   - Name: `supabase-kanum` · Permission: `Full access` → **Create**
4. **SEGERA salin** key `re_............` (ikon copy) → simpan di Notepad.
   ⚠️ Hanya tampil **satu kali**. Hilang? Buat key baru saja.

---

# TAHAP 5 — Verifikasi Domain (opsional untuk solo-test, WAJIB sebelum dipakai publik)

> Tanpa domain: Resend hanya kirim ke **email akun Resend Anda**. Untuk
> siswa/guru dengan email lain → wajib tahap ini.

1. Resend → **Domains** → **Add Domain**.
2. Domain Vercel **tidak bisa** dipakai kirim email (subdomain `vercel.app`
   milik Vercel — Anda tidak pegang DNS-nya). Gunakan **domain milik Anda
   sendiri** (mis. `kanum.sch.id`). Belum punya? Beli domain murah
   (Cloudflare/NIcxx/Rumahweb ±Rp100–200rb/tahun).
3. Ketik domain → **Add** → Resend menampilkan record DNS (SPF, DKIM, DMARC).
4. Buka DNS domain Anda (Cloudflare/cPanel/registrar) → tambahkan SEMUA record
   persis seperti ditampilkan.
5. Kembali ke Resend → **Verify** → tunggu status **Verified** (5 mnt – jam).

**✅ Tanda berhasil:** badge hijau **Verified**.

---

# TAHAP 6 — SMTP Settings di Supabase ⭐ (inti)

1. **Authentication** → tab **Emails** → **SMTP Settings**.
2. **Enable Custom SMTP** → ON → confirm dialog.
3. Isi:

   | Field | Nilai |
   |---|---|
   | **Sender email** | `onboarding@resend.dev` — sementara (testing). Setelah Tahap 5 Verified → `noreply@domain-anda.com` |
   | **Sender name** | `KANUM` |
   | **Host** | `smtp.resend.com` |
   | **Port number** | `465` |
   | **Username** | `resend` |
   | **Password** | `re_...` — API key Tahap 4 |
   | **Minimum interval between emails** | `60` |

4. **Save changes**.
5. **F5 (refresh)** → buka lagi SMTP Settings.
   ⚠️ Kotak Password kosong setelah refresh itu **NORMAL** — tersimpan tersembunyi.

**✅ Tanda berhasil:** toggle ON bertahan setelah refresh.

> 💡 Alternatif 1-klik: sidebar → **Integrations** → **Resend** → Connect.

---

# TAHAP 7 — Naikkan Rate Limit Email

**Authentication** → tab **Rate Limits** → **"Emails sent per hour"** → `100`
(atau maksimum) → **Save**.

> Tetap perlu meski SMTP sudah custom — batas ini berdiri sendiri.

---

# TAHAP 8 — Uji End-to-End (ujilah di DOMAIN PRODUKSI Anda)

Karena aplikasi sudah live, ujilah langsung di
**https://kanum-nine.vercel.app** — hasilnya sama dengan lokal, tapi lebih
nyata (bisa dibuka dari HP juga).

**Aturan penerima:**
- Domain BELUM diverifikasi (Tahap 5 dilewati) → pakai **persis email akun Resend**.
- Domain sudah Verified → email apa pun.

## Uji 1 — Daftar + Verifikasi
1. Buka `https://kanum-nine.vercel.app/daftar`.
2. Nama, email, sandi (min 6), ulangi → pilih **Siswa** → centang setuju →
   **Daftar Sekarang**.
3. Mendarat di halaman **"Cek Email Anda"**.
4. Inbox → pengirim **KANUM** → (kosong? cek Spam/Promosi) → klik **Aktifkan Akun**.
5. **✅** Mendarat di `/dashboard`, sudah login.

## Uji 2 — Kirim Ulang (bukti tanpa 429)
1. Daftar akun lain (belum verifikasi) → masuk ke `/cek-email`.
2. Klik **Kirim Ulang Email Verifikasi** → tunggu cooldown 60 detik → klik lagi.
3. **✅** Terkirim semua, tanpa galat 429.

## Uji 3 — Lupa Kata Sandi
1. `/login` → **Lupa kata sandi?** → isi email → **Kirim Tautan Reset**.
2. Inbox → klik **Atur Ulang Kata Sandi** → isi sandi baru 2× → **Simpan**.
3. **✅** Otomatis masuk dashboard sesuai peran.

## Uji 4 — Google
1. `/daftar` → pilih role → **Daftar dengan Google** → pilih akun.
2. **✅** Masuk sesuai role: siswa → `/dashboard`, guru → `/guru`.

> ⚠️ **Google OAuth + domain baru:** kalau Google login error setelah pindah ke
> domain produksi, buka Google Cloud Console → Credentials → OAuth client Anda →
> tambahkan ke **Authorized redirect URIs**:
> `https://vantlmdcqziaccglfayb.supabase.co/auth/v1/callback` (yang ini biasanya
> sudah ada) — dan di Supabase pastikan `/auth/callback` produksi ada di Redirect
> URLs (Tahap 2 sudah mencakup).

---

# TAHAP 9 — Troubleshooting

| Gejala | Solusi |
|---|---|
| `429 over_email_send_rate_limit` | 1) SMTP belum Save/toggle OFF → Tahap 6. 2) Rate limit masih kecil → Tahap 7. 3) Kirim ulang <60 dtk → tunggu cooldown. |
| *"You can only send testing emails to your own email address..."* | Mode tanpa domain → pakai email akun Resend Anda, atau selesaikan Tahap 5 lalu ganti Sender (Tahap 6). |
| Email tak masuk | Cek Spam/Promosi → **Logs → Auth** di Supabase → lihat error kirim. |
| Link verifikasi "tidak valid / sudah dipakai" | Sekali pakai / >24 jam → kirim ulang via `/cek-email`. |
| Link membuka localhost dari HP | Site URL masih `http://localhost:3000` → ganti ke `https://kanum-nine.vercel.app` (Tahap 2 langkah 4). |
| SMTP tak bisa disimpan | Isi ulang Password `re_...` utuh, coba browser lain, cek key valid di Resend. |
| Email masuk Spam | Selesaikan Tahap 5 (SPF+DKIM+DMARC), pakai domain sendiri, hindari kata promosi. |
| Login Google gagal di produksi | Cek kotak ⚠️ Google OAuth di Tahap 8. |

---

# Lampiran — Cheat Sheet (nilai siap-copy)

```
── Situs ──────────────────────────────────────────────
Produksi : https://kanum-nine.vercel.app
Dev      : http://localhost:3000

── URL Configuration ──────────────────────────────────
Site URL      : https://kanum-nine.vercel.app
Redirect URLs : https://kanum-nine.vercel.app/auth/confirm
                https://kanum-nine.vercel.app/auth/callback
                https://kanum-nine.vercel.app/auth/reset
                https://kanum-nine.vercel.app/daftar
                (+ 4 padanan http://localhost:3000/... untuk dev)

── SMTP ───────────────────────────────────────────────
Host     : smtp.resend.com   Port : 465
Username : resend            Pass : re_API_KEY
Sender   : onboarding@resend.dev          (testing)
           noreply@domain-anda.com        (setelah domain Verified)
Name     : KANUM             Interval : 60

── Rate ───────────────────────────────────────────────
Emails sent per hour : 100

── OAuth Google ───────────────────────────────────────
Authorized redirect URI :
https://vantlmdcqziaccglfayb.supabase.co/auth/v1/callback
```

**Peran:** `student` → `/dashboard` · `teacher` → `/guru` · `admin` → `/admin`.
Ubah role via UI: **Admin → Kelola Akun** (`https://kanum-nine.vercel.app/admin/akun`).
