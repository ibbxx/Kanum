-- ============================================================
-- KANUM – Migrasi Multi-Role (siswa / guru / admin) + Kelas
-- Idempotent — aman dijalankan berulang di Supabase SQL Editor.
-- Jalankan SETELAH schema.sql.
-- ============================================================

-- ============================================================
-- 1. ROLE 'teacher' PADA PROFILES
-- ============================================================
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'teacher', 'student'));

-- ============================================================
-- 2. HELPER: is_teacher (is_teacher_of dibuat SETELAH tabel kelas, lihat bagian 3)
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('teacher', 'admin')
  );
$$;

-- ============================================================
-- 3. TABEL KELAS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.classes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  teacher_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_classes_teacher ON public.classes(teacher_id);

DROP TRIGGER IF EXISTS trg_classes_updated ON public.classes;
CREATE TRIGGER trg_classes_updated
  BEFORE UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public.class_members (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id    UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (class_id, student_id)
);
CREATE INDEX IF NOT EXISTS idx_members_class   ON public.class_members(class_id);
CREATE INDEX IF NOT EXISTS idx_members_student ON public.class_members(student_id);

-- Guru adalah pengampu kelas yang memuat siswa tsb? (admin dianggap lolos)
-- Didefinisikan di sini karena mereferensikan class_members & classes.
CREATE OR REPLACE FUNCTION public.is_teacher_of(p_student_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin() OR EXISTS (
    SELECT 1
    FROM public.class_members cm
    JOIN public.classes c ON c.id = cm.class_id
    WHERE cm.student_id = p_student_id
      AND c.teacher_id = auth.uid()
  );
$$;

-- ============================================================
-- 4. TRIGGER PENDAFTARAN: guru → 'teacher' (bukan 'admin')
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
    WHEN v_raw_role IN ('admin')  THEN 'admin'
    WHEN v_raw_role IN ('teacher', 'guru') THEN 'teacher'
    ELSE 'student'
  END;

  INSERT INTO public.profiles (id, full_name, email, role, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(COALESCE(NEW.email, ''), '@', 1),
      ''
    ),
    COALESCE(NEW.email, ''),
    v_db_role,
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

  RETURN NEW;
END;
$$;

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
    WHEN v_raw IN ('admin') THEN 'admin'
    WHEN v_raw IN ('teacher', 'guru') THEN 'teacher'
    ELSE 'student'
  END;

  INSERT INTO public.profiles (id, full_name, email, role, avatar_url)
  VALUES (
    uid,
    COALESCE(meta->>'full_name', meta->>'name', split_part(COALESCE(auth.jwt()->>'email', ''), '@', 1), ''),
    COALESCE(auth.jwt()->>'email', ''),
    v_role,
    COALESCE(meta->>'avatar_url', meta->>'picture')
  )
  ON CONFLICT (id) DO NOTHING;

  SELECT * INTO v_row FROM public.profiles WHERE id = uid;
  RETURN v_row;
END;
$$;

-- ============================================================
-- 5. RLS TABEL KELAS
-- ============================================================
ALTER TABLE public.classes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='classes' AND policyname='Siswa lihat kelasnya') THEN
    CREATE POLICY "Siswa lihat kelasnya" ON public.classes FOR SELECT
      USING (EXISTS (SELECT 1 FROM public.class_members cm WHERE cm.class_id = classes.id AND cm.student_id = auth.uid()));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='classes' AND policyname='Guru kelola kelasnya') THEN
    CREATE POLICY "Guru kelola kelasnya" ON public.classes FOR ALL
      USING (teacher_id = auth.uid() OR public.is_admin())
      WITH CHECK (teacher_id = auth.uid() OR public.is_admin());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='class_members' AND policyname='Siswa lihat keanggotaannya') THEN
    CREATE POLICY "Siswa lihat keanggotaannya" ON public.class_members FOR SELECT
      USING (student_id = auth.uid());
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='class_members' AND policyname='Guru kelola anggota kelasnya') THEN
    CREATE POLICY "Guru kelola anggota kelasnya" ON public.class_members FOR ALL
      USING (EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_members.class_id AND (c.teacher_id = auth.uid() OR public.is_admin())))
      WITH CHECK (EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_members.class_id AND (c.teacher_id = auth.uid() OR public.is_admin())));
  END IF;
END $$;

-- ============================================================
-- 6. RLS KONTEN: pemilik (teacher) bisa kelola miliknya
-- ============================================================
-- exercises
DROP POLICY IF EXISTS "Pemilik kelola latihannya" ON public.exercises;
CREATE POLICY "Pemilik kelola latihannya" ON public.exercises FOR ALL
  USING (created_by = auth.uid() OR public.is_admin())
  WITH CHECK (created_by = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Guru lihat semua latihan published+draft sendiri" ON public.exercises;
CREATE POLICY "Guru lihat semua latihan published+draft sendiri" ON public.exercises FOR SELECT
  USING (is_published = true OR created_by = auth.uid() OR public.is_admin());

-- questions
DROP POLICY IF EXISTS "Pemilik kelola soal miliknya" ON public.questions;
CREATE POLICY "Pemilik kelola soal miliknya" ON public.questions FOR ALL
  USING (EXISTS (SELECT 1 FROM public.exercises e WHERE e.id = questions.exercise_id AND (e.created_by = auth.uid() OR public.is_admin())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.exercises e WHERE e.id = questions.exercise_id AND (e.created_by = auth.uid() OR public.is_admin())));

-- question_options
DROP POLICY IF EXISTS "Pemilik kelola opsi miliknya" ON public.question_options;
CREATE POLICY "Pemilik kelola opsi miliknya" ON public.question_options FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.questions q
    JOIN public.exercises e ON e.id = q.exercise_id
    WHERE q.id = question_options.question_id AND (e.created_by = auth.uid() OR public.is_admin())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.questions q
    JOIN public.exercises e ON e.id = q.exercise_id
    WHERE q.id = question_options.question_id AND (e.created_by = auth.uid() OR public.is_admin())
  ));

-- materi & budaya
DROP POLICY IF EXISTS "Pemilik kelola materinya" ON public.materi;
CREATE POLICY "Pemilik kelola materinya" ON public.materi FOR ALL
  USING (created_by = auth.uid() OR public.is_admin())
  WITH CHECK (created_by = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Pemilik kelola budayanya" ON public.budaya;
CREATE POLICY "Pemilik kelola budayanya" ON public.budaya FOR ALL
  USING (created_by = auth.uid() OR public.is_admin())
  WITH CHECK (created_by = auth.uid() OR public.is_admin());

-- ============================================================
-- 7. RLS ATTEMPTS/PROGRES: guru lihat siswa kelasnya
-- ============================================================
DROP POLICY IF EXISTS "Guru lihat progres siswa kelasnya" ON public.student_progress;
CREATE POLICY "Guru lihat progres siswa kelasnya" ON public.student_progress FOR SELECT
  USING (student_id = auth.uid() OR public.is_admin() OR public.is_teacher_of(student_id));

DROP POLICY IF EXISTS "Guru lihat attempt siswa kelasnya" ON public.exercise_attempts;
CREATE POLICY "Guru lihat attempt siswa kelasnya" ON public.exercise_attempts FOR SELECT
  USING (student_id = auth.uid() OR public.is_admin() OR public.is_teacher_of(student_id));

-- ============================================================
-- 8. ANTI-ESKALASI ROLE + KLAIM ROLE PASCA-SIGNUP
-- ============================================================
-- User biasa TIDAK BOLEH mengubah role sendiri (policy UPDATE own
-- memperbolehkan update baris sendiri — trigger ini menutup celahnya).
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role <> OLD.role AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Perubahan role hanya oleh admin' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_no_role_escalation ON public.profiles;
CREATE TRIGGER trg_no_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_escalation();

-- Gate OAuth (/auth/oauth-role) memakai RPC ini: boleh set role HANYA untuk
-- akun yang baru dibuat (≤10 menit) dan masih role default 'student'.
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
    AND created_at > now() - INTERVAL '10 minutes'
  RETURNING role INTO v_role;

  IF v_role IS NULL THEN
    SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  END IF;
  RETURN COALESCE(v_role, 'student');
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_signup_role(TEXT) TO authenticated;

-- ============================================================
-- 9. GRANT & REVIEW AKUN LAMA
-- ============================================================
GRANT EXECUTE ON FUNCTION public.is_teacher_of(UUID) TO authenticated;

-- ------------------------------------------------------------
-- REVIEW AKUN ADMIN LAMA (jalankan manual, ganti email):
-- Semua role='admin' eksisting dianggap admin sungguhan.
-- Turunkan yang sebenarnya GURU dengan:
--
-- UPDATE public.profiles SET role = 'teacher' WHERE email = 'email-guru@x.com';
--
-- Lihat daftar akun admin untuk direview:
-- SELECT email, full_name, created_at FROM public.profiles WHERE role = 'admin' ORDER BY created_at;
-- ------------------------------------------------------------
