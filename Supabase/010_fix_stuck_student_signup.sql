-- ============================================================
-- KANUM – 010: Perbaikan alur pendaftaran siswa yang "tersangkut"
-- Jalankan di Supabase → SQL Editor. Idempotent (aman diulang).
--
-- Root cause (forensik 2026-09-15):
--   Sejak fb9d698 ("siswa langsung aktif"), satu-satunya aktivasi akun
--   siswa adalah RPC complete_signup yang mensyaratkan akun dibuat
--   ≤10 menit sebelumnya. Siswa yang gagal/tidak menyelesaikan form
--   /daftar/lengkapi dalam 10 menit terkunci permanen:
--     - RPC menolak ("sesi kedaluwarsa") saat dicoba ulang,
--     - antrean verifikasi admin hanya memuat guru (list_verification_queue
--       memfilter role='teacher'),
--     - set_verification_status menolak target non-guru.
--   Tidak ada jalur pemulihan di mana pun → akun pending selamanya.
--
-- Perbaikan (minimal, TIDAK melemahkan keamanan):
--   1. complete_signup: siswa dengan status 'pending' dapat menyelesaikan
--      pendaftaran TANPA batas usia akun. Aktivasi tetap terjadi di
--      database (SECURITY DEFINER), role tetap ditentukan DB, client
--      tidak pernah bisa mengubah role/status sendiri.
--   2. Guru TETAP memakai jendela 10 menit: pending guru adalah status
--      verifikasi yang sah dan diproses Admin lewat antrean (tetap ada).
--   3. Tidak ada perubahan RLS, policy, trigger, role, atau fungsi lain.
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
BEGIN
  IF p_full_name IS NULL OR length(btrim(p_full_name)) < 3 THEN
    RAISE EXCEPTION 'Nama lengkap wajib diisi (minimal 3 karakter)'
      USING ERRCODE = '22023';
  END IF;

  -- 1) SISWA: tanpa batas usia akun — memulihkan akun siswa yang
  --    tersangkut pending. Tetap wajib role='student' + status='pending';
  --    aktivasi ke 'approved' hanya untuk role student (aturan DB).
  UPDATE public.profiles
  SET full_name = btrim(p_full_name),
      class_name = COALESCE(NULLIF(btrim(COALESCE(p_class_name, '')), ''), class_name)
  WHERE id = auth.uid()
    AND role = 'student'
    AND status = 'pending'
  RETURNING role INTO v_role;

  IF v_role IS NOT NULL THEN
    UPDATE public.profiles SET status = 'approved' WHERE id = auth.uid();
    RETURN 'approved';
  END IF;

  -- 2) GURU: perilaku lama dipertahankan — hanya akun baru (≤10 menit)
  --    yang boleh submit form. Siswa yang mengklaim role guru lalu
  --    melewatkan jendela tetap 'pending' dan diproses Admin via antrean
  --    verifikasi (bukan terkunci).
  UPDATE public.profiles
  SET full_name = btrim(p_full_name),
      class_name = COALESCE(NULLIF(btrim(COALESCE(p_class_name, '')), ''), class_name)
  WHERE id = auth.uid()
    AND role = 'teacher'
    AND status = 'pending'
    AND created_at > now() - INTERVAL '10 minutes'
  RETURNING role INTO v_role;

  IF v_role IS NULL THEN
    RAISE EXCEPTION 'Pendaftaran tidak dapat diproses: akun sudah aktif, sudah diproses, atau sesi kedaluwarsa. Silakan masuk.'
      USING ERRCODE = 'P0002';
  END IF;

  RETURN 'pending'; -- guru menunggu verifikasi Admin
END;
$$;

-- Grant lama tetap berlaku; dinyatakan ulang agar file ini idempotent penuh.
GRANT EXECUTE ON FUNCTION public.complete_signup(TEXT, TEXT) TO authenticated;

-- ============================================================
-- VERIFIKASI SETELAH RUN:
--   1. Fungsi terpasang:
--      SELECT pg_get_function_identity_arguments(oid), prosecdef
--      FROM pg_proc WHERE proname = 'complete_signup';
--      → "(p_full_name text, p_class_name text DEFAULT NULL::text)", true
--   2. Uji siswa tersangkut: login sebagai siswa pending → /verifikasi
--      → klik "Lengkapi Pendaftaran" → submit → status menjadi approved.
-- ============================================================
