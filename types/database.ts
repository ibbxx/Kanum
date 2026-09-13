export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

/** Placeholder types. Generate with: npx supabase gen types typescript --project-id <id> > types/database.ts */
export type Database = {
  public: {
    Tables: Record<string, never>;
    Functions: {
      get_student_quiz: { Args: { p_exercise_id: string }; Returns: Json };
      submit_student_quiz: {
        Args: { p_attempt_id: string; p_answers: Json };
        Returns: Json;
      };
    };
  };
};
