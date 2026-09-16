/**
 * Tipe database Supabase untuk project KANUM.
 *
 * DIHASILKAN dari project nyata (bukan dikarang):
 *   - tabel/kolom/nullability/default: PostgREST OpenAPI project
 *     `vantlmdcqziaccglfayb.supabase.co`
 *   - tipe kembalian fungsi: `Supabase/*.sql` (sumber kebenaran migrasi)
 *   - relasi: foreign key di `Supabase/*.sql`
 *
 * Regenerasi setelah mengubah skema:
 *   `node .freebuff/gen-db-types.mjs`
 *
 * Catatan: `public.rls_auto_enable` ada di project tapi sengaja TIDAK
 * didaftarkan — fungsi internal Supabase, tidak pernah dipanggil aplikasi.
 * Menyertakannya berarti menebak tipe kembaliannya.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          avatar_url: string | null
          class_name: string
          created_at: string
          email: string
          full_name: string
          id: string
          role: string
          status: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          class_name?: string
          created_at?: string
          email?: string
          full_name?: string
          id: string
          role?: string
          status?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          class_name?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          role?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
        ]
      }
      classes: {
        Row: {
          created_at: string
          id: string
          name: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      class_members: {
        Row: {
          class_id: string
          enrolled_at: string
          id: string
          student_id: string
        }
        Insert: {
          class_id: string
          enrolled_at?: string
          id?: string
          student_id: string
        }
        Update: {
          class_id?: string
          enrolled_at?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_members_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_members_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      exercises: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string
          difficulty: string
          id: string
          is_published: boolean
          max_attempts: number
          passing_score: number
          sort_order: number
          time_limit: number
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string
          difficulty?: string
          id?: string
          is_published?: boolean
          max_attempts?: number
          passing_score?: number
          sort_order?: number
          time_limit?: number
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string
          difficulty?: string
          id?: string
          is_published?: boolean
          max_attempts?: number
          passing_score?: number
          sort_order?: number
          time_limit?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercises_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      questions: {
        Row: {
          created_at: string
          exercise_id: string
          explanation: string
          id: string
          image_url: string | null
          points: number
          question: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          exercise_id: string
          explanation?: string
          id?: string
          image_url?: string | null
          points?: number
          question: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          exercise_id?: string
          explanation?: string
          id?: string
          image_url?: string | null
          points?: number
          question?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          }
        ]
      }
      question_options: {
        Row: {
          created_at: string
          id: string
          is_correct: boolean
          option_text: string
          question_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_correct?: boolean
          option_text: string
          question_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_correct?: boolean
          option_text?: string
          question_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "question_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          }
        ]
      }
      exercise_attempts: {
        Row: {
          correct_count: number
          created_at: string
          earned_points: number
          exercise_id: string
          finished_at: string | null
          id: string
          score: number
          started_at: string
          status: string
          student_id: string
          total_points: number
          wrong_count: number
        }
        Insert: {
          correct_count?: number
          created_at?: string
          earned_points?: number
          exercise_id: string
          finished_at?: string | null
          id?: string
          score?: number
          started_at?: string
          status?: string
          student_id: string
          total_points?: number
          wrong_count?: number
        }
        Update: {
          correct_count?: number
          created_at?: string
          earned_points?: number
          exercise_id?: string
          finished_at?: string | null
          id?: string
          score?: number
          started_at?: string
          status?: string
          student_id?: string
          total_points?: number
          wrong_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "exercise_attempts_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_attempts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      student_answers: {
        Row: {
          attempt_id: string
          created_at: string
          id: string
          is_correct: boolean
          option_id: string | null
          points_earned: number
          question_id: string
        }
        Insert: {
          attempt_id: string
          created_at?: string
          id?: string
          is_correct?: boolean
          option_id?: string | null
          points_earned?: number
          question_id: string
        }
        Update: {
          attempt_id?: string
          created_at?: string
          id?: string
          is_correct?: boolean
          option_id?: string | null
          points_earned?: number
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "exercise_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_answers_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "question_options"
            referencedColumns: ["id"]
          }
        ]
      }
      student_progress: {
        Row: {
          attempts_count: number
          best_score: number
          exercise_id: string
          first_attempt: string | null
          id: string
          is_completed: boolean
          last_attempt: string | null
          last_score: number
          student_id: string
        }
        Insert: {
          attempts_count?: number
          best_score?: number
          exercise_id: string
          first_attempt?: string | null
          id?: string
          is_completed?: boolean
          last_attempt?: string | null
          last_score?: number
          student_id: string
        }
        Update: {
          attempts_count?: number
          best_score?: number
          exercise_id?: string
          first_attempt?: string | null
          id?: string
          is_completed?: boolean
          last_attempt?: string | null
          last_score?: number
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_progress_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          }
        ]
      }
      materi: {
        Row: {
          chapter_number: number
          content_html: string
          created_at: string
          created_by: string | null
          description: string
          duration_minutes: number
          id: string
          image_url: string | null
          is_published: boolean
          level: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          chapter_number?: number
          content_html?: string
          created_at?: string
          created_by?: string | null
          description?: string
          duration_minutes?: number
          id?: string
          image_url?: string | null
          is_published?: boolean
          level?: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          chapter_number?: number
          content_html?: string
          created_at?: string
          created_by?: string | null
          description?: string
          duration_minutes?: number
          id?: string
          image_url?: string | null
          is_published?: boolean
          level?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "materi_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      budaya: {
        Row: {
          category: string
          content_html: string
          created_at: string
          created_by: string | null
          description: string
          id: string
          image_url: string | null
          is_published: boolean
          sort_order: number
          title: string
          topic_key: string
          updated_at: string
        }
        Insert: {
          category?: string
          content_html?: string
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          image_url?: string | null
          is_published?: boolean
          sort_order?: number
          title: string
          topic_key: string
          updated_at?: string
        }
        Update: {
          category?: string
          content_html?: string
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          image_url?: string | null
          is_published?: boolean
          sort_order?: number
          title?: string
          topic_key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budaya_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_delete_account: {
        Args: {
          p_user_id: string
        }
        Returns: string
      }
      admin_set_role: {
        Args: {
          p_user_id: string
          p_role: string
        }
        Returns: string
      }
      claim_signup_role: {
        Args: {
          p_role: string
        }
        Returns: string
      }
      complete_signup: {
        Args: {
          p_full_name: string
          p_class_name?: string | null
        }
        Returns: string
      }
      count_approved_admins: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      ensure_own_profile: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Tables"]["profiles"]["Row"]
      }
      get_student_quiz: {
        Args: {
          p_exercise_id: string
        }
        Returns: Json
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_class_member: {
        Args: {
          p_class_id: string
        }
        Returns: boolean
      }
      is_class_owner: {
        Args: {
          p_class_id: string
        }
        Returns: boolean
      }
      is_teacher: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_teacher_of: {
        Args: {
          p_student_id: string
        }
        Returns: boolean
      }
      list_verification_queue: {
        Args: Record<PropertyKey, never>
        Returns: {
  id: string
  full_name: string
  email: string
  class_name: string
  role: string
  status: string
  avatar_url: string | null
  created_at: string
}[]
      }
      min_approved_admins: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      resubmit_verification: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      set_verification_status: {
        Args: {
          p_user_id: string
          p_status: string
        }
        Returns: string
      }
      submit_student_quiz: {
        Args: {
          p_attempt_id: string
          p_answers: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
