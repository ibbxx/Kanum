-- ============================================================
-- KANUM – Supabase Schema (Idempotent)
-- Aman dijalankan berulang kali di Supabase SQL Editor
-- ============================================================

-- Enable uuid extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- FUNGSI HELPER – updated_at (dibuat dulu, dipakai trigger)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- FUNGSI HELPER – cek admin
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ============================================================
-- 1. PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL DEFAULT '',
  email       TEXT NOT NULL DEFAULT '',
  class_name  TEXT NOT NULL DEFAULT '',
  role        TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'student')),
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

DROP TRIGGER IF EXISTS trg_profiles_updated ON public.profiles;
CREATE TRIGGER trg_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 2. EXERCISES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.exercises (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  category      TEXT NOT NULL DEFAULT 'Umum',
  difficulty    TEXT NOT NULL DEFAULT 'Sedang' CHECK (difficulty IN ('Mudah', 'Sedang', 'Sulit')),
  time_limit    INT NOT NULL DEFAULT 30,
  max_attempts  INT NOT NULL DEFAULT 0,
  passing_score INT NOT NULL DEFAULT 70,
  is_published  BOOLEAN NOT NULL DEFAULT false,
  sort_order    INT NOT NULL DEFAULT 0,
  created_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exercises_published ON public.exercises(is_published);
CREATE INDEX IF NOT EXISTS idx_exercises_category  ON public.exercises(category);

DROP TRIGGER IF EXISTS trg_exercises_updated ON public.exercises;
CREATE TRIGGER trg_exercises_updated
  BEFORE UPDATE ON public.exercises
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 3. QUESTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.questions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  question    TEXT NOT NULL,
  image_url   TEXT,
  explanation TEXT NOT NULL DEFAULT '',
  points      INT NOT NULL DEFAULT 10,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tambah kolom image_url jika belum ada (migrasi aman)
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS image_url TEXT;

CREATE INDEX IF NOT EXISTS idx_questions_exercise ON public.questions(exercise_id);
CREATE INDEX IF NOT EXISTS idx_questions_order    ON public.questions(exercise_id, sort_order);

DROP TRIGGER IF EXISTS trg_questions_updated ON public.questions;
CREATE TRIGGER trg_questions_updated
  BEFORE UPDATE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 4. QUESTION_OPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.question_options (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct  BOOLEAN NOT NULL DEFAULT false,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_options_question ON public.question_options(question_id);

-- ============================================================
-- 5. EXERCISE_ATTEMPTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.exercise_attempts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exercise_id   UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  student_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'timed_out')),
  score         NUMERIC(5,2) NOT NULL DEFAULT 0,
  total_points  INT NOT NULL DEFAULT 0,
  earned_points INT NOT NULL DEFAULT 0,
  correct_count INT NOT NULL DEFAULT 0,
  wrong_count   INT NOT NULL DEFAULT 0,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_attempts_student  ON public.exercise_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_attempts_exercise ON public.exercise_attempts(exercise_id);
CREATE INDEX IF NOT EXISTS idx_attempts_status   ON public.exercise_attempts(status);

-- ============================================================
-- 6. STUDENT_ANSWERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.student_answers (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id    UUID NOT NULL REFERENCES public.exercise_attempts(id) ON DELETE CASCADE,
  question_id   UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  option_id     UUID REFERENCES public.question_options(id) ON DELETE SET NULL,
  is_correct    BOOLEAN NOT NULL DEFAULT false,
  points_earned INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (attempt_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_answers_attempt  ON public.student_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_answers_question ON public.student_answers(question_id);

-- ============================================================
-- 7. STUDENT_PROGRESS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.student_progress (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exercise_id    UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  attempts_count INT NOT NULL DEFAULT 0,
  best_score     NUMERIC(5,2) NOT NULL DEFAULT 0,
  last_score     NUMERIC(5,2) NOT NULL DEFAULT 0,
  is_completed   BOOLEAN NOT NULL DEFAULT false,
  first_attempt  TIMESTAMPTZ,
  last_attempt   TIMESTAMPTZ,
  UNIQUE(student_id, exercise_id)
);

CREATE INDEX IF NOT EXISTS idx_progress_student  ON public.student_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_progress_exercise ON public.student_progress(exercise_id);

-- ============================================================
-- 8. MATERI
-- ============================================================
CREATE TABLE IF NOT EXISTS public.materi (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title            TEXT NOT NULL,
  chapter_number   INT NOT NULL DEFAULT 0,
  level            TEXT NOT NULL DEFAULT 'dasar' CHECK (level IN ('dasar', 'menengah', 'lanjut')),
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

CREATE INDEX IF NOT EXISTS idx_materi_published ON public.materi(is_published);
CREATE INDEX IF NOT EXISTS idx_materi_sort      ON public.materi(sort_order);

DROP TRIGGER IF EXISTS trg_materi_updated ON public.materi;
CREATE TRIGGER trg_materi_updated
  BEFORE UPDATE ON public.materi
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 9. BUDAYA
-- ============================================================
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

CREATE INDEX IF NOT EXISTS idx_budaya_published ON public.budaya(is_published);
CREATE INDEX IF NOT EXISTS idx_budaya_sort      ON public.budaya(sort_order);
CREATE INDEX IF NOT EXISTS idx_budaya_topic     ON public.budaya(topic_key);

DROP TRIGGER IF EXISTS trg_budaya_updated ON public.budaya;
CREATE TRIGGER trg_budaya_updated
  BEFORE UPDATE ON public.budaya
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- TRIGGER – buat profil otomatis saat user baru daftar
-- Mapping: metadata 'teacher' → role 'admin' di database
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
  -- Guru/admin di UI disimpan sebagai role 'admin' (satu panel pengelola).
  v_db_role := CASE
    WHEN v_raw_role IN ('teacher', 'guru', 'admin') THEN 'admin'
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

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fallback jika trigger belum sempat jalan (OAuth / user lama tanpa baris profiles)
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
    WHEN v_raw IN ('teacher', 'guru', 'admin') THEN 'admin'
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

GRANT EXECUTE ON FUNCTION public.ensure_own_profile() TO authenticated;

-- ============================================================
-- TRIGGER – update student_progress setelah attempt selesai
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_attempt_complete()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status <> 'completed') THEN
    INSERT INTO public.student_progress (
      student_id, exercise_id, attempts_count, best_score, last_score,
      is_completed, first_attempt, last_attempt
    )
    VALUES (
      NEW.student_id, NEW.exercise_id, 1, NEW.score, NEW.score,
      NEW.score >= (SELECT passing_score FROM public.exercises WHERE id = NEW.exercise_id),
      NEW.started_at, NEW.finished_at
    )
    ON CONFLICT (student_id, exercise_id) DO UPDATE SET
      attempts_count = student_progress.attempts_count + 1,
      best_score     = GREATEST(student_progress.best_score, NEW.score),
      last_score     = NEW.score,
      is_completed   = student_progress.is_completed OR (NEW.score >= (SELECT passing_score FROM public.exercises WHERE id = NEW.exercise_id)),
      last_attempt   = NEW.finished_at;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_attempt_complete ON public.exercise_attempts;
CREATE TRIGGER trg_attempt_complete
  AFTER UPDATE ON public.exercise_attempts
  FOR EACH ROW EXECUTE FUNCTION public.handle_attempt_complete();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_answers   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_progress  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materi            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budaya            ENABLE ROW LEVEL SECURITY;

-- ---- PROFILES ----
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Profil pribadi bisa dilihat sendiri') THEN
    CREATE POLICY "Profil pribadi bisa dilihat sendiri" ON public.profiles FOR SELECT USING (auth.uid() = id);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Admin bisa lihat semua profil') THEN
    CREATE POLICY "Admin bisa lihat semua profil" ON public.profiles FOR SELECT USING (public.is_admin());
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Profil bisa diupdate sendiri') THEN
    CREATE POLICY "Profil bisa diupdate sendiri" ON public.profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Admin bisa update semua profil') THEN
    CREATE POLICY "Admin bisa update semua profil" ON public.profiles FOR UPDATE USING (public.is_admin());
  END IF;
END $$;

-- ---- EXERCISES ----
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='exercises' AND policyname='Siswa hanya lihat latihan yang dipublikasikan') THEN
    CREATE POLICY "Siswa hanya lihat latihan yang dipublikasikan" ON public.exercises FOR SELECT USING (is_published = true OR public.is_admin());
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='exercises' AND policyname='Admin bisa CRUD latihan') THEN
    CREATE POLICY "Admin bisa CRUD latihan" ON public.exercises FOR ALL USING (public.is_admin());
  END IF;
END $$;

-- ---- QUESTIONS ----
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='questions' AND policyname='Siswa bisa lihat soal dari latihan yang dipublikasikan') THEN
    CREATE POLICY "Siswa bisa lihat soal dari latihan yang dipublikasikan" ON public.questions FOR SELECT
      USING (EXISTS (SELECT 1 FROM public.exercises WHERE exercises.id = questions.exercise_id AND (exercises.is_published = true OR public.is_admin())));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='questions' AND policyname='Admin bisa CRUD soal') THEN
    CREATE POLICY "Admin bisa CRUD soal" ON public.questions FOR ALL USING (public.is_admin());
  END IF;
END $$;

-- ---- QUESTION_OPTIONS ----
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='question_options' AND policyname='Siswa bisa lihat pilihan jawaban') THEN
    CREATE POLICY "Siswa bisa lihat pilihan jawaban" ON public.question_options FOR SELECT
      USING (EXISTS (SELECT 1 FROM public.questions q JOIN public.exercises e ON e.id = q.exercise_id WHERE q.id = question_options.question_id AND (e.is_published = true OR public.is_admin())));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='question_options' AND policyname='Admin bisa CRUD pilihan jawaban') THEN
    CREATE POLICY "Admin bisa CRUD pilihan jawaban" ON public.question_options FOR ALL USING (public.is_admin());
  END IF;
END $$;

-- ---- EXERCISE_ATTEMPTS ----
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='exercise_attempts' AND policyname='Siswa hanya lihat attempt miliknya') THEN
    CREATE POLICY "Siswa hanya lihat attempt miliknya" ON public.exercise_attempts FOR SELECT USING (student_id = auth.uid() OR public.is_admin());
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='exercise_attempts' AND policyname='Siswa bisa buat attempt') THEN
    CREATE POLICY "Siswa bisa buat attempt" ON public.exercise_attempts FOR INSERT WITH CHECK (student_id = auth.uid());
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='exercise_attempts' AND policyname='Siswa bisa update attempt miliknya') THEN
    CREATE POLICY "Siswa bisa update attempt miliknya" ON public.exercise_attempts FOR UPDATE USING (student_id = auth.uid() OR public.is_admin());
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='exercise_attempts' AND policyname='Admin bisa lihat semua attempt') THEN
    CREATE POLICY "Admin bisa lihat semua attempt" ON public.exercise_attempts FOR SELECT USING (public.is_admin());
  END IF;
END $$;

-- ---- STUDENT_ANSWERS ----
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='student_answers' AND policyname='Siswa hanya lihat jawaban miliknya') THEN
    CREATE POLICY "Siswa hanya lihat jawaban miliknya" ON public.student_answers FOR SELECT
      USING (EXISTS (SELECT 1 FROM public.exercise_attempts ea WHERE ea.id = student_answers.attempt_id AND (ea.student_id = auth.uid() OR public.is_admin())));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='student_answers' AND policyname='Siswa bisa insert jawaban ke attempt miliknya') THEN
    CREATE POLICY "Siswa bisa insert jawaban ke attempt miliknya" ON public.student_answers FOR INSERT
      WITH CHECK (EXISTS (SELECT 1 FROM public.exercise_attempts ea WHERE ea.id = student_answers.attempt_id AND ea.student_id = auth.uid()));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='student_answers' AND policyname='Admin bisa lihat semua jawaban') THEN
    CREATE POLICY "Admin bisa lihat semua jawaban" ON public.student_answers FOR SELECT USING (public.is_admin());
  END IF;
END $$;

-- ---- STUDENT_PROGRESS ----
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='student_progress' AND policyname='Siswa hanya lihat progres miliknya') THEN
    CREATE POLICY "Siswa hanya lihat progres miliknya" ON public.student_progress FOR SELECT USING (student_id = auth.uid() OR public.is_admin());
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='student_progress' AND policyname='System bisa upsert progres (via trigger)') THEN
    CREATE POLICY "System bisa upsert progres (via trigger)" ON public.student_progress FOR ALL USING (true);
  END IF;
END $$;

-- ---- MATERI ----
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='materi' AND policyname='Siswa baca materi published') THEN
    CREATE POLICY "Siswa baca materi published" ON public.materi FOR SELECT USING (is_published = true OR public.is_admin());
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='materi' AND policyname='Admin CRUD materi') THEN
    CREATE POLICY "Admin CRUD materi" ON public.materi FOR ALL USING (public.is_admin());
  END IF;
END $$;

-- ---- BUDAYA ----
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='budaya' AND policyname='Siswa baca budaya published') THEN
    CREATE POLICY "Siswa baca budaya published" ON public.budaya FOR SELECT USING (is_published = true OR public.is_admin());
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='budaya' AND policyname='Admin CRUD budaya') THEN
    CREATE POLICY "Admin CRUD budaya" ON public.budaya FOR ALL USING (public.is_admin());
  END IF;
END $$;

-- ============================================================
-- RPC: get_student_quiz
-- Mengambil soal latihan TANPA is_correct + membuat attempt
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_student_quiz(p_exercise_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_id   UUID := auth.uid();
  v_exercise  JSONB;
  v_attempt   UUID;
  v_questions JSONB;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.exercises
    WHERE id = p_exercise_id AND (is_published = true OR public.is_admin())
  ) THEN
    RAISE EXCEPTION 'Latihan tidak ditemukan atau belum dipublikasikan' USING ERRCODE = 'P0002';
  END IF;

  SELECT to_jsonb(e) - 'created_by' INTO v_exercise
  FROM public.exercises e WHERE e.id = p_exercise_id;

  INSERT INTO public.exercise_attempts (exercise_id, student_id, status)
  VALUES (p_exercise_id, v_user_id, 'in_progress')
  RETURNING id INTO v_attempt;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id',          q.id,
      'question',    q.question,
      'image_url',   q.image_url,
      'explanation', q.explanation,
      'points',      q.points,
      'sort_order',  q.sort_order,
      'options', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id',          opt.id,
            'option_text', opt.option_text,
            'sort_order',  opt.sort_order
            -- is_correct sengaja tidak disertakan
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
    'exercise',   v_exercise,
    'attempt_id', v_attempt,
    'questions',  COALESCE(v_questions, '[]'::jsonb)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_student_quiz(UUID) TO authenticated;

-- ============================================================
-- RPC: submit_student_quiz
-- Menilai jawaban di sisi server, mengembalikan review
-- ============================================================
CREATE OR REPLACE FUNCTION public.submit_student_quiz(
  p_attempt_id UUID,
  p_answers    JSONB  -- [{"question_id": "uuid", "option_id": "uuid"}]
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_id     UUID := auth.uid();
  v_exercise_id UUID;
  v_total_pts   INT  := 0;
  v_earned_pts  INT  := 0;
  v_correct     INT  := 0;
  v_wrong       INT  := 0;
  v_score       NUMERIC(5,2);
  v_ans         JSONB;
  v_q_id        UUID;
  v_opt_id      UUID;
  v_is_correct  BOOLEAN;
  v_pts         INT;
  v_review      JSONB;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.exercise_attempts
    WHERE id = p_attempt_id AND student_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Akses ditolak' USING ERRCODE = '42501';
  END IF;

  SELECT exercise_id INTO v_exercise_id
  FROM public.exercise_attempts WHERE id = p_attempt_id;

  FOR v_ans IN SELECT * FROM jsonb_array_elements(p_answers) LOOP
    v_q_id   := (v_ans->>'question_id')::UUID;
    v_opt_id := (v_ans->>'option_id')::UUID;

    SELECT opt.is_correct, q.points INTO v_is_correct, v_pts
    FROM public.question_options opt
    JOIN public.questions q ON q.id = opt.question_id
    WHERE opt.id = v_opt_id AND q.id = v_q_id AND q.exercise_id = v_exercise_id;

    v_total_pts := v_total_pts + COALESCE(v_pts, 0);

    IF COALESCE(v_is_correct, false) THEN
      v_earned_pts := v_earned_pts + COALESCE(v_pts, 0);
      v_correct    := v_correct + 1;
    ELSE
      v_wrong := v_wrong + 1;
    END IF;

    INSERT INTO public.student_answers (attempt_id, question_id, option_id, is_correct, points_earned)
    VALUES (
      p_attempt_id, v_q_id, v_opt_id,
      COALESCE(v_is_correct, false),
      CASE WHEN COALESCE(v_is_correct, false) THEN COALESCE(v_pts, 0) ELSE 0 END
    );
  END LOOP;

  v_score := CASE WHEN v_total_pts > 0
    THEN ROUND((v_earned_pts::NUMERIC / v_total_pts) * 100, 2)
    ELSE 0 END;

  UPDATE public.exercise_attempts SET
    status        = 'completed',
    score         = v_score,
    total_points  = v_total_pts,
    earned_points = v_earned_pts,
    correct_count = v_correct,
    wrong_count   = v_wrong,
    finished_at   = now()
  WHERE id = p_attempt_id;

  SELECT jsonb_agg(
    jsonb_build_object(
      'question',       q.question,
      'your_answer',    your_opt.option_text,
      'correct_answer', correct_opt.option_text,
      'is_correct',     sa.is_correct,
      'explanation',    q.explanation
    ) ORDER BY q.sort_order
  )
  INTO v_review
  FROM public.student_answers sa
  JOIN public.questions q ON q.id = sa.question_id
  JOIN public.question_options your_opt ON your_opt.id = sa.option_id
  JOIN public.question_options correct_opt
    ON correct_opt.question_id = q.id AND correct_opt.is_correct = true
  WHERE sa.attempt_id = p_attempt_id;

  RETURN jsonb_build_object(
    'score',         v_score,
    'correct_count', v_correct,
    'wrong_count',   v_wrong,
    'review',        COALESCE(v_review, '[]'::jsonb)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_student_quiz(UUID, JSONB) TO authenticated;

-- ============================================================
-- Catatan setup:
-- 1. Jalankan SELURUH file ini di Supabase → SQL Editor (aman diulang).
-- 2. Authentication → URL Configuration:
--    Site URL: http://localhost:3000 (dev) / URL produksi
--    Redirect URLs: http://localhost:3000/auth/callback dan {origin}/auth/callback
-- 3. Guru = role 'admin' di tabel profiles (satu panel /admin).
--    Siswa = role 'student' → /dashboard.
-- 4. Naikkan akun lama ke guru/admin:
--
-- UPDATE public.profiles SET role = 'admin', full_name = 'Nama Guru'
-- WHERE email = 'email-guru@domain.com';
-- ============================================================
