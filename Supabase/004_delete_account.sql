-- ============================================================
-- KANUM – 004: Hapus Akun (Admin) + Proteksi Admin Terakhir
-- Jalankan SETELAH 002_verification_flow.sql. Idempotent.
--
-- Aturan:
--   Hanya admin yang boleh menghapus akun (via UI Kelola Akun).
--   AKUN ADMIN TIDAK BISA DIHAPUS selama masih jadi satu-satunya
--   admin — sistem harus selalu punya minimal 1 admin.
--   Menghapus diri sendiri juga ditolak.
--
-- Cascade yang menyertai (FK ON DELETE CASCADE existing):
--   profiles → classes, class_members, exercise_attempts,
--   student_answers (via attempts), student_progress,
--   exercises/questions/options miliknya (created_by),
--   materi/budaya miliknya, serta BARIS auth.users-nya
--   (menghapus auth users otomatis menghapus profiles via FK).
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_delete_account(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target RECORD;
  v_admin_count INT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Hanya admin' USING ERRCODE = '42501';
  END IF;

  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Tidak dapat menghapus akun sendiri' USING ERRCODE = '42501';
  END IF;

  SELECT id, email, role INTO v_target
  FROM public.profiles WHERE id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Akun tidak ditemukan' USING ERRCODE = 'P0002';
  END IF;

  -- Proteksi admin: hitung admin tersisa bila target adalah admin.
  IF v_target.role = 'admin' THEN
    SELECT COUNT(*) INTO v_admin_count FROM public.profiles WHERE role = 'admin';
    IF v_admin_count <= 1 THEN
      RAISE EXCEPTION 'Admin terakhir tidak dapat dihapus — sistem butuh minimal satu admin'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  -- Hapus dari auth.users → FK ON DELETE CASCADE membersihkan
  -- profiles dan seluruh data terkait.
  DELETE FROM auth.users WHERE id = p_user_id;

  RETURN v_target.email;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_account(UUID) TO authenticated;
