# Design Document — KANUM Routing Refactor

## Overview

Dokumen ini mendeskripsikan arsitektur dan rencana implementasi untuk KANUM Routing Refactor. Refactor ini mencakup empat perubahan besar yang berjalan serentak tanpa menyentuh UI:

1. **Clean URL via Vercel Rewrites** — semua halaman dapat diakses tanpa ekstensi `.html`
2. **Centralized Auth Guard** — satu `guard.js` menggantikan semua logika auth yang tersebar
3. **Tailwind CSS build lokal** — CDN dihapus, diganti file statis ter-purge
4. **JS inline → file terpisah** — setiap halaman punya file `.js` sendiri dengan pola IIFE

Proyek adalah **static MPA** (Multi-Page Application) berbasis vanilla HTML/CSS/JS, di-deploy ke Vercel, dengan Supabase sebagai backend auth dan database.

---

## Architecture

### Script Loading Order

Urutan load script di setiap halaman yang dilindungi (student/admin) adalah:

```
<link rel="stylesheet" href="/dist/tailwind.min.css">
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.1/dist/umd/supabase.min.js"></script>
<script>window.PAGE_ROLE = 'student';</script>   <!-- atau 'admin' / 'public' -->
<script src="/supabase.js"></script>
<script src="/guard.js"></script>
<script src="./page-name.js" defer></script>       <!-- JS spesifik halaman -->
<script src="/Dashboard Siswa/dashboard.js"></script>  <!-- hanya halaman dashboard siswa -->
```

`PAGE_ROLE` harus dideklarasikan **sebelum** `guard.js` dimuat karena guard membaca nilainya saat eksekusi. `supabase.js` harus dimuat sebelum `guard.js` karena guard bergantung pada `window._sb`.

### Dependency Graph

```
supabase.js  ──►  window._sb, getSession, getCurrentProfile
                          │
                          ▼
guard.js     reads ──►  window.PAGE_ROLE
             uses  ──►  window._sb.auth.getSession()
             uses  ──►  window._sb.from('profiles')
             writes ──► localStorage (etno_user_name, etno_user_class)
             writes ──► window.location.href (on redirect)

dashboard.js  reads ──► localStorage (etno_user_name, etno_user_class)
              writes ──► DOM (sidebar, topbar, bottom nav)

page-*.js    uses ──►  window._sb, window.showToast, window.getCurrentProfile
```

---

## Components

### 1. `vercel.json` — Clean URL Routing

File konfigurasi tunggal di root proyek. Menggunakan field `rewrites` Vercel untuk memetakan clean URL ke file `.html` fisik tanpa redirect (Vercel melayani file dengan status 200).

**Struktur:**

```json
{
  "rewrites": [
    { "source": "/",                 "destination": "/Landing/index.html" },
    { "source": "/login",            "destination": "/Login/Masuk.html" },
    { "source": "/daftar",           "destination": "/Login/Daftar.html" },
    { "source": "/dashboard",        "destination": "/Dashboard Siswa/Dashboard.html" },
    { "source": "/materi",           "destination": "/Dashboard Siswa/Materi.html" },
    { "source": "/materi/:id",       "destination": "/Dashboard Siswa/materi-detail.html" },
    { "source": "/budaya",           "destination": "/Dashboard Siswa/Budaya.html" },
    { "source": "/budaya/:id",       "destination": "/Dashboard Siswa/budaya-detail.html" },
    { "source": "/latihan",          "destination": "/Dashboard Siswa/Latihan.html" },
    { "source": "/latihan/quiz",     "destination": "/Dashboard Siswa/latihan-supabase.html" },
    { "source": "/laporan",          "destination": "/Dashboard Siswa/Laporan.html" },
    { "source": "/pengaturan",       "destination": "/Dashboard Siswa/Pengaturan.html" },
    { "source": "/admin",            "destination": "/Admin/index.html" },
    { "source": "/admin/latihan",    "destination": "/Admin/latihan.html" },
    { "source": "/admin/soal",       "destination": "/Admin/soal.html" },
    { "source": "/admin/materi",     "destination": "/Admin/materi.html" },
    { "source": "/admin/budaya",     "destination": "/Admin/budaya.html" },
    { "source": "/admin/progres",    "destination": "/Admin/progres.html" }
  ]
}
```

Vercel memproses `rewrites` secara berurutan. Route dengan path parameter (`:id`) ditempatkan setelah route eksak yang lebih spesifik. URL yang tidak cocok dengan rule mana pun dikembalikan sebagai 404 oleh Vercel secara otomatis.

---

### 2. `guard.js` — Centralized Auth Guard

File tunggal di root proyek, dapat diakses semua halaman via path absolut `/guard.js`.

**Desain:**

Guard menggunakan `window._sb` (Supabase client dari `supabase.js`) untuk memeriksa sesi. Untuk mencegah flash konten terproteksi, guard menyembunyikan `document.body` saat load dan menampilkannya kembali hanya setelah pemeriksaan selesai.

```javascript
(function () {
  'use strict';

  const role = window.PAGE_ROLE || 'public';

  // Sembunyikan body untuk mencegah flash konten
  if (role !== 'public') {
    document.documentElement.style.visibility = 'hidden';
  }

  async function checkAccess() {
    if (role === 'public') return; // Tidak perlu cek sesi

    const { data: { session } } = await window._sb.auth.getSession();

    if (!session) {
      window.location.replace('/login');
      return;
    }

    // Ambil profil untuk mengetahui role di database
    const { data: profile } = await window._sb
      .from('profiles')
      .select('id, full_name, class_name, role')
      .eq('id', session.user.id)
      .single();

    const userRole = profile?.role ?? 'student';

    if (role === 'student') {
      if (userRole === 'admin') {
        window.location.replace('/admin');
        return;
      }
      // Simpan data profil ke localStorage untuk dashboard.js
      localStorage.setItem('etno_user_name', profile?.full_name ?? '');
      localStorage.setItem('etno_user_class', profile?.class_name ?? '');
    }

    if (role === 'admin') {
      if (userRole !== 'admin') {
        window.location.replace('/dashboard');
        return;
      }
    }

    // Akses diizinkan — tampilkan body
    document.documentElement.style.visibility = '';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAccess);
  } else {
    checkAccess();
  }
})();
```

**State Machine PAGE_ROLE:**

```
PAGE_ROLE = 'public'
  └── Izinkan akses (tanpa cek sesi)

PAGE_ROLE = 'student'
  ├── Sesi tidak ada → redirect /login
  ├── Sesi ada, role = 'admin' → redirect /admin
  └── Sesi ada, role = 'student' → simpan profil, izinkan

PAGE_ROLE = 'admin'
  ├── Sesi tidak ada → redirect /login
  ├── Sesi ada, role = 'student' → redirect /dashboard
  └── Sesi ada, role = 'admin' → izinkan

PAGE_ROLE tidak terdefinisi
  └── Diperlakukan sebagai 'public'
```

---

### 3. `dashboard.js` — Updated Navigation Hrefs

`dashboard.js` yang sudah ada perlu diupdate pada array `pages` agar `href` menggunakan clean URL absolut. Fungsi `handleLogout` juga perlu diupdate.

**Perubahan pada array `pages`:**

```javascript
// SEBELUM
{ key: "Dashboard", href: "Dashboard", ... }

// SESUDAH
{ key: "Dashboard", href: "/dashboard", ... }
```

**Semua href baru:**

| key          | href           |
|--------------|----------------|
| Dashboard    | `/dashboard`   |
| Materi       | `/materi`      |
| Budaya       | `/budaya`      |
| Latihan      | `/latihan`     |
| Laporan      | `/laporan`     |
| Pengaturan   | `/pengaturan`  |

**Perubahan pada `handleLogout`:**

```javascript
// SEBELUM
window.location.href = '../Login/Masuk.html';

// SESUDAH
window.location.href = '/login';
```

Fungsi `normalize()` dan `getCurrentPage()` tetap berfungsi karena clean URL seperti `/dashboard` akan menghasilkan `currentName = 'dashboard'` yang masih cocok dengan alias yang sudah ada.

---

### 4. Tailwind CSS Build System

**File baru: `input.css`** (di root proyek)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Script baru di `package.json`:**

```json
{
  "scripts": {
    "build:css": "tailwindcss -i ./input.css -o ./dist/tailwind.min.css --minify",
    "watch:css": "tailwindcss -i ./input.css -o ./dist/tailwind.min.css --watch"
  },
  "devDependencies": {
    "tailwindcss": "3.4.17"
  }
}
```

`tailwind.config.js` yang sudah ada tidak diubah. Tailwind CLI membaca `content` array dari config tersebut untuk purging class yang tidak digunakan.

**Penggantian di setiap file HTML:**

```html
<!-- SEBELUM: CDN Tailwind -->
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<script id="tailwind-config">tailwind.config = { ... }</script>

<!-- SESUDAH: File lokal -->
<link rel="stylesheet" href="/dist/tailwind.min.css">
```

Tag `<script id="tailwind-config">` inline juga dihapus karena tidak relevan saat menggunakan file statis.

---

### 5. JavaScript Inline → File Terpisah

Setiap file HTML yang memiliki blok `<script>` dengan logika bisnis akan mendapatkan file `.js` bersangkutan di direktori yang sama.

**Konvensi penamaan:**

| HTML File                              | JS File                                   |
|----------------------------------------|-------------------------------------------|
| `Login/Masuk.html`                     | `Login/masuk.js`                          |
| `Login/Daftar.html`                    | `Login/daftar.js`                         |
| `Dashboard Siswa/Dashboard.html`       | `Dashboard Siswa/dashboard-page.js`       |
| `Dashboard Siswa/Materi.html`          | `Dashboard Siswa/materi-page.js`          |
| `Dashboard Siswa/materi-detail.html`   | `Dashboard Siswa/materi-detail-page.js`   |
| `Dashboard Siswa/Budaya.html`          | `Dashboard Siswa/budaya-page.js`          |
| `Dashboard Siswa/budaya-detail.html`   | `Dashboard Siswa/budaya-detail-page.js`   |
| `Dashboard Siswa/Latihan.html`         | `Dashboard Siswa/latihan-page.js`         |
| `Dashboard Siswa/latihan-supabase.html`| `Dashboard Siswa/latihan-quiz-page.js`    |
| `Dashboard Siswa/Laporan.html`         | `Dashboard Siswa/laporan-page.js`         |
| `Dashboard Siswa/Pengaturan.html`      | `Dashboard Siswa/pengaturan-page.js`      |
| `Admin/index.html`                     | `Admin/admin-dashboard-page.js`           |
| `Admin/latihan.html`                   | `Admin/admin-latihan-page.js`             |
| `Admin/soal.html`                      | `Admin/admin-soal-page.js`                |
| `Admin/materi.html`                    | `Admin/admin-materi-page.js`              |
| `Admin/budaya.html`                    | `Admin/admin-budaya-page.js`              |
| `Admin/progres.html`                   | `Admin/admin-progres-page.js`             |

**Pola IIFE yang digunakan:**

Konsisten dengan `dashboard.js` yang sudah ada, semua file halaman menggunakan IIFE untuk menghindari polusi namespace global:

```javascript
// Login/masuk.js
(function () {
  'use strict';

  async function doLogin() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    if (!email || !password) {
      window.showToast('Isi email dan kata sandi', 'error');
      return;
    }
    const btn = document.querySelector('button[onclick="doLogin()"]');
    btn.disabled = true;
    btn.textContent = 'Memproses...';

    const { data, error } = await window._sb.auth.signInWithPassword({ email, password });
    btn.disabled = false;
    btn.textContent = 'Masuk';

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
  window.doLogin = doLogin;
  window.doGoogleLogin = doGoogleLogin;

  document.addEventListener('DOMContentLoaded', function () {
    const toggleIcon = document.getElementById('toggle-password-icon');
    if (toggleIcon) {
      toggleIcon.parentElement.addEventListener('click', function () {
        const passInput = document.getElementById('password');
        const isHidden = passInput.type === 'password';
        passInput.type = isHidden ? 'text' : 'password';
        toggleIcon.textContent = isHidden ? 'visibility_off' : 'visibility';
        toggleIcon.parentElement.setAttribute(
          'aria-label',
          isHidden ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'
        );
      });
    }
  });
})();
```

**Tag pengganti di HTML:**

```html
<!-- Ganti semua blok <script>...</script> inline dengan: -->
<script src="./masuk.js" defer></script>
```

---

### 6. Struktur Folder Akhir

```
KANUM/
├── vercel.json                  ← BARU: clean URL rewrites
├── input.css                    ← BARU: Tailwind directives
├── package.json                 ← DIPERBARUI: scripts build:css, watch:css
├── tailwind.config.js           ← TIDAK BERUBAH
├── supabase.js                  ← TIDAK BERUBAH
├── guard.js                     ← BARU: auth guard terpusat
├── .gitignore                   ← DIPERBARUI: tambah dist/, node_modules/
├── dist/
│   └── tailwind.min.css         ← DIHASILKAN oleh build:css (di-gitignore)
├── Landing/
│   └── index.html               ← DIPERBARUI: ganti CDN, PAGE_ROLE='public'
├── Login/
│   ├── Masuk.html               ← DIPERBARUI: ganti CDN, tambah guard.js, masuk.js
│   ├── masuk.js                 ← BARU: JS dari Masuk.html
│   ├── Daftar.html              ← DIPERBARUI: ganti CDN, tambah guard.js, daftar.js
│   └── daftar.js                ← BARU: JS dari Daftar.html
├── Dashboard Siswa/
│   ├── dashboard.js             ← DIPERBARUI: href clean URL, logout URL
│   ├── Dashboard.html           ← DIPERBARUI: ganti CDN, PAGE_ROLE='student'
│   ├── dashboard-page.js        ← BARU: JS dari Dashboard.html
│   ├── Materi.html              ← DIPERBARUI
│   ├── materi-page.js           ← BARU
│   ├── materi-detail.html       ← DIPERBARUI
│   ├── materi-detail-page.js    ← BARU
│   ├── Budaya.html              ← DIPERBARUI
│   ├── budaya-page.js           ← BARU
│   ├── budaya-detail.html       ← DIPERBARUI
│   ├── budaya-detail-page.js    ← BARU
│   ├── Latihan.html             ← DIPERBARUI
│   ├── latihan-page.js          ← BARU
│   ├── latihan-supabase.html    ← DIPERBARUI
│   ├── latihan-quiz-page.js     ← BARU
│   ├── Laporan.html             ← DIPERBARUI
│   ├── laporan-page.js          ← BARU
│   ├── Pengaturan.html          ← DIPERBARUI
│   └── pengaturan-page.js       ← BARU
├── Admin/
│   ├── index.html               ← DIPERBARUI: tambah guard.js, PAGE_ROLE='admin'
│   ├── admin-dashboard-page.js  ← BARU
│   ├── admin.css                ← TIDAK BERUBAH
│   ├── latihan.html             ← DIPERBARUI
│   ├── admin-latihan-page.js    ← BARU
│   ├── soal.html                ← DIPERBARUI
│   ├── admin-soal-page.js       ← BARU
│   ├── materi.html              ← DIPERBARUI
│   ├── admin-materi-page.js     ← BARU
│   ├── budaya.html              ← DIPERBARUI
│   ├── admin-budaya-page.js     ← BARU
│   ├── progres.html             ← DIPERBARUI
│   └── admin-progres-page.js    ← BARU
└── Asset/
    └── Images/                  ← TIDAK BERUBAH
```

---

## Data Models

Tidak ada perubahan schema database. Refactor ini hanya menyentuh lapisan presentasi dan navigasi.

**localStorage keys yang dikelola oleh `guard.js`:**

| Key                | Value                         | Diset oleh    | Dibaca oleh    |
|--------------------|-------------------------------|---------------|----------------|
| `etno_user_name`   | `profile.full_name` (string)  | `guard.js`    | `dashboard.js` |
| `etno_user_class`  | `profile.class_name` (string) | `guard.js`    | `dashboard.js` |

Kedua key ini sebelumnya mungkin diset oleh berbagai halaman secara mandiri. Setelah refactor, `guard.js` adalah satu-satunya yang bertanggung jawab menyimpannya.

---

## Interfaces

### `window.PAGE_ROLE` Contract

Setiap halaman HTML bertanggung jawab mendeklarasikan `PAGE_ROLE` sebelum memuat `guard.js`:

| Halaman                       | PAGE_ROLE  |
|-------------------------------|------------|
| `/` (Landing)                 | `'public'` |
| `/login`, `/daftar`           | `'public'` |
| `/dashboard` sampai `/pengaturan` | `'student'` |
| `/admin` sampai `/admin/progres`  | `'admin'`  |

### Penggantian `window.requireAuth` dan `window.requireAdmin`

Fungsi `requireAuth()` dan `requireAdmin()` di `supabase.js` menggunakan path file lama (`../Login/Masuk.html`, `../Dashboard Siswa/Dashboard.html`). Setelah refactor, fungsi-fungsi ini tidak lagi digunakan langsung oleh halaman karena `guard.js` mengambil alih tugasnya. Fungsi tersebut tetap ada di `supabase.js` untuk backward compatibility tapi sebaiknya tidak dipanggil dari halaman baru.

---

## Error Handling

### Guard.js — Sesi Gagal Diambil

Jika `window._sb.auth.getSession()` melempar error (misal, koneksi jaringan), guard harus tetap aman:

```javascript
try {
  const { data: { session } } = await window._sb.auth.getSession();
  // ... logika normal
} catch (err) {
  console.warn('[KANUM guard] Gagal memeriksa sesi:', err);
  // Redirect ke login sebagai fallback aman
  window.location.replace('/login');
} finally {
  document.documentElement.style.visibility = '';
}
```

### Tailwind — File CSS Tidak Ditemukan

Jika `dist/tailwind.min.css` tidak ditemukan, browser akan menampilkan halaman tanpa styling. Ini adalah degradasi graceful — tidak ada error JavaScript. Tidak diperlukan penanganan khusus di JS.

### Page JS — Error Inisialisasi

Semua file `page-*.js` menggunakan `DOMContentLoaded` event listener untuk inisialisasi. Jika ada error dalam logika halaman, error hanya mempengaruhi halaman tersebut dan tidak merusak guard atau navigasi.

---

## Migration Notes

### Urutan Implementasi yang Aman

Urutan berikut meminimalkan risiko regresi:

1. **Buat `vercel.json`** terlebih dahulu — tidak mempengaruhi file yang ada
2. **Buat `guard.js`** — file baru, belum terhubung ke halaman mana pun
3. **Setup Tailwind build** (`input.css`, `package.json`, jalankan build) — hasilkan `dist/tailwind.min.css`
4. **Update `dashboard.js`** href dan logout URL
5. **Proses halaman satu per satu**: ekstrak JS inline → buat file `.js` → ganti CDN → tambah `PAGE_ROLE` + `guard.js`
6. **Update README**

### Backward Compatibility

Selama proses migrasi bertahap, halaman yang sudah diupdate (menggunakan clean URL) akan berjalan berdampingan dengan halaman yang belum. Vercel Rewrites hanya aktif di lingkungan Vercel — untuk pengembangan lokal, diperlukan server dengan kemampuan rewrite (misalnya `vercel dev`).

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Guard Tidak Memblokir Halaman Publik

*Untuk setiap* nilai `PAGE_ROLE = 'public'` (atau `PAGE_ROLE` yang tidak terdefinisi), dan untuk kondisi sesi apa pun (tidak ada sesi, sesi siswa aktif, sesi admin aktif), `guard.js` **tidak boleh** melakukan redirect dan harus membiarkan halaman tampil normal.

**Validates: Requirements 2.3, 2.11**

---

### Property 2: Guard Menyimpan Profil Siswa ke localStorage

*Untuk setiap* profil siswa yang valid dengan `full_name` dan `class_name` bernilai string apa pun (termasuk string kosong, Unicode, karakter khusus), setelah guard menyelesaikan pemeriksaan pada halaman `PAGE_ROLE = 'student'`, nilai `localStorage.getItem('etno_user_name')` harus sama persis dengan `profile.full_name` dan `localStorage.getItem('etno_user_class')` harus sama persis dengan `profile.class_name`.

**Validates: Requirements 2.9**

---

### Property 3: Login Redirect Berdasarkan Role

*Untuk setiap* pengguna dengan role `'student'` atau `'admin'`, setelah login berhasil melalui halaman `/login`, pengguna dengan role `'student'` harus diarahkan ke `/dashboard` dan pengguna dengan role `'admin'` harus diarahkan ke `/admin` — tidak ada role lain yang menghasilkan redirect selain keduanya.

**Validates: Requirements 3.4**

---

### Property 4: Tidak Ada href Placeholder di Navigasi

*Untuk setiap* elemen anchor (`<a>`) di dalam sidebar, topbar, bottom nav, dan kartu konten di semua halaman KANUM, atribut `href` tidak boleh bernilai `'#'`.

**Validates: Requirements 3.6**

---

### Property 5: Tidak Ada CDN Tailwind di Halaman HTML

*Untuk setiap* file `.html` di proyek KANUM, tidak boleh ada tag `<script>` yang atribut `src`-nya mengandung `cdn.tailwindcss.com`.

**Validates: Requirements 4.6**

---

### Property 6: Setiap File JS Halaman Menggunakan IIFE

*Untuk setiap* file `.js` halaman yang dihasilkan dari proses ekstraksi JS inline, konten file harus dibungkus dalam IIFE (`(function() { ... })()`) atau ES module pattern — tidak ada fungsi atau variabel yang dideklarasikan di scope global tanpa disengaja.

**Validates: Requirements 5.7**

---

### Property 7: Tidak Ada JS Inline Logika Bisnis di HTML

*Untuk setiap* file `.html` di proyek KANUM, tidak boleh ada blok `<script>` yang mengandung definisi fungsi bisnis (seperti `doLogin`, `loadData`, `fetchMateri`, dan sejenisnya) — semua logika bisnis harus berada di file `.js` eksternal.

**Validates: Requirements 5.1, 5.3**
