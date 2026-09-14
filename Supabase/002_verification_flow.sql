-- ============================================================
-- KANUM – Migrasi Verifikasi Akun (pending / approved / rejected)
-- Jalankan SETELAH 000_rebuild.sql dan 001_multi_role.sql.
-- Idempotent — aman dijalankan berulang di Supabase SQL Editor.
--
-- Prinsip:
--   role   = jenis akun (student/teacher/admin)
--   status = hasil verifikasi (pending/approved/rejected)
--   SISWA  → langsung 'approved' saat pendaftaran (tanpa verifikasi).
--   GURU   → 'pending' sampai diverifikasi Admin (satu-satunya jalur
--            approval guru; guru tidak bisa mengangkat guru).
--   ADMIN  → tidak bisa didaftarkan publik; dibuat via SQL Editor.
--   Akses area hanya untuk status 'approved' (admin selalu aktif).
--
-- KEAMANAN: client TIDAK bisa mengubah kolom role/status (column
-- privilege, bagian 3). Perubahan role/status hanya lewat RPC
-- SECURITY DEFINER yang memeriksa kewenangan di database.
-- ============================================================

-- ============================================================
-- 1. KOLOM STATUS PADA PROFILES
--    Default 'approved' → SEMUA akun lama otomatis tetap punya akses.
-- ============================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT
  NOT NULL DEFAULT 'approved';

UPDATE public.profiles SET status = 'approved'
WHERE status NOT IN ('pending', 'approved', 'rejected');

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_status_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_status_check
  CHECK (status IN ('pending', 'approved', 'rejected'));

CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

-- ============================================================
-- 2. TRIGGER PENDAFTARAN (revisi)
--    SEMUA akun publik baru → 'pending' dulu. Aktivasi final terjadi
--    saat user SUBMIT form pendaftaran (RPC complete_signup, bagian 4c):
--      student → approved (siswa tanpa verifikasi)
--      teacher → pending  (menunggu verifikasi Admin)
--    Metadata role='admin' TIDAK dipercaya (siapa pun bisa set
--    metadata saat signup) → dipetakan 'student'.
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_raw_role TEXT := lower(COALESCE(NEW.raw_user_meta_data->>'role', 'student'));
  v_db_role  TEXT;
BEGIN
  v_db_role := CASE
    WHEN v_raw_role IN ('teacher', 'guru') THEN 'teacher'
    ELSE 'student'  -- 'admin' sengaja TIDAK dihormati dari metadata publik
  END;

  INSERT INTO public.profiles (id, full_name, email, class_name, role, status, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(COALESCE(NEW.email, ''), '@', 1),
      ''
    ),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'class_name', ''),
    v_db_role,
    'pending', -- finalisasi status oleh complete_signup (form pendaftaran)
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = CASE
      WHEN public.profiles.full_name = '' THEN EXCLUDED.full_name
      ELSE public.profiles.full_name
    END,
    email = CASE
      WHEN public.profiles.email = '' THEN EXCLUDED.email
      ELSE public.profiles.email
    END,
    avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url);
    -- CATATAN: status sengaja TIDAK di-overwrite saat user OAuth ulang
    -- (akun rejected tetap rejected, approved tetap approved).

  RETURN NEW;
END;
$$;

-- ensure_own_profile (fallback profil) mengikuti aturan yang sama.
CREATE OR REPLACE FUNCTION public.ensure_own_profile()
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  meta jsonb := COALESCE(auth.jwt() -> 'user_metadata', '{}'::jsonb);
  v_raw text := lower(COALESCE(meta->>'role', 'student'));
  v_role text;
  v_row public.profiles;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  SELECT * INTO v_row FROM public.profiles WHERE id = uid;
  IF FOUND THEN
    RETURN v_row;
  END IF;

  v_role := CASE
    WHEN v_raw IN ('teacher', 'guru') THEN 'teacher'
    ELSE 'student'
  END;

  INSERT INTO public.profiles (id, full_name, email, class_name, role, status, avatar_url)
  VALUES (
    uid,
    COALESCE(meta->>'full_name', meta->>'name', split_part(COALESCE(auth.jwt()->>'email', ''), '@', 1), ''),
    COALESCE(auth.jwt()->>'email', ''),
    COALESCE(meta->>'class_name', ''),
    v_role,
    'pending',
    COALESCE(meta->>'avatar_url', meta->>'picture')
  )
  ON CONFLICT (id) DO NOTHING;

  SELECT * INTO v_row FROM public.profiles WHERE id = uid;
  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_own_profile() TO authenticated;

-- ============================================================
-- 3. GANTI TRIGGER ANTI-ESKALASI DENGAN COLUMN PRIVILEGE
--    Trigger lama (001) memblokir SEMUA perubahan role oleh non-admin
--    — termasuk di dalam RPC trusted (trigger tetap berjalan di dalam
--    SECURITY DEFINER). Diganti mekanisme yang lebih kuat: client
--    tidak punya privilege UPDATE pada kolom role/status sama sekali.
--    RPC definer (postgres) tidak terpengaruh column privilege.
-- ============================================================
DROP TRIGGER IF EXISTS trg_no_role_escalation ON public.profiles;
DROP FUNCTION IF EXISTS public.prevent_role_escalation();

REVOKE UPDATE ON TABLE public.profiles FROM authenticated;
REVOKE UPDATE ON TABLE public.profiles FROM anon;
-- Satu-satunya kolom yang boleh diubah user dari client:
-- (dipakai halaman Pengaturan & pelengkapan data saat verifikasi)
GRANT UPDATE (full_name, class_name, avatar_url) ON TABLE public.profiles TO authenticated;

-- ============================================================
-- 4. RPC: KLAIM ROLE SAAT OAUTH (status-aware)
--    Dipanggil /auth/oauth-role setelah Google OAuth dari /daftar.
--    Supabase selalu membuat auth.users untuk identitas Google baru →
--    profil baru (trigger) selalu student+pending. Klaim hanya
--    menetapkan role PENGAJUAN; status tetap 'pending' sampai user
--    submit form pendaftaran (complete_signup, 4c).
--    Return:
--      'claimed'  → role pengajuan diterapkan pada akun baru → lanjut
--                   ke form lengkapi data (/daftar/lengkapi)
--      'existing' → email sudah terdaftar sebelumnya; TIDAK ada role/
--                   verification kedua yang dibuat/diubah.
--                   Satu email = satu akun = satu role (kebijakan KANUM).
-- ============================================================
CREATE OR REPLACE FUNCTION public.claim_signup_role(p_role TEXT)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  IF p_role NOT IN ('teacher', 'student') THEN
    RAISE EXCEPTION 'Role tidak valid' USING ERRCODE = '22023';
  END IF;

  UPDATE public.profiles
  SET role = p_role
  WHERE id = auth.uid()
    AND role = 'student'
    AND status = 'pending'
    AND created_at > now() - INTERVAL '10 minutes'
  RETURNING role INTO v_role;

  IF v_role IS NOT NULL THEN
    RETURN 'claimed';
  END IF;

  -- Bukan akun baru (atau sudah pernah diproses) → existing account.
  -- Jangan ubah apa pun: role/status existing tetap.
  RETURN 'existing';
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_signup_role(TEXT) TO authenticated;

-- ============================================================
-- 4c. RPC: FINALISASI FORM PENDAFTARAN (complete_signup)
--     Form pendaftaran HANYA pengumpul data — bukan autentikasi
--     email/password, tanpa SMTP. Authentication sudah selesai via
--     Google OAuth; klaim role sudah lewat (/auth/oauth-role).
--     Validasi di sisi DB:
--       - hanya akun baru (≤10 menit) yang masih student+pending
--       - nama wajib; kelas hanya relevan untuk siswa
--     Aktivasi (authority DB):
--       student → approved  (siswa langsung aktif → /dashboard)
--       teacher → tetap pending (menunggu verifikasi Admin → /verifikasi)
--     Return: status final ('approved' | 'pending').
-- ============================================================
CREATE OR REPLACE FUNCTION public.complete_signup(
  p_full_name TEXT,
  p_class_name TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_status TEXT;
BEGIN
  IF p_full_name IS NULL OR length(btrim(p_full_name)) < 3 THEN
    RAISE EXCEPTION 'Nama lengkap wajib diisi (minimal 3 karakter)'
      USING ERRCODE = '22023';
  END IF;

  UPDATE public.profiles
  SET full_name = btrim(p_full_name),
      class_name = COALESCE(NULLIF(btrim(COALESCE(p_class_name, '')), ''), class_name)
  WHERE id = auth.uid()
    AND role IN ('student', 'teacher')
    AND status = 'pending'
    AND created_at > now() - INTERVAL '10 minutes'
  RETURNING role INTO v_role;

  IF v_role IS NULL THEN
    RAISE EXCEPTION 'Pendaftaran tidak dapat diproses: akun sudah aktif, sudah diproses, atau sesi kedaluwarsa. Silakan masuk.'
      USING ERRCODE = 'P0002';
  END IF;

  IF v_role = 'student' THEN
    UPDATE public.profiles SET status = 'approved' WHERE id = auth.uid();
    v_status := 'approved';
  ELSE
    v_status := 'pending'; -- guru menunggu verifikasi Admin
  END IF;

  RETURN v_status;
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_signup(TEXT, TEXT) TO authenticated;

-- ============================================================
-- 4b. SATELIT ANTI-DUPLIKAT: satu email = satu profil.
--     Sumber kebenaran utama tetap auth.users.email (unique bawaan
--     Supabase). Index ini lapisan kedua di level profiles.
--     Email kosong ('', warisan data lama) dikecualikan.
-- ============================================================
DO $$
BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS uq_profiles_email
    ON public.profiles (lower(email))
    WHERE email <> '';
EXCEPTION WHEN others THEN
  RAISE WARNING 'uq_profiles_email gagal dibuat: %', SQLERRM;
  RAISE WARNING 'Ada email ganda di profiles — bersihkan duplikat lalu jalankan ulang file ini.';
END $$;

-- ============================================================
-- 5. RPC VERIFIKASI — GERBANG TUNGGAL BEROTORITAS DI DATABASE
-- ============================================================
-- 5a. Antrean pengajuan yang boleh dilihat pemanggil.
--     Siswa TIDAK melalui verifikasi → hanya guru yang pending di sini.
--       admin   → semua pengajuan pending guru
--       teacher → tidak ada (approval guru hanya oleh Admin)
CREATE OR REPLACE FUNCTION public.list_verification_queue()
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  email TEXT,
  class_name TEXT,
  role TEXT,
  status TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.full_name, p.email, p.class_name, p.role, p.status,
         p.avatar_url, p.created_at
  FROM public.profiles p
  WHERE p.status = 'pending'
    AND p.role = 'teacher'
    AND public.is_admin()
  ORDER BY p.created_at ASC;
$$;

GRANT EXECUTE ON FUNCTION public.list_verification_queue() TO authenticated;

-- 5b. Setujui / tolak pengajuan GURU.
--     HANYA admin (guru tidak bisa mengangkat guru lain).
--     Menyetujui/menolak diri sendiri → selalu ditolak.
CREATE OR REPLACE FUNCTION public.set_verification_status(
  p_user_id UUID,
  p_status TEXT
)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target public.profiles;
BEGIN
  IF p_status NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Status tidak valid' USING ERRCODE = '22023';
  END IF;

  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Tidak dapat memverifikasi akun sendiri' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_target FROM public.profiles WHERE id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pengajuan tidak ditemukan' USING ERRCODE = 'P0002';
  END IF;

  IF v_target.status <> 'pending' THEN
    RAISE EXCEPTION 'Pengajuan sudah diproses' USING ERRCODE = 'P0002';
  END IF;

  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Hanya Admin yang berwenang memverifikasi pengajuan guru'
      USING ERRCODE = '42501';
  END IF;
  IF v_target.role <> 'teacher' THEN
    RAISE EXCEPTION 'Hanya pengajuan guru yang melalui verifikasi'
      USING ERRCODE = '22023';
  END IF;

  UPDATE public.profiles
  SET status = p_status
  WHERE id = p_user_id;

  RETURN p_status;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_verification_status(UUID, TEXT) TO authenticated;

-- 5c. Ajukan ulang setelah DITOLAK. Hanya pemilik akun, hanya dari
--     status 'rejected' → kembali 'pending'. Role tidak berubah.
CREATE OR REPLACE FUNCTION public.resubmit_verification()
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status TEXT;
BEGIN
  UPDATE public.profiles
  SET status = 'pending'
  WHERE id = auth.uid() AND status = 'rejected'
  RETURNING status INTO v_status;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Pengajuan ulang hanya untuk akun yang ditolak'
      USING ERRCODE = '42501';
  END IF;

  RETURN v_status;
END;
$$;

GRANT EXECUTE ON FUNCTION public.resubmit_verification() TO authenticated;

-- 5d. Admin mengubah role via UI Kelola Akun (menggantikan update
--     client langsung yang kini diblok column privilege).
--     Role ditetapkan admin = dipercaya → status langsung 'approved'.
CREATE OR REPLACE FUNCTION public.admin_set_role(
  p_user_id UUID,
  p_role TEXT
)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Hanya admin' USING ERRCODE = '42501';
  END IF;

  IF p_role NOT IN ('student', 'teacher', 'admin') THEN
    RAISE EXCEPTION 'Role tidak valid' USING ERRCODE = '22023';
  END IF;

  UPDATE public.profiles
  SET role = p_role, status = 'approved'
  WHERE id = p_user_id
  RETURNING role INTO v_role;

  IF v_role IS NULL THEN
    RAISE EXCEPTION 'Akun tidak ditemukan' USING ERRCODE = 'P0002';
  END IF;

  RETURN v_role;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_role(UUID, TEXT) TO authenticated;

-- ============================================================
-- 6. RLS TAMBAHAN
-- ============================================================
-- 6a. Guru melihat profil siswa (dibutuhkan: antrean verifikasi di UI
--     dan pencarian siswa by-email saat menambah anggota kelas).
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies
                 WHERE tablename='profiles' AND policyname='Guru lihat profil siswa') THEN
    CREATE POLICY "Guru lihat profil siswa" ON public.profiles FOR SELECT
      USING (public.is_teacher() AND role = 'student');
  END IF;
END $$;

-- ============================================================
-- 7. CATATAN MIGRASI
-- ------------------------------------------------------------
-- Akun lama: otomatis 'approved' (default kolom) — akses tak berubah.
-- Akun baru siswa: langsung 'approved'. Akun baru guru: 'pending'.
-- Pending guru lama yang sudah approval guru sebelumnya tetap berlaku.
-- Buat/setujui admin baru dari SQL Editor:
--   UPDATE public.profiles SET role = 'admin', status = 'approved'
--   WHERE email = 'email-admin@domain.com';
-- ============================================================
