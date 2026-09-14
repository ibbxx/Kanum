-- ============================================================
-- KANUM – 006: Fix "infinite recursion detected in policy for
-- relation 'classes'" + pastikan tambah-siswa berfungsi.
-- Jalankan SETELAH 005. Idempotent — aman dijalankan berulang.
--
-- ROOT CAUSE (dari 001_multi_role.sql §5):
--   policy "Siswa lihat kelasnya" (classes, SELECT)
--     → inline EXISTS query class_members
--     → policy "Guru kelola anggota kelasnya" (class_members, FOR ALL
--       = berlaku juga untuk SELECT)
--     → inline EXISTS query classes lagi → ∞ recursion.
--   Inline subquery di dalam policy DIEVALUASI DENGAN RLS aktif,
--   sedangkan fungsi SECURITY DEFINER (owner tabel) melewati RLS —
--   itulah sebabnya is_admin()/is_teacher() tidak pernah rekursif.
--
-- FIX (perilaku TIDAK berubah):
--   Semua referensi antar-tabel di policy kelas/anggota dialihkan
--   lewat helper SECURITY DEFINER. Tidak ada policy yang lagi
--   men-query tabel lain secara inline → recursion mustahil.
--
--   Guru : lihat/buat/kelola kelas miliknya; lihat & kelola anggota
--          kelas miliknya.                    (unchanged)
--   Admin: akses semua kelas & anggota.         (unchanged)
--   Siswa: baca membership miliknya saja.       (unchanged)
--   Tidak ada USING (true), RLS tetap ON di semua tabel.
-- ============================================================

-- ============================================================
-- 1. HELPER SECURITY DEFINER (bypass RLS sebagai owner tabel)
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_class_owner(p_class_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.classes
    WHERE id = p_class_id
      AND (teacher_id = auth.uid() OR public.is_admin())
  );
$$;

CREATE OR REPLACE FUNCTION public.is_class_member(p_class_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.class_members
    WHERE class_id = p_class_id
      AND student_id = auth.uid()
  );
$$;

-- Re-assert is_teacher_of (dipakai policy progres/attempt): pastikan
-- tetap SECURITY DEFINER + STABLE seperti didefinisikan di 001 —
-- melindungi dari drift manual di dashboard.
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

GRANT EXECUTE ON FUNCTION public.is_class_owner(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_class_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_teacher_of(UUID) TO authenticated;

-- ============================================================
-- 2. POLICY CLASSES — recreate dengan semantik yang sama
-- ============================================================
DROP POLICY IF EXISTS "Siswa lihat kelasnya" ON public.classes;
CREATE POLICY "Siswa lihat kelasnya" ON public.classes FOR SELECT
  USING (public.is_class_member(id));

-- "Guru kelola kelasnya" tidak punya subquery inline (teacher_id OR
-- is_admin) — tidak ikut siklus; di-recreate identik agar 006
-- merupakan sumber kebenaran tunggal untuk policy kelas.
DROP POLICY IF EXISTS "Guru kelola kelasnya" ON public.classes;
CREATE POLICY "Guru kelola kelasnya" ON public.classes FOR ALL
  USING (teacher_id = auth.uid() OR public.is_admin())
  WITH CHECK (teacher_id = auth.uid() OR public.is_admin());

-- ============================================================
-- 3. POLICY CLASS_MEMBERS — recreate TANPA inline EXISTS classes
-- ============================================================
DROP POLICY IF EXISTS "Siswa lihat keanggotaannya" ON public.class_members;
CREATE POLICY "Siswa lihat keanggotaannya" ON public.class_members FOR SELECT
  USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Guru kelola anggota kelasnya" ON public.class_members;
CREATE POLICY "Guru kelola anggota kelasnya" ON public.class_members FOR ALL
  USING (public.is_class_owner(class_id))
  WITH CHECK (public.is_class_owner(class_id));

-- ============================================================
-- 4. PROOF: GRAF DEPENDENSI POLICY SETELAH FIX (acyclic)
--   classes    → { teacher_id, is_admin() [definer→profiles bypass],
--                  is_class_member() [definer→class_members bypass] }
--   class_members → { student_id, is_class_owner() [definer→classes bypass] }
--   Tidak ada policy yang men-query tabel ber-policy secara inline.
-- ============================================================

-- ============================================================
-- 5. VERIFIKASI SETELAH RUN
--   SELECT policyname, cmd FROM pg_policies
--   WHERE tablename IN ('classes','class_members') ORDER BY tablename;
--   → 4 baris: 2 classes + 2 class_members.
--
--   DIAGNOSTIK A — siswa stuck pending (penyebab "siswa tak bisa
--   melihat latihan" yang konsisten dengan repo; middleware
--   melempar semua path siswa ke /verifikasi bila status ≠ approved):
--     SELECT email, role, status, created_at FROM public.profiles
--     WHERE role = 'student' AND status <> 'approved';
--   → baris yang muncul = akun siswa yang terblokir middleware.
--     Remediasi existing (tanpa SQL): Admin → Kelola Akun → ubah
--     role ke Siswa (admin_set_role menyetel status = approved).
--
--   DIAGNOSTIK B — drift policy di live DB (bandingkan dengan file):
--     SELECT tablename, policyname, cmd, qual, with_check
--     FROM pg_policies
--     WHERE schemaname='public' ORDER BY tablename, policyname;
-- ============================================================
