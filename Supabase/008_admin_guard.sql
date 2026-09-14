-- ============================================================
-- KANUM – 008: Hard Guard "Minimal 1 Approved Admin"
-- Jalankan SETELAH 002/004/006. Idempotent — aman dijalankan berulang.
--
-- ATURAN:
--   MIN_APPROVED_ADMINS = 1. Jumlah admin approved TIDAK PERNAH boleh
--   menjadi 0 — berlaku untuk SEMUA jalur mutasi:
--     - RPC admin_set_role / admin_delete_account (diperkuat di sini)
--     - UPDATE langsung role/status di SQL Editor dashboard
--     - DELETE baris profiles langsung
--     - DELETE auth.users (cascade FK → profiles) — trigger di profiles
--       tetap berjalan saat cascade.
--   Akun admin yang PERTAMA dibuat manual via SQL Editor tetap sah:
--   guard hanya MELARANG transisi menuju 0, bukan transisi menuju 1
--   dari 0 (bootstrap tetap mungkin).
--
-- PESAN WAJIB (sesuai spesifikasi):
--   "Admin terakhir tidak dapat dihapus atau diturunkan. Sistem harus
--    memiliki minimal satu admin."
--
-- RACE CONDITION:
--   pg_advisory_xact_lock meng serialisasi semua mutasi role/status/
--   delete profiles dalam SATU transaksi — dua transaksi yang bersamaan
--   tidak mungkin sama-sama lolos pemeriksaan count lalu menyisakan
--   0 admin (CHECK/TABLE CONSTRAINT BUKAN digunakan karena perlu
--   melarang pola "masuk 0", bukan nilai kolom tunggal).
-- ============================================================

-- ============================================================
-- 1. KONSTANTA + HELPER
-- ============================================================
CREATE OR REPLACE FUNCTION public.min_approved_admins()
RETURNS INT
LANGUAGE sql STABLE
SET search_path = public
AS $$ SELECT 1 $$;

-- Hitung admin approved SAAT INI (statemen ke-1 dalam transaksi guard
-- memegang advisory lock, sehingga snapshot tidak bisa berubah di
-- tengah pemeriksaan → anti-race).
CREATE OR REPLACE FUNCTION public.count_approved_admins()
RETURNS INT
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INT FROM public.profiles
  WHERE role = 'admin' AND status = 'approved';
$$;

-- ============================================================
-- 2. TRIGGER GUARD — BEFORE UPDATE / DELETE / INSERT pada profiles
--    Menolak transisi apa pun yang menghasilkan 0 admin approved.
-- ============================================================
CREATE OR REPLACE FUNCTION public.guard_min_approved_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_admins_after INT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- INSERT tidak bisa menurunkan jumlah admin → selalu aman
    -- (termasuk bootstrap pertama admin).
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- Berpotensi menurunkan jumlah admin HANYA bila baris target
    -- adalah admin approved SEKARANG dan TIDAK LAGI admin approved
    -- setelah UPDATE (role diturunkan, atau status ditarik dari
    -- approved). Perubahan lain (student→admin dsb.) hanya
    -- menaikkan jumlah → tidak perlu dicek.
    IF (OLD.role = 'admin' AND OLD.status = 'approved')
       AND NOT (NEW.role = 'admin' AND NEW.status = 'approved') THEN

      PERFORM pg_advisory_xact_lock(908001);
      SELECT COUNT(*) INTO v_admins_after
      FROM public.profiles p
      WHERE (p.role = 'admin' AND p.status = 'approved')
        AND p.id <> NEW.id;
      IF v_admins_after < public.min_approved_admins() THEN
        RAISE EXCEPTION
          'Admin terakhir tidak dapat dihapus atau diturunkan. Sistem harus memiliki minimal satu admin.'
          USING ERRCODE = 'P0001';
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  -- TG_OP = 'DELETE'
  IF (OLD.role = 'admin' AND OLD.status = 'approved') THEN
    PERFORM pg_advisory_xact_lock(908001);
    SELECT COUNT(*) INTO v_admins_after
    FROM public.profiles p
    WHERE p.role = 'admin' AND p.status = 'approved'
      AND p.id <> OLD.id;
    IF v_admins_after < public.min_approved_admins() THEN
      RAISE EXCEPTION
        'Admin terakhir tidak dapat dihapus atau diturunkan. Sistem harus memiliki minimal satu admin.'
        USING ERRCODE = 'P0001';
    END IF;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_min_approved_admin ON public.profiles;
CREATE TRIGGER trg_min_approved_admin
  BEFORE INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_min_approved_admin();

-- ============================================================
-- 3. RPC admin_set_role — PERKUATAN
--    (002 §5d): verifikasi kewenangan + minimum-admin + atomik.
--    Trigger guard di atas adalah lapisan kedua (DB-wide); RPC ini
--    memberi pesan & validasi yang eksplisit untuk UI.
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_set_role(
  p_user_id UUID,
  p_role TEXT
)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target public.profiles;
  v_caller_is_admin BOOLEAN;
  v_new_role TEXT;
BEGIN
  -- Serialisasi seluruh operasi (cek kewenangan → mutate) dalam satu
  -- transaksi; trigger guard memegang lock yang sama → anti-race.
  PERFORM pg_advisory_xact_lock(908001);

  SELECT (role = 'admin' AND status = 'approved')
    INTO v_caller_is_admin
  FROM public.profiles WHERE id = auth.uid();
  IF v_caller_is_admin IS NOT TRUE THEN
    RAISE EXCEPTION 'Hanya admin' USING ERRCODE = '42501';
  END IF;

  IF p_role NOT IN ('student', 'teacher', 'admin') THEN
    RAISE EXCEPTION 'Role tidak valid' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_target FROM public.profiles WHERE id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Akun tidak ditemukan' USING ERRCODE = 'P0002';
  END IF;

  UPDATE public.profiles
  SET role = p_role, status = 'approved'
  WHERE id = p_user_id
  RETURNING role INTO v_new_role;

  RETURN v_new_role;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_role(UUID, TEXT) TO authenticated;

-- ============================================================
-- 4. RPC admin_delete_account — PERKUATAN (ganti 004)
--    FIX: hitung admin APPROVED (004 menghitung role='admin' saja —
--    baris admin pending/rejected menggelembungkan count sehingga
--    admin approved TERAKHIR bisa terhapus). Lock yang sama → anti-race.
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_delete_account(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target RECORD;
BEGIN
  PERFORM pg_advisory_xact_lock(908001);

  -- Caller harus ADMIN APPROVED (bukan sekadar baris role='admin' yang
  -- pending/rejected — status non-approved bukan admin fungsional).
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND status = 'approved'
  ) THEN
    RAISE EXCEPTION 'Hanya admin' USING ERRCODE = '42501';
  END IF;

  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Tidak dapat menghapus akun sendiri' USING ERRCODE = '42501';
  END IF;

  SELECT id, email, role, status INTO v_target
  FROM public.profiles WHERE id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Akun tidak ditemukan' USING ERRCODE = 'P0002';
  END IF;

  IF v_target.role = 'admin' AND v_target.status = 'approved' THEN
    IF public.count_approved_admins() <= public.min_approved_admins() THEN
      RAISE EXCEPTION
        'Admin terakhir tidak dapat dihapus atau diturunkan. Sistem harus memiliki minimal satu admin.'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  -- Hapus dari auth.users → FK ON DELETE CASCADE membersihkan profiles
  -- + seluruh data terkait (perilaku 004 tetap). DELETE baris profiles
  -- hasil cascade melewati trigger guard (lapisan cek di atas sudah
  -- memastikan ≥1 admin tersisa).
  DELETE FROM auth.users WHERE id = p_user_id;

  RETURN v_target.email;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_account(UUID) TO authenticated;

-- ============================================================
-- 5. CATATAN KEAMANAN / STATUS ADMIN
--    - role='admin' + status≠'approved' TIDAK dianggap admin fungsional
--      (accessStateFor: admin selalu 'approved' di aplikasi — tetap).
--    - Bootstrap: bila DB belum punya admin approved, guard IZINKAN
--      pembuatan admin pertama (UPDATE/INSERT menuju 1 dari 0).
--    - Pesan error sama dipakai UI: pesan exception langsung ditampilkan
--      KelolaAkun via showToast(error.message).
-- ============================================================

-- ============================================================
-- 6. VERIFIKASI SETELAH RUN
--    a) Trigger terpasang (harus 1 baris):
--       SELECT tgname FROM pg_trigger
--       WHERE tgrelid = 'public.profiles'::regclass AND NOT tgisinternal;
--
--    b) Batas tercapai — sebagai admin, turunkan diri sendiri:
--       SELECT public.admin_set_role('<uuid-admin-anda>', 'student');
--       → HARUS error "Admin terakhir tidak dapat dihapus atau
--         diturunkan. Sistem harus memiliki minimal satu admin."
--
--    c) Bootstrap masih jalan (hanya di DB tanpa admin approved):
--       UPDATE public.profiles SET role='admin', status='approved'
--       WHERE email='<email>';  → HARUS BERHASIL.
-- ============================================================
