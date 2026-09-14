-- ============================================================
-- KANUM – 003: Index Performa
-- Jalankan SETELAH 002_verification_flow.sql. Idempotent.
--
-- Tujuan: query yang paling sering dipanggil aplikasi tetap cepat
-- saat data tumbuh (profil, kelas, progres, attempt).
-- ============================================================

-- ============================================================
-- 1. PROFILES
-- ============================================================
-- Login/cari siswa by email (KelasGuru.tambahSiswa, admin_set_role)
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Antrean verifikasi & Kelola Akun (filter role + status)
CREATE INDEX IF NOT EXISTS idx_profiles_role_status
  ON public.profiles(role, status);

-- ============================================================
-- 2. CLASSES / CLASS_MEMBERS
-- ============================================================
-- Antrean verifikasi guru & RLS is_teacher_of
CREATE INDEX IF NOT EXISTS idx_classes_teacher ON public.classes(teacher_id);

-- Daftar anggota per kelas (KelasGuru) & cek keanggotaan
CREATE INDEX IF NOT EXISTS idx_members_class ON public.class_members(class_id);
CREATE INDEX IF NOT EXISTS idx_members_student ON public.class_members(student_id);

-- ============================================================
-- 3. QUIZ / PROGRES
-- ============================================================
-- Dashboard guru/admin: hitung attempt & progres
CREATE INDEX IF NOT EXISTS idx_attempts_exercise ON public.exercise_attempts(exercise_id);
CREATE INDEX IF NOT EXISTS idx_attempts_student ON public.exercise_attempts(student_id);

-- Laporan siswa: progres per siswa (RLS by student_id)
CREATE INDEX IF NOT EXISTS idx_progress_student ON public.student_progress(student_id);

-- ============================================================
-- 4. KONTEN
-- ============================================================
-- Daftar materi/budaya/exercise yang dipublikasikan (urutan tampil)
CREATE INDEX IF NOT EXISTS idx_materi_published_sort ON public.materi(is_published, sort_order);
CREATE INDEX IF NOT EXISTS idx_budaya_published_sort ON public.budaya(is_published, sort_order);
CREATE INDEX IF NOT EXISTS idx_exercises_published_sort ON public.exercises(is_published, sort_order);
