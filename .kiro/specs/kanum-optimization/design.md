# Design Document — KANUM Optimization

## Overview

Dokumen ini mendefinisikan arsitektur, komponen, antarmuka, model data, dan strategi penanganan error untuk 15 perbaikan menyeluruh pada aplikasi web KANUM (Kajang Numerasi). KANUM adalah aplikasi etnomatematika berbasis vanilla HTML/CSS/JS dengan Supabase sebagai backend (PostgreSQL + Auth + Storage).

Stack teknologi:
- **Frontend**: Vanilla HTML5, CSS3 (Tailwind CSS via CDN), Vanilla JavaScript (ES2020+)
- **Backend**: Supabase (PostgreSQL 15, Row Level Security, Auth, Storage)
- **Shared client**: `supabase.js` — single source of truth untuk konfigurasi dan helper auth

---

## Architecture

### Layer Overview

```
┌───────────────────────────────────────────────────────┐
│  Browser                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  Admin Panel│  │Student Pages │  │ Landing/Login│ │
│  │  /Admin/    │  │/Dashboard    │  │ /Login/      │ │
│  │             │  │ Siswa/       │  │ /Landing/    │ │
│  └──────┬──────┘  └──────┬───────┘  └──────┬───────┘ │
│         │                │                 │          │
│  ┌──────▼────────────────▼─────────────────▼───────┐  │
│  │           supabase.js (shared client)           │  │
│  │   _sb · getSession() · requireAuth()            │  │
│  │   requireAdmin() · showToast()                  │  │
│  └──────────────────────┬──────────────────────────┘  │
│                         │                             │
│  ┌──────────────────────▼──────────────────────────┐  │
│  │           dashboard.js (shell injection)        │  │
│  │   buildShell() · getCurrentPage() · navLink()   │  │
│  └─────────────────────────────────────────────────┘  │
└────────────────────────┬──────────────────────────────┘
                         │ HTTPS (Supabase JS SDK v2)
┌────────────────────────▼──────────────────────────────┐
│  Supabase Cloud                                        │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────┐   │
│  │  Auth    │  │  PostgreSQL  │  │  Storage       │   │
│  │  (JWT)   │  │  + RLS       │  │  (image_url)   │   │
│  └──────────┘  └──────┬───────┘  └────────────────┘   │
│                       │                               │
│               ┌───────▼──────────┐                    │
│               │  RPC Functions   │                    │
│               │  get_student_quiz│                    │
│               │  submit_student  │                    │
│               │  _quiz           │                    │
│               └──────────────────┘                    │
└───────────────────────────────────────────────────────┘
```

### Prinsip Arsitektur

1. **Zero-framework frontend** — Tidak ada React/Vue/Angular. Semua DOM manipulation dilakukan secara langsung.
2. **Supabase sebagai single backend** — Auth, database, storage semuanya melalui Supabase.
3. **RPC untuk logika sensitif** — Penilaian kuis dan akses kontrol dilakukan di sisi PostgreSQL, bukan browser.
4. **Shared helper** — `supabase.js` adalah satu-satunya tempat inisialisasi client. Semua halaman import dari sini.
5. **Shell injection** — `dashboard.js` menyuntikkan sidebar/topbar secara programatik; halaman tidak duplikasi markup navigasi.

---

## Components

### 1. Shared Supabase Client (`supabase.js`)

File yang sudah ada; tidak berubah kecuali untuk perbaikan minor (tidak ada perubahan struktur).

**Fungsi yang tersedia:**
- `getSession()` — mengambil sesi aktif Supabase Auth
- `getCurrentProfile()` — mengambil row dari `public.profiles`
- `requireAuth(redirectTo)` — redirect ke login jika sesi tidak ada
- `requireAdmin(redirectTo)` — redirect jika bukan admin
- `showToast(message, type)` — menampilkan notifikasi toast

**Pola pemanggilan:**
```javascript
// Contoh: inisialisasi halaman siswa
const session = await requireAuth('../Login/Masuk.html');
if (!session) return; // requireAuth sudah redirect

const profile = await getCurrentProfile();
localStorage.setItem('etno_user_name', profile.full_name);
```

---

### 2. Dashboard Shell (`dashboard.js`)

File yang sudah ada; diperbarui untuk:

1. **Menambah `Laporan` dan `Pengaturan` ke array `pages`** — sudah ada, perlu diverifikasi slug-nya konsisten.
2. **Fallback name** — Mengubah fallback dari `"Miftah"` ke `"Pengguna"` saat `etno_user_name` tidak ada di localStorage.
3. **Selektif removal** — Sudah menggunakan `aside:not(.quiz-side-panel)` — tidak perlu diubah.

**Perubahan pada `storedName`:**
```javascript
// Sebelum
const storedName = localStorage.getItem("etno_user_name") || "Miftah";

// Sesudah
const storedName = localStorage.getItem("etno_user_name") || "Pengguna";
```

---

### 3. RPC PostgreSQL — Sistem Kuis

Dua fungsi baru di `Supabase/schema.sql`.

#### `get_student_quiz(p_exercise_id UUID)`

```sql
CREATE OR REPLACE FUNCTION public.get_student_quiz(p_exercise_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id  UUID := auth.uid();
  v_exercise JSONB;
  v_attempt  UUID;
  v_questions JSONB;
BEGIN
  -- 1. Validasi latihan: published OR admin
  IF NOT EXISTS (
    SELECT 1 FROM public.exercises
    WHERE id = p_exercise_id
      AND (is_published = true OR public.is_admin())
  ) THEN
    RAISE EXCEPTION 'Latihan tidak ditemukan atau belum dipublikasikan'
      USING ERRCODE = 'P0002';
  END IF;

  -- 2. Ambil data exercise
  SELECT to_jsonb(e) INTO v_exercise
  FROM public.exercises e WHERE e.id = p_exercise_id;

  -- 3. Buat attempt baru
  INSERT INTO public.exercise_attempts
    (exercise_id, student_id, status)
  VALUES (p_exercise_id, v_user_id, 'in_progress')
  RETURNING id INTO v_attempt;

  -- 4. Ambil soal + opsi TANPA is_correct
  SELECT jsonb_agg(
    jsonb_build_object(
      'id',         q.id,
      'question',   q.question,
      'image_url',  q.image_url,
      'explanation', q.explanation,  -- hanya dikembalikan setelah submit
      'points',     q.points,
      'sort_order', q.sort_order,
      'options',    (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id',         opt.id,
            'option_text', opt.option_text,
            'sort_order', opt.sort_order
            -- is_correct SENGAJA DIHILANGKAN
          ) ORDER BY opt.sort_order
        )
        FROM public.question_options opt
        WHERE opt.question_id = q.id
      )
    ) ORDER BY q.sort_order
  )
  INTO v_questions
  FROM public.questions q
  WHERE q.exercise_id = p_exercise_id;

  RETURN jsonb_build_object(
    'exercise',    v_exercise,
    'attempt_id',  v_attempt,
    'questions',   v_questions
  );
END;
$$;
```

#### `submit_student_quiz(p_attempt_id UUID, p_answers JSONB)`

```sql
CREATE OR REPLACE FUNCTION public.submit_student_quiz(
  p_attempt_id UUID,
  p_answers    JSONB          -- [{question_id, option_id}]
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id      UUID := auth.uid();
  v_exercise_id  UUID;
  v_total_pts    INT  := 0;
  v_earned_pts   INT  := 0;
  v_correct      INT  := 0;
  v_wrong        INT  := 0;
  v_score        NUMERIC(5,2);
  v_ans          JSONB;
  v_q_id         UUID;
  v_opt_id       UUID;
  v_is_correct   BOOLEAN;
  v_pts          INT;
  v_review       JSONB := '[]'::JSONB;
BEGIN
  -- 1. Pastikan attempt milik user yang sedang login
  IF NOT EXISTS (
    SELECT 1 FROM public.exercise_attempts
    WHERE id = p_attempt_id AND student_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Akses ditolak'
      USING ERRCODE = '42501';
  END IF;

  -- 2. Ambil exercise_id
  SELECT exercise_id INTO v_exercise_id
  FROM public.exercise_attempts WHERE id = p_attempt_id;

  -- 3. Proses setiap jawaban
  FOR v_ans IN SELECT * FROM jsonb_array_elements(p_answers) LOOP
    v_q_id   := (v_ans->>'question_id')::UUID;
    v_opt_id := (v_ans->>'option_id')::UUID;

    SELECT is_correct, points
    INTO   v_is_correct, v_pts
    FROM   public.question_options opt
    JOIN   public.questions q ON q.id = opt.question_id
    WHERE  opt.id = v_opt_id AND q.exercise_id = v_exercise_id;

    v_total_pts := v_total_pts + COALESCE(v_pts, 0);

    IF v_is_correct THEN
      v_earned_pts := v_earned_pts + COALESCE(v_pts, 0);
      v_correct    := v_correct + 1;
    ELSE
      v_wrong := v_wrong + 1;
    END IF;

    INSERT INTO public.student_answers
      (attempt_id, question_id, option_id, is_correct, points_earned)
    VALUES
      (p_attempt_id, v_q_id, v_opt_id, v_is_correct, CASE WHEN v_is_correct THEN v_pts ELSE 0 END);
  END LOOP;

  -- 4. Hitung skor
  v_score := CASE
    WHEN v_total_pts > 0 THEN ROUND((v_earned_pts::NUMERIC / v_total_pts) * 100, 2)
    ELSE 0
  END;

  -- 5. Update attempt
  UPDATE public.exercise_attempts SET
    status        = 'completed',
    score         = v_score,
    total_points  = v_total_pts,
    earned_points = v_earned_pts,
    correct_count = v_correct,
    wrong_count   = v_wrong,
    finished_at   = now()
  WHERE id = p_attempt_id;

  -- 6. Susun review dengan jawaban benar
  SELECT jsonb_agg(
    jsonb_build_object(
      'question',       q.question,
      'your_answer',    sa_opt.option_text,
      'correct_answer', correct_opt.option_text,
      'is_correct',     sa.is_correct,
      'explanation',    q.explanation
    ) ORDER BY q.sort_order
  )
  INTO v_review
  FROM public.student_answers sa
  JOIN public.questions q        ON q.id = sa.question_id
  JOIN public.question_options sa_opt ON sa_opt.id = sa.option_id
  JOIN public.question_options correct_opt
    ON correct_opt.question_id = q.id AND correct_opt.is_correct = true
  WHERE sa.attempt_id = p_attempt_id;

  RETURN jsonb_build_object(
    'score',         v_score,
    'correct_count', v_correct,
    'wrong_count',   v_wrong,
    'review',        v_review
  );
END;
$$;
```

---

### 4. Halaman Registrasi (`Login/Daftar.html`)

**Perubahan pada fungsi `doRegister()`:**

```javascript
async function doRegister() {
  // ... validasi existing ...
  const role = document.querySelector('input[name="role"]:checked')?.value || 'siswa';

  // Mapping role UI ke role metadata
  const metaRole = role === 'guru' ? 'teacher' : 'student';

  const { data, error } = await _sb.auth.signUp({
    email, password: pass,
    options: {
      data: {
        full_name: name,
        role: metaRole        // 'teacher' → trigger akan simpan 'admin'
      }
    }
  });

  if (error) { showToast('Gagal daftar: ' + error.message, 'error'); return; }

  if (role === 'guru') {
    showToast('Akun guru berhasil dibuat! Silakan cek email untuk verifikasi. Setelah verifikasi, kamu akan diarahkan ke Admin Panel.');
  } else {
    showToast('Akun berhasil dibuat! Silakan cek email untuk verifikasi.');
  }
  setTimeout(() => window.location.href = 'Masuk.html', 2500);
}
```

**Perubahan trigger PostgreSQL:**

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_raw_role TEXT := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  v_db_role  TEXT;
BEGIN
  -- Mapping: 'teacher' → 'admin', semua lainnya → 'student'
  v_db_role := CASE WHEN v_raw_role = 'teacher' THEN 'admin' ELSE 'student' END;

  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email, ''),
    v_db_role
  );
  RETURN NEW;
END;
$$;
```

**Perbaikan Terms links:**

```html
<!-- Sebelum -->
<a href="../Docs/04-DEVELOPMENT-RULES.md">Syarat & Ketentuan</a>
<a href="../Docs/DESIGN.md">Kebijakan Privasi</a>

<!-- Sesudah -->
<a href="../Landing/terms.html" target="_blank">Syarat & Ketentuan</a>
<a href="../Landing/privacy.html" target="_blank">Kebijakan Privasi</a>
```

**Gabungkan Google Fonts menjadi satu request:**

```html
<!-- Sebelum: 3 tag <link> terpisah -->
<!-- Sesudah: 1 tag <link> tunggal -->
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
```

---

### 5. Dashboard Siswa (`Dashboard Siswa/Dashboard.html`)

**Blok JavaScript yang diganti — data dari Supabase:**

```javascript
document.addEventListener('DOMContentLoaded', async () => {
  const session = await getSession();
  if (!session) {
    window.location.href = '../Login/Masuk.html';
    return;
  }

  // Ambil profil
  const { data: profile, error: profErr } = await _sb
    .from('profiles')
    .select('full_name, class_name')
    .eq('id', session.user.id)
    .single();

  const displayName = profile?.full_name || localStorage.getItem('etno_user_name') || 'Pengguna';

  if (profile) {
    localStorage.setItem('etno_user_name', profile.full_name || '');
    localStorage.setItem('etno_user_class', profile.class_name || '');
  }

  // Update greeting
  const greetingH1 = document.querySelector('h1.font-headline-md');
  if (greetingH1) greetingH1.textContent = `Halo, ${displayName}! 👋`;

  // Ambil student_progress
  const { data: progresses, error: progErr } = await _sb
    .from('student_progress')
    .select('is_completed, best_score, attempts_count')
    .eq('student_id', session.user.id);

  if (progErr) {
    showToast('Gagal memuat statistik: ' + progErr.message, 'error');
    // Tampilkan "–" di semua stat card
    renderDashboardStats(null);
    return;
  }

  renderDashboardStats(progresses || []);
});

function renderDashboardStats(progresses) {
  if (!progresses) {
    // Fallback "–" untuk semua kartu
    document.querySelectorAll('.stat-value').forEach(el => el.textContent = '–');
    return;
  }

  const completed   = progresses.filter(p => p.is_completed).length;
  const attempted   = progresses.length;
  const avgScore    = attempted > 0
    ? Math.round(progresses.reduce((s, p) => s + Number(p.best_score), 0) / attempted)
    : 0;

  // Update stat cards by data attribute atau selector yang ditetapkan
  const el = {
    completed: document.getElementById('stat-completed'),
    attempted: document.getElementById('stat-attempted'),
    avg:       document.getElementById('stat-avg-score'),
  };
  if (el.completed) el.completed.textContent = completed;
  if (el.attempted) el.attempted.textContent = attempted;
  if (el.avg)       el.avg.textContent = avgScore;
}
```

**Perbaikan path gambar yang rusak** — tiga path di kartu Eksplorasi Budaya diganti:

| Path lama (rusak) | Pengganti (ada di Asset/Images/) |
|---|---|
| `../Asset/Images/sejarahammatoa.png` | `../Asset/Images/ammatoa_pemimpin_tertinggi.png` |
| `../Asset/Images/prosesmenenun.png` | `../Asset/Images/Penenunan.png` |
| `../Asset/Images/polamatematika.png` | `../Asset/Images/Polabanyak.png` |

**Tambah `loading="lazy"` pada `<img>` below-the-fold** — kartu budaya dan kartu konten di bawah viewport awal.

---

### 6. Halaman Laporan (`Dashboard Siswa/Laporan.html`)

**Struktur data yang diambil:**

```javascript
// Ringkasan progress
const { data: summary } = await _sb
  .from('student_progress')
  .select('exercise_id, best_score, is_completed, exercises(title)')
  .eq('student_id', session.user.id);

// Riwayat attempt
const { data: history } = await _sb
  .from('exercise_attempts')
  .select('id, score, correct_count, wrong_count, started_at, finished_at, exercises(title)')
  .eq('student_id', session.user.id)
  .order('started_at', { ascending: false })
  .limit(20);
```

**Pesan kosong:**

```javascript
if (!history || history.length === 0) {
  historyContainer.innerHTML = `
    <p class="text-on-surface-variant text-center py-8">
      Belum ada aktivitas latihan. Silakan kunjungi menu Latihan!
    </p>`;
}
```

---

### 7. Halaman Pengaturan (`Dashboard Siswa/Pengaturan.html`)

**Load profil saat mount:**

```javascript
const { data: profile } = await _sb
  .from('profiles')
  .select('full_name, class_name, email')
  .eq('id', session.user.id)
  .single();

document.getElementById('input-name').value   = profile?.full_name  || '';
document.getElementById('input-class').value  = profile?.class_name || '';
document.getElementById('input-email').value  = profile?.email      || '';
```

**Simpan profil:**

```javascript
async function saveProfile() {
  const full_name  = document.getElementById('input-name').value.trim();
  const class_name = document.getElementById('input-class').value.trim();

  const { error } = await _sb
    .from('profiles')
    .update({ full_name, class_name })
    .eq('id', session.user.id);

  if (error) {
    showToast('Gagal menyimpan: ' + error.message, 'error');
    return;
  }

  // Perbarui localStorage agar topbar langsung terupdate
  localStorage.setItem('etno_user_name', full_name);
  localStorage.setItem('etno_user_class', class_name);

  // Update topbar name in-place tanpa reload
  const topbarName = document.querySelector('.app-profile-name');
  if (topbarName) topbarName.textContent = full_name;

  showToast('Profil berhasil disimpan');
}
```

---

### 8. Logout Aman di Semua Halaman

Pola standar untuk semua halaman yang memiliki tautan logout:

```javascript
// Ganti <a href="../Login/Masuk.html"> dengan button atau event handler
async function handleLogout(event) {
  event.preventDefault();
  const { error } = await _sb.auth.signOut();
  if (error) {
    showToast('Gagal logout: ' + error.message, 'error');
  }
  window.location.href = redirectTarget; // tetap redirect meski error
}
```

**Halaman yang perlu diperbaiki:**
- `Dashboard Siswa/Laporan.html`
- `Dashboard Siswa/Pengaturan.html`
- `Dashboard Siswa/Materi.html`
- `Dashboard Siswa/Budaya.html`
- `Admin/index.html` (sudah ada, perlu verifikasi)
- `Admin/latihan.html`, `Admin/soal.html`, `Admin/progres.html`

**Template markup:**

```html
<!-- Ganti anchor logout dengan button -->
<button
  type="button"
  class="app-nav-link is-logout"
  onclick="handleLogout(event)">
  <span class="material-symbols-outlined">logout</span>
  <span>Logout</span>
</button>
```

---

### 9. Konten Materi dan Budaya Dinamis

#### Skema tabel baru

```sql
-- Tabel materi
CREATE TABLE IF NOT EXISTS public.materi (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title            TEXT NOT NULL,
  chapter_number   INT NOT NULL DEFAULT 0,
  level            TEXT NOT NULL DEFAULT 'dasar' CHECK (level IN ('dasar','menengah','lanjut')),
  description      TEXT NOT NULL DEFAULT '',
  duration_minutes INT NOT NULL DEFAULT 30,
  image_url        TEXT,
  content_html     TEXT NOT NULL DEFAULT '',
  is_published     BOOLEAN NOT NULL DEFAULT false,
  sort_order       INT NOT NULL DEFAULT 0,
  created_by       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabel budaya
CREATE TABLE IF NOT EXISTS public.budaya (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        TEXT NOT NULL,
  topic_key    TEXT UNIQUE NOT NULL,
  category     TEXT NOT NULL DEFAULT 'Umum',
  description  TEXT NOT NULL DEFAULT '',
  image_url    TEXT,
  content_html TEXT NOT NULL DEFAULT '',
  is_published BOOLEAN NOT NULL DEFAULT false,
  sort_order   INT NOT NULL DEFAULT 0,
  created_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### Render kartu di `Materi.html`

```javascript
const { data: materiList, error } = await _sb
  .from('materi')
  .select('id, title, chapter_number, level, description, duration_minutes, image_url, sort_order')
  .eq('is_published', true)
  .order('sort_order');

if (error) {
  showToast('Gagal memuat materi: ' + error.message, 'error');
  return;
}

const container = document.getElementById('materi-grid');
container.innerHTML = (materiList || []).map(m => `
  <article class="materi-card" data-id="${m.id}">
    <img src="${m.image_url || '../Asset/Images/gambarmateri.png'}"
         alt="${m.title}" loading="lazy">
    <h3>Bab ${m.chapter_number}: ${m.title}</h3>
    <p>${m.description}</p>
    <a href="materi-detail.html?id=${m.id}">Baca Materi</a>
  </article>
`).join('');
```

#### Admin CRUD pages (`Admin/materi.html`, `Admin/budaya.html`)

Struktur UI mengikuti pola `Admin/latihan.html`:
- Tabel data dengan tombol Edit/Delete per baris
- Modal form untuk Create/Edit
- Tombol toggle `is_published`
- Upload gambar via Supabase Storage

---

### 10. Halaman Latihan — Filter Kategori Dinamis

**Penghapusan markup statis** di `Latihan.html`:

```html
<!-- Hapus tombol hardcoded ini dari HTML -->
<!-- Hanya pertahankan tombol "Semua" dan placeholder -->
<div class="flex flex-wrap gap-2" id="category-filter-bar">
  <!-- Diisi secara dinamis oleh JavaScript -->
</div>
```

**Logika JavaScript:**

```javascript
function buildCategoryFilters(exercises) {
  const bar = document.getElementById('category-filter-bar');
  
  // Ekstrak kategori unik dari latihan yang ada
  const categories = [...new Set(
    exercises
      .map(ex => ex.category)
      .filter(Boolean)
  )].sort();

  const buttons = [
    // Tombol "Semua" selalu ada sebagai pertama
    buildFilterButton('', 'Semua', selectedCategory === ''),
    ...categories.map(cat => buildFilterButton(cat, cat, selectedCategory === cat))
  ];

  bar.innerHTML = buttons.join('');

  // Re-attach event listeners
  bar.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedCategory = btn.dataset.cat || '';
      buildCategoryFilters(allPublishedExercises);
      applyFiltersAndRender();
    });
  });
}

function buildFilterButton(value, label, isActive) {
  const activeClass = isActive
    ? 'bg-primary text-on-primary'
    : 'bg-white border border-outline-variant text-on-surface-variant hover:bg-surface-container-low';
  return `<button data-cat="${value}"
    class="cat-btn px-6 py-2 ${activeClass} rounded-full font-label-md text-label-md transition-all">
    ${label}
  </button>`;
}
```

---

### 11. Optimasi Performa

#### Preconnect & DNS-prefetch

Ditambahkan di `<head>` semua halaman:

```html
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="dns-prefetch" href="https://cdn.jsdelivr.net">
<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="dns-prefetch" href="https://fonts.gstatic.com">
```

#### Supabase JS versi pinned

```html
<!-- Sebelum (floating) -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- Sesudah (pinned) -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.1"></script>
```

#### Tailwind Config lokal (`tailwind.config.js`)

```javascript
// tailwind.config.js — di root proyek
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './Dashboard Siswa/**/*.html',
    './Admin/**/*.html',
    './Login/**/*.html',
    './Landing/**/*.html',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#003527',
        secondary: '#9a4614',
        background: '#f8f9ff',
        // ... token warna KANUM lengkap
      },
    },
  },
  plugins: [],
}
```

#### Lazy loading gambar

Semua `<img>` yang berada di bawah fold pertama mendapat `loading="lazy"`:

```html
<img src="..." alt="..." loading="lazy" onerror="this.closest('.img-wrap').innerHTML='<div class=fallback-placeholder></div>'">
```

**Fallback placeholder CSS:**

```css
.fallback-placeholder {
  background: var(--etno-surface-high, #dfe9fa);
  border-radius: inherit;
  width: 100%;
  height: 100%;
  min-height: 120px;
}
```

---

### 12. Halaman Terms & Privacy

Dua file baru yang dibuat:
- `Landing/terms.html` — Syarat & Ketentuan KANUM (konten minimal)
- `Landing/privacy.html` — Kebijakan Privasi KANUM (konten minimal)

Keduanya menggunakan template HTML yang konsisten dengan `Landing/index.html`, memuat font dan styling yang sama.

---

### 13. Pembersihan File

**File yang dihapus:**
- `temp.js`
- `test-supabase.js`

**Penambahan `.gitignore`:**

```gitignore
# File sementara dan test
temp*.js
test-*.js
```

---

## Data Models

### Tabel yang sudah ada (tidak berubah strukturnya)

| Tabel | Kolom kunci | Keterangan |
|---|---|---|
| `profiles` | `id, full_name, class_name, email, role` | Diperluas: trigger update untuk role mapping |
| `exercises` | `id, title, category, difficulty, is_published` | Tidak berubah |
| `questions` | `id, exercise_id, question, image_url, explanation` | Tidak berubah |
| `question_options` | `id, question_id, option_text, is_correct` | Tidak berubah |
| `exercise_attempts` | `id, exercise_id, student_id, status, score` | Tidak berubah |
| `student_answers` | `id, attempt_id, question_id, option_id, is_correct` | Tidak berubah |
| `student_progress` | `id, student_id, exercise_id, best_score, is_completed` | Tidak berubah |

### Tabel baru

#### `public.materi`

| Kolom | Tipe | Default | Keterangan |
|---|---|---|---|
| `id` | UUID PK | `uuid_generate_v4()` | — |
| `title` | TEXT NOT NULL | — | Judul bab |
| `chapter_number` | INT | 0 | Urutan bab |
| `level` | TEXT | `'dasar'` | CHECK: `dasar`, `menengah`, `lanjut` |
| `description` | TEXT | `''` | Ringkasan |
| `duration_minutes` | INT | 30 | Estimasi waktu |
| `image_url` | TEXT | NULL | URL gambar cover |
| `content_html` | TEXT | `''` | Konten HTML lengkap |
| `is_published` | BOOLEAN | false | Kontrol visibilitas |
| `sort_order` | INT | 0 | Urutan tampil |
| `created_by` | UUID FK | NULL | Referensi `profiles.id` |
| `created_at` | TIMESTAMPTZ | `now()` | — |
| `updated_at` | TIMESTAMPTZ | `now()` | Auto-update via trigger |

#### `public.budaya`

| Kolom | Tipe | Default | Keterangan |
|---|---|---|---|
| `id` | UUID PK | `uuid_generate_v4()` | — |
| `title` | TEXT NOT NULL | — | Judul topik |
| `topic_key` | TEXT UNIQUE NOT NULL | — | Slug unik (e.g., `history`, `weaving`) |
| `category` | TEXT | `'Umum'` | Kategorisasi konten |
| `description` | TEXT | `''` | Ringkasan |
| `image_url` | TEXT | NULL | URL gambar |
| `content_html` | TEXT | `''` | Konten HTML lengkap |
| `is_published` | BOOLEAN | false | Kontrol visibilitas |
| `sort_order` | INT | 0 | Urutan tampil |
| `created_by` | UUID FK | NULL | Referensi `profiles.id` |
| `created_at` | TIMESTAMPTZ | `now()` | — |
| `updated_at` | TIMESTAMPTZ | `now()` | Auto-update via trigger |

### RLS untuk tabel baru

```sql
-- materi
ALTER TABLE public.materi ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Siswa baca materi published"
  ON public.materi FOR SELECT USING (is_published = true OR public.is_admin());
CREATE POLICY "Admin CRUD materi"
  ON public.materi FOR ALL USING (public.is_admin());

-- budaya
ALTER TABLE public.budaya ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Siswa baca budaya published"
  ON public.budaya FOR SELECT USING (is_published = true OR public.is_admin());
CREATE POLICY "Admin CRUD budaya"
  ON public.budaya FOR ALL USING (public.is_admin());
```

---

## Error Handling

### Pola standar penanganan error di frontend

```javascript
async function loadData() {
  try {
    const { data, error } = await _sb.from('...').select('...');

    if (error) throw error; // delegasi ke catch block

    renderContent(data);
  } catch (err) {
    console.error('KANUM:', err);
    showToast(err.message || 'Terjadi kesalahan.', 'error');
    renderFallback(); // tampilkan "–" atau pesan kosong
  }
}
```

### Error state per komponen

| Komponen | Kondisi error | Respons UI |
|---|---|---|
| Dashboard stats | Supabase query gagal | Tampilkan "–" di semua stat card + toast |
| Laporan | Query gagal | Tampilkan "–" di kartu ringkasan + toast |
| Latihan grid | Query gagal | Tampilkan pesan error di area grid |
| Pengaturan save | Update gagal | Toast error, jangan redirect |
| Logout | signOut gagal | Toast error, redirect tetap terjadi |
| Quiz load | RPC error | Tampilkan error-state section |
| Quiz submit | RPC error | Toast error, tombol submit aktif kembali |

### Error PostgreSQL dari RPC

| ERRCODE | Kondisi | Pesan ke user |
|---|---|---|
| `42501` | `submit_student_quiz` dipanggil untuk attempt milik orang lain | "Akses ditolak" |
| `P0002` | `get_student_quiz` untuk latihan unpublished oleh non-admin | "Latihan tidak ditemukan atau belum dipublikasikan" |

---

## File Structure Changes

```
KANUM/
├── supabase.js                          ← Tidak berubah
├── tailwind.config.js                   ← BARU
├── .gitignore                           ← Diperbarui
├── temp.js                              ← DIHAPUS
├── test-supabase.js                     ← DIHAPUS
│
├── Supabase/
│   └── schema.sql                       ← Ditambah: tabel materi/budaya, RPC, trigger baru
│
├── Landing/
│   ├── index.html                       ← Tidak berubah
│   ├── terms.html                       ← BARU
│   └── privacy.html                     ← BARU
│
├── Login/
│   └── Daftar.html                      ← Diperbaiki: role mapping, terms links, font dedup
│
├── Dashboard Siswa/
│   ├── dashboard.js                     ← Diperbarui: fallback name, slug pages
│   ├── Dashboard.html                   ← Diperbarui: data real, path gambar, lazy img
│   ├── Materi.html                      ← Diperbarui: konten dinamis dari Supabase
│   ├── Budaya.html                      ← Diperbarui: konten dinamis dari Supabase
│   ├── Latihan.html                     ← Diperbarui: filter dinamis, dedup supabase.js
│   ├── Laporan.html                     ← Diperbarui: data real, logout aman
│   ├── Pengaturan.html                  ← Diperbarui: profil dari Supabase, logout aman
│   ├── latihan-supabase.html            ← Tidak berubah (kecuali preconnect hints)
│   ├── materi-detail.html               ← Diperbarui: tambahkan dashboard.js check
│   └── budaya-detail.html               ← Diperbarui: tambahkan dashboard.js check
│
└── Admin/
    ├── index.html                       ← Diperbarui: logout aman, nav link baru
    ├── latihan.html                     ← Diperbarui: logout aman, nav link baru
    ├── soal.html                        ← Diperbarui: logout aman, nav link baru
    ├── progres.html                     ← Diperbarui: logout aman, nav link baru
    ├── materi.html                      ← BARU
    └── budaya.html                      ← BARU
```

---

## Correctness Properties

*Properti adalah karakteristik atau perilaku yang harus berlaku di semua eksekusi valid suatu sistem — secara formal, sebuah pernyataan tentang apa yang seharusnya dilakukan sistem. Properti ini menjembatani spesifikasi yang dapat dibaca manusia dengan jaminan kebenaran yang dapat diverifikasi.*

### Property 1: Render kartu materi mengikuti data

*For any* daftar baris `materi` dengan `is_published = true`, jumlah elemen `article.materi-card` yang dirender di halaman `Materi.html` harus sama dengan jumlah baris yang diterima dari Supabase.

**Validates: Requirements 5.3**

---

### Property 2: Render kartu budaya mengikuti data

*For any* daftar baris `budaya` dengan `is_published = true`, jumlah elemen kartu budaya yang dirender di halaman `Budaya.html` harus sama dengan jumlah baris yang diterima dari Supabase.

**Validates: Requirements 5.4**

---

### Property 3: Filter kategori dinamis konsisten dengan data latihan

*For any* kumpulan latihan `is_published = true` yang dimuat, tombol filter kategori yang tampil di `#category-filter-bar` harus berjumlah tepat: satu tombol "Semua" ditambah satu tombol per nilai `category` unik yang ada pada data tersebut. Tidak ada tombol untuk kategori yang tidak memiliki satu pun latihan.

**Validates: Requirements 13.1, 13.4**

---

### Property 4: Halaman aktif terdeteksi dari pathname

*For any* pathname yang mengandung slug halaman yang terdaftar (misalnya `laporan`, `pengaturan`, `materi`, `budaya`, `latihan`, `dashboard`), fungsi `getCurrentPage()` di `dashboard.js` harus mengembalikan objek page yang `key`-nya sesuai dengan slug tersebut.

**Validates: Requirements 8.2**

---

### Property 5: Topbar menampilkan nama dari localStorage

*For any* nilai string yang tersimpan di `localStorage.getItem('etno_user_name')`, shell navigasi yang dibangun oleh `dashboard.js` harus menampilkan string tersebut di elemen `.app-profile-name`. Ketika key tidak ada, elemen harus menampilkan teks `"Pengguna"`.

**Validates: Requirements 10.1**

---

### Property 6: Profil update tersimpan ke localStorage

*For any* nilai `full_name` dan `class_name` yang valid dan berhasil disimpan ke tabel `profiles` melalui halaman Pengaturan, nilai yang sama harus tersimpan di `localStorage` dengan key `etno_user_name` dan `etno_user_class` setelah operasi selesai.

**Validates: Requirements 7.2, 7.4**
