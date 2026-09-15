-- ============================================================
-- KANUM – 009: Security & Performance Patch
-- Jalankan di Supabase SQL Editor.
--
-- Tujuan:
-- 1. Mengamankan fungsi SECURITY DEFINER dengan mengatur search_path (mencegah search_path injection)
-- 2. Mempercepat query halaman /laporan dengan index baru
-- 3. Memastikan integritas data jawaban (mencegah duplikasi jawaban pada 1 pertanyaan di 1 attempt)
-- 4. Mengetatkan policy storage question-images untuk mencegah public listing tanpa token.
-- ============================================================

-- ============================================================
-- 1. SECURITY DEFINER SEARCH PATH FIX
-- ============================================================

-- 1a. handle_attempt_complete
CREATE OR REPLACE FUNCTION public.handle_attempt_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

-- 1b. get_student_quiz
CREATE OR REPLACE FUNCTION public.get_student_quiz(p_exercise_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

-- 1c. submit_student_quiz
CREATE OR REPLACE FUNCTION public.submit_student_quiz(
  p_attempt_id UUID,
  p_answers    JSONB  -- [{"question_id": "uuid", "option_id": "uuid"}]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  SELECT exercise_id INTO v_exercise_id
  FROM public.exercise_attempts
  WHERE id = p_attempt_id AND student_id = v_user_id AND status = 'in_progress';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Attempt tidak valid atau sudah selesai' USING ERRCODE = 'P0003';
  END IF;

  FOR v_ans IN SELECT * FROM jsonb_array_elements(p_answers)
  LOOP
    v_q_id   := (v_ans->>'question_id')::UUID;
    v_opt_id := (v_ans->>'option_id')::UUID;

    SELECT points INTO v_pts
    FROM public.questions WHERE id = v_q_id AND exercise_id = v_exercise_id;

    IF FOUND THEN
      v_total_pts := v_total_pts + v_pts;

      SELECT is_correct INTO v_is_correct
      FROM public.question_options
      WHERE id = v_opt_id AND question_id = v_q_id;

      v_is_correct := COALESCE(v_is_correct, false);

      IF v_is_correct THEN
        v_earned_pts := v_earned_pts + v_pts;
        v_correct := v_correct + 1;
      ELSE
        v_wrong := v_wrong + 1;
      END IF;

      INSERT INTO public.student_answers (attempt_id, question_id, option_id, is_correct, points_earned)
      VALUES (p_attempt_id, v_q_id, v_opt_id, v_is_correct, CASE WHEN v_is_correct THEN v_pts ELSE 0 END)
      ON CONFLICT (attempt_id, question_id) DO UPDATE SET 
        option_id = EXCLUDED.option_id,
        is_correct = EXCLUDED.is_correct,
        points_earned = EXCLUDED.points_earned;
    END IF;
  END LOOP;

  IF v_total_pts > 0 THEN
    v_score := (v_earned_pts::NUMERIC / v_total_pts::NUMERIC) * 100;
  ELSE
    v_score := 0;
  END IF;

  UPDATE public.exercise_attempts
  SET status = 'completed',
      score = v_score,
      total_points = v_total_pts,
      earned_points = v_earned_pts,
      correct_count = v_correct,
      wrong_count = v_wrong,
      finished_at = now()
  WHERE id = p_attempt_id;

  SELECT jsonb_agg(
    jsonb_build_object(
      'question_id', q.id,
      'is_correct',  a.is_correct,
      'correct_option_id', (
         SELECT id FROM public.question_options 
         WHERE question_id = q.id AND is_correct = true LIMIT 1
      )
    )
  ) INTO v_review
  FROM public.student_answers a
  JOIN public.questions q ON q.id = a.question_id
  WHERE a.attempt_id = p_attempt_id;

  RETURN jsonb_build_object(
    'score',         v_score,
    'correct_count', v_correct,
    'wrong_count',   v_wrong,
    'review',        COALESCE(v_review, '[]'::jsonb)
  );
END;
$$;

-- ============================================================
-- 2. DATA INTEGRITY: student_answers (attempt_id, question_id)
-- ============================================================
-- Mencegah penyimpanan jawaban ganda untuk pertanyaan yang sama di attempt yang sama
ALTER TABLE public.student_answers ADD CONSTRAINT uq_student_answers_attempt_question UNIQUE (attempt_id, question_id);

-- ============================================================
-- 3. PERFORMANCE INDEX: /laporan
-- ============================================================
-- Mempercepat query laporan yang melakukan filter student_id dan order started_at DESC
CREATE INDEX IF NOT EXISTS idx_attempts_student_started ON public.exercise_attempts(student_id, started_at DESC);

-- ============================================================
-- 4. STORAGE POLICY: Batasi Public Listing
-- ============================================================
-- Supabase melaporkan ini sebagai "public bucket listing" karena anon/public
-- bisa melakukan SELECT di bucket (mem-bypass token auth untuk operasi listing).
-- Menggantinya menjadi TO authenticated mengamankan akses list API, 
-- namun gambar tetap bisa diakses tanpa login lewat public URL karena public=true.
DROP POLICY IF EXISTS "KANUM question-images baca publik" ON storage.objects;

CREATE POLICY "KANUM question-images baca publik"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'question-images');
