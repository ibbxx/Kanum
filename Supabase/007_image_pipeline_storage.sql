-- ============================================================
-- KANUM – 007: Storage untuk gambar materi & budaya + Image Pipeline
-- Jalankan SETELAH 005_storage_setup.sql. Idempotent.
--
-- Latar belakang:
--   Pipeline gambar baru (lib/image/*) mengompres setiap upload ≤ 300 KB
--   di browser sebelum file dikirim ke Storage. Selain question-images,
--   kini MateriAdmin & BudayaAdmin mengupload ke bucket sendiri:
--     - materi-images  : gambar materi (MateriAdmin)
--     - budaya-images  : gambar budaya (BudayaAdmin)
--   Path: `${auth.uid()}/${entityKey}-${timestamp}.<ext>` — sama dengan
--   pola question-images.
--
-- Catatan pipeline (tanpa perubahan schema DB):
--   - question-images file_size_limit 5 MB tetap; kompresi memastikan
--     file final ≤ 300 KB jauh di bawah limit bucket.
--   - Schema tabel tidak berubah: image_url TEXT tetap dipakai.
-- ============================================================

-- ============================================================
-- 1. BUCKET materi-images & budaya-images (public read, gambar saja)
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('materi-images', 'materi-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]),
  ('budaya-images', 'budaya-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[])
ON CONFLICT (id) DO UPDATE SET
  public             = true,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================
-- 2. POLICY storage.objects (pola identik 005, per bucket, idempotent)
-- ============================================================
DO $$
DECLARE
  b TEXT;
BEGIN
  FOREACH b IN ARRAY ARRAY['materi-images', 'budaya-images'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'storage' AND tablename = 'objects'
        AND policyname = 'KANUM ' || b || ' baca publik'
    ) THEN
      EXECUTE format('
        CREATE POLICY "KANUM %s baca publik"
          ON storage.objects FOR SELECT
          USING (bucket_id = %L);', b, b);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'storage' AND tablename = 'objects'
        AND policyname = 'KANUM ' || b || ' upload folder sendiri'
    ) THEN
      EXECUTE format('
        CREATE POLICY "KANUM %s upload folder sendiri"
          ON storage.objects FOR INSERT
          TO authenticated
          WITH CHECK (
            bucket_id = %L
            AND public.is_teacher()
            AND (storage.foldername(name))[1] = auth.uid()::text
          );', b, b);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'storage' AND tablename = 'objects'
        AND policyname = 'KANUM ' || b || ' update folder sendiri'
    ) THEN
      EXECUTE format('
        CREATE POLICY "KANUM %s update folder sendiri"
          ON storage.objects FOR UPDATE
          TO authenticated
          USING (
            bucket_id = %L
            AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
          )
          WITH CHECK (
            bucket_id = %L
            AND (storage.foldername(name))[1] = auth.uid()::text
          );', b, b, b);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'storage' AND tablename = 'objects'
        AND policyname = 'KANUM ' || b || ' hapus folder sendiri/admin'
    ) THEN
      EXECUTE format('
        CREATE POLICY "KANUM %s hapus folder sendiri/admin"
          ON storage.objects FOR DELETE
          TO authenticated
          USING (
            bucket_id = %L
            AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
          );', b, b);
    END IF;
  END LOOP;
END $$;

-- ============================================================
-- 3. VERIFIKASI SETELAH RUN
-- ============================================================
-- Bucket (harus 2 baris, public = t):
--   SELECT id, public, file_size_limit, allowed_mime_types
--   FROM storage.buckets WHERE id IN ('materi-images', 'budaya-images');
--
-- Policy (harus 8 baris):
--   SELECT policyname FROM pg_policies
--   WHERE schemaname='storage' AND tablename='objects'
--     AND policyname LIKE 'KANUM materi-images%'
--      OR policyname LIKE 'KANUM budaya-images%';
-- ============================================================
