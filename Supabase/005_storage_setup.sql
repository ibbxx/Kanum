-- ============================================================
-- KANUM – 005: Storage Setup (question-images) + Pengetatan RLS Nilai
-- Jalankan SETELAH 002_verification_flow.sql. Idempotent — aman
-- dijalankan berulang di Supabase SQL Editor.
--
-- Latar belakang:
--   SoalAdmin.uploadImage mengunggah gambar soal ke bucket
--   `question-images` (path `${user_id}/${questionId}-${timestamp}.ext`,
--   URL publik disimpan di questions.image_url). TIDAK ADA migrasi
--   sebelumnya yang membuat bucket/policy storage → upload selalu
--   gagal ("Bucket not found" / 403). File ini memperbaikinya.
--
-- Bagian:
--   1. Bucket question-images (public read, 5 MB, mime gambar)
--   2. Policy storage.objects: guru/admin upload ke folder sendiri;
--      admin boleh kelola file lama; baca publik (URL <img>)
--   3. Pengetatan RLS database: tutup jalur client menulis langsung
--      data nilai (attempt/answers/progress) — penulisan resmi hanya
--      via RPC SECURITY DEFINER & trigger (keduanya lolos RLS).
-- ============================================================

-- ============================================================
-- 1. BUCKET: question-images
--    public = true → URL publik (getPublicUrl) bisa dirender <img>
--    tanpa signed URL. Limit & mime ditegakkan di layer storage.
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'question-images',
  'question-images',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public            = true,
  file_size_limit   = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================
-- 2. POLICY STORAGE pada storage.objects (hanya bucket ini)
--    - INSERT : guru/admin, HANYA ke folder miliknya (uid/...) —
--               sesuai pola path existing SoalAdmin.
--    - UPDATE : folder sendiri (target juga wajib folder sendiri —
--               tidak bisa menimpa/memindah file orang lain).
--    - DELETE : folder sendiri ATAU admin (admin perlu menghapus
--               gambar soal lama buatan guru lain via UI).
--    - SELECT : publik (bucket memang public — gambar dirender siswa).
--    Tidak ada policy terbuka: tanpa is_teacher() dan tanpa
--    pembatasan folder, INSERT tidak mungkin.
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'KANUM question-images baca publik'
  ) THEN
    CREATE POLICY "KANUM question-images baca publik"
      ON storage.objects FOR SELECT
      TO authenticated
      USING (bucket_id = 'question-images');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'KANUM question-images upload folder sendiri'
  ) THEN
    CREATE POLICY "KANUM question-images upload folder sendiri"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'question-images'
        AND public.is_teacher()  -- teacher + admin
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'KANUM question-images update folder sendiri'
  ) THEN
    CREATE POLICY "KANUM question-images update folder sendiri"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'question-images'
        AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
      )
      WITH CHECK (
        bucket_id = 'question-images'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'KANUM question-images hapus folder sendiri/admin'
  ) THEN
    CREATE POLICY "KANUM question-images hapus folder sendiri/admin"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'question-images'
        AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
      );
  END IF;
END $$;

-- ============================================================
-- 3. PENGETATAN RLS DATABASE (data nilai siswa)
--    Alasan aman: handle_attempt_complete, get_student_quiz, dan
--    submit_student_quiz adalah SECURITY DEFINER — tidak butuh
--    policy client. Policy client justru membuka celah pemalsuan.
-- ============================================================

-- 3a. student_progress: policy "System bisa upsert progres (via trigger)"
--     adalah FOR ALL USING (true) → SIAPA PUN bisa mengubah nilai siswa
--     lain dari console. Trigger tidak membutuhkannya → dihapus.
--     Client tetap bisa SELECT via policy miliknya sendiri (000/001).
DROP POLICY IF EXISTS "System bisa upsert progres (via trigger)"
  ON public.student_progress;

-- 3b. exercise_attempts: client TIDAK pernah INSERT/UPDATE attempt
--     langsung (QuizPlayer memakai RPC get_student_quiz &
--     submit_student_quiz). Policy lama memungkinkan siswa membuat
--     attempt 'completed' ber-skor palsu. Keduanya dihapus; SELECT
--     miliknya tetap utuh (laporan/dashboard).
DROP POLICY IF EXISTS "Siswa bisa buat attempt"
  ON public.exercise_attempts;
DROP POLICY IF EXISTS "Siswa bisa update attempt miliknya"
  ON public.exercise_attempts;

-- 3c. student_answers: penulisan hanya lewat submit_student_quiz.
--     Insert langsung dari client hanya bisa mem-pollute review →
--     ditutup. SELECT miliknya tetap utuh.
DROP POLICY IF EXISTS "Siswa bisa insert jawaban ke attempt miliknya"
  ON public.student_answers;

-- ============================================================
-- 4. VERIFIKASI SETELAH RUN
-- ============================================================
-- Bucket (harus 1 baris, public = t):
--   SELECT id, public, file_size_limit, allowed_mime_types
--   FROM storage.buckets WHERE id = 'question-images';
--
-- Policy (harus 4 baris):
--   SELECT policyname FROM pg_policies
--   WHERE schemaname='storage' AND tablename='objects'
--     AND policyname LIKE 'KANUM question-images%';
--
-- RLS nilai (harus TIDAK mengembalikan baris):
--   SELECT policyname FROM pg_policies
--   WHERE tablename IN ('student_progress','exercise_attempts','student_answers')
--     AND cmd IN ('INSERT','UPDATE','ALL')
--     AND policyname NOT LIKE 'Admin%';
-- ============================================================
