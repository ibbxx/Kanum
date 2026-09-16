import type { Database } from "@/types/database";

type Tables = Database["public"]["Tables"];

export type UserRole = "admin" | "teacher" | "student";

/** Keadaan akses efektif: admin selalu aktif, role lain ikut status. */
export type AccessState = "approved" | "pending" | "rejected";

/**
 * Tipe entitas di bawah ini DITURUNKAN dari `types/database.ts` (hasil
 * generate skema Supabase), bukan ditulis tangan. Definisi lama menulis
 * ulang kolom + union enum (`level`, `difficulty`, `role`, `status`) yang
 * tidak cocok dengan `string` dari database, sehingga pemanggil terpaksa
 * `as`. Dengan sumber tunggal ini, cast hasil query hilang.
 */

/** Kolom yang benar-benar di-select oleh `lib/profile.ts`. */
export type Profile = Pick<
  Tables["profiles"]["Row"],
  "id" | "full_name" | "email" | "class_name" | "role" | "status" | "avatar_url"
>;

export type Materi = Tables["materi"]["Row"];

export type Budaya = Tables["budaya"]["Row"];

export type Exercise = Tables["exercises"]["Row"];

export type StudentProgress = Tables["student_progress"]["Row"];

/* ── Kontrak JSON dari RPC quiz ───────────────────────────────────────────
   `get_student_quiz` / `submit_student_quiz` mengembalikan JSONB, jadi
   bentuknya memang tidak bisa dibaca dari skema — tipe ini tetap ditulis
   tangan dan sengaja dipakai sebagai target satu kali cast di QuizPlayer. */

type QuizOption = {
  id: string;
  option_text: string;
  sort_order: number;
};

export type QuizQuestion = {
  id: string;
  question: string;
  image_url: string | null;
  explanation?: string;
  points: number;
  sort_order: number;
  question_options: QuizOption[];
  options?: QuizOption[];
};

export type QuizPayload = {
  attempt_id: string;
  exercise: {
    id: string;
    title: string;
    category: string;
    passing_score: number;
    time_limit?: number;
  };
  questions: QuizQuestion[];
};

export type QuizResult = {
  score?: number;
  passing_score?: number;
  correct_count?: number;
  wrong_count?: number;
  earned_points?: number;
  total_points?: number;
  review?: Array<{
    question_id: string;
    question?: string;
    is_correct?: boolean;
    selected_option_id?: string;
    correct_option_id?: string;
    explanation?: string;
  }>;
};
