export type UserRole = "admin" | "student";

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  class_name: string;
  role: UserRole;
  avatar_url: string | null;
};

export type Materi = {
  id: string;
  title: string;
  chapter_number: number;
  level: "dasar" | "menengah" | "lanjut";
  description: string;
  duration_minutes: number;
  image_url: string | null;
  content_html: string;
  is_published: boolean;
  sort_order: number;
};

export type Budaya = {
  id: string;
  title: string;
  topic_key: string;
  category: string;
  description: string;
  image_url: string | null;
  content_html: string;
  is_published: boolean;
  sort_order: number;
};

export type Exercise = {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: "Mudah" | "Sedang" | "Sulit";
  time_limit: number;
  max_attempts: number;
  passing_score: number;
  is_published: boolean;
  sort_order: number;
  created_at?: string;
  questions?: { id: string }[];
};

export type StudentProgress = {
  id: string;
  student_id: string;
  exercise_id: string;
  attempts_count: number;
  best_score: number;
  last_score: number;
  is_completed: boolean;
};

export type QuizOption = {
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
