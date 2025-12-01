export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          achievement_description: string | null
          achievement_name: string
          achievement_type: string
          badge_icon: string | null
          created_at: string | null
          id: string
          points: number | null
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_description?: string | null
          achievement_name: string
          achievement_type: string
          badge_icon?: string | null
          created_at?: string | null
          id?: string
          points?: number | null
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_description?: string | null
          achievement_name?: string
          achievement_type?: string
          badge_icon?: string | null
          created_at?: string | null
          id?: string
          points?: number | null
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      flashcards: {
        Row: {
          answer: string
          created_at: string | null
          id: string
          note_id: string | null
          question: string
          topic: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          answer: string
          created_at?: string | null
          id?: string
          note_id?: string | null
          question: string
          topic: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          answer?: string
          created_at?: string | null
          id?: string
          note_id?: string | null
          question?: string
          topic?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_completions: {
        Row: {
          completed_date: string
          created_at: string
          habit_id: string
          id: string
          user_id: string
        }
        Insert: {
          completed_date?: string
          created_at?: string
          habit_id: string
          id?: string
          user_id: string
        }
        Update: {
          completed_date?: string
          created_at?: string
          habit_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_completions_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          best_streak: number | null
          color: string | null
          created_at: string
          description: string | null
          frequency: string
          icon: string | null
          id: string
          name: string
          streak: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          best_streak?: number | null
          color?: string | null
          created_at?: string
          description?: string | null
          frequency?: string
          icon?: string | null
          id?: string
          name: string
          streak?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          best_streak?: number | null
          color?: string | null
          created_at?: string
          description?: string | null
          frequency?: string
          icon?: string | null
          id?: string
          name?: string
          streak?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mcqs: {
        Row: {
          correct_answer: string
          created_at: string | null
          explanation: string | null
          id: string
          note_id: string | null
          options: Json | null
          question: string
          question_type: string | null
          topic: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          correct_answer: string
          created_at?: string | null
          explanation?: string | null
          id?: string
          note_id?: string | null
          options?: Json | null
          question: string
          question_type?: string | null
          topic: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          correct_answer?: string
          created_at?: string | null
          explanation?: string | null
          id?: string
          note_id?: string | null
          options?: Json | null
          question?: string
          question_type?: string | null
          topic?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mcqs_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          ai_summary: string | null
          content: string | null
          created_at: string | null
          id: string
          subject: string
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_summary?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          subject: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_summary?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          subject?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string
          daily_summary_enabled: boolean | null
          email_notifications: boolean | null
          habit_reminders_enabled: boolean | null
          id: string
          push_notifications: boolean | null
          reminder_time: string | null
          task_reminders_enabled: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_summary_enabled?: boolean | null
          email_notifications?: boolean | null
          habit_reminders_enabled?: boolean | null
          id?: string
          push_notifications?: boolean | null
          reminder_time?: string | null
          task_reminders_enabled?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_summary_enabled?: boolean | null
          email_notifications?: boolean | null
          habit_reminders_enabled?: boolean | null
          id?: string
          push_notifications?: boolean | null
          reminder_time?: string | null
          task_reminders_enabled?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean | null
          related_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean | null
          related_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean | null
          related_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      productivity_metrics: {
        Row: {
          created_at: string
          date: string
          focus_score: number | null
          habits_completed: number | null
          id: string
          productivity_score: number | null
          study_time_minutes: number | null
          tasks_completed: number | null
          tasks_created: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          focus_score?: number | null
          habits_completed?: number | null
          id?: string
          productivity_score?: number | null
          study_time_minutes?: number | null
          tasks_completed?: number | null
          tasks_created?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          focus_score?: number | null
          habits_completed?: number | null
          id?: string
          productivity_score?: number | null
          study_time_minutes?: number | null
          tasks_completed?: number | null
          tasks_created?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      progress_tracker: {
        Row: {
          completed: boolean | null
          confidence_level: number | null
          created_at: string | null
          id: string
          is_weak: boolean | null
          last_reviewed: string | null
          subject: string | null
          topic: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          confidence_level?: number | null
          created_at?: string | null
          id?: string
          is_weak?: boolean | null
          last_reviewed?: string | null
          subject?: string | null
          topic: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          confidence_level?: number | null
          created_at?: string | null
          id?: string
          is_weak?: boolean | null
          last_reviewed?: string | null
          subject?: string | null
          topic?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      study_goals: {
        Row: {
          available_hours_per_day: number | null
          created_at: string | null
          id: string
          syllabus_url: string | null
          target_date: string | null
          target_exam: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          available_hours_per_day?: number | null
          created_at?: string | null
          id?: string
          syllabus_url?: string | null
          target_date?: string | null
          target_exam: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          available_hours_per_day?: number | null
          created_at?: string | null
          id?: string
          syllabus_url?: string | null
          target_date?: string | null
          target_exam?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      study_plan_tasks: {
        Row: {
          completed: boolean | null
          created_at: string | null
          id: string
          study_plan_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          id?: string
          study_plan_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          id?: string
          study_plan_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "study_plan_tasks_study_plan_id_fkey"
            columns: ["study_plan_id"]
            isOneToOne: false
            referencedRelation: "study_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      study_plans: {
        Row: {
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      study_schedule: {
        Row: {
          completed: boolean | null
          created_at: string | null
          duration_minutes: number | null
          goal_id: string | null
          id: string
          is_weak_topic: boolean | null
          scheduled_date: string
          skipped: boolean | null
          topic: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          duration_minutes?: number | null
          goal_id?: string | null
          id?: string
          is_weak_topic?: boolean | null
          scheduled_date: string
          skipped?: boolean | null
          topic: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          duration_minutes?: number | null
          goal_id?: string | null
          id?: string
          is_weak_topic?: boolean | null
          scheduled_date?: string
          skipped?: boolean | null
          topic?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_schedule_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "study_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      study_sessions: {
        Row: {
          created_at: string | null
          duration_minutes: number | null
          id: string
          notes_created: number | null
          questions_answered: number | null
          session_date: string
          topics_covered: string[] | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          notes_created?: number | null
          questions_answered?: number | null
          session_date?: string
          topics_covered?: string[] | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          notes_created?: number | null
          questions_answered?: number | null
          session_date?: string
          topics_covered?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          category: string | null
          completed: boolean | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          is_recurring: boolean | null
          next_occurrence: string | null
          parent_task_id: string | null
          priority: string | null
          recurrence_end_date: string | null
          recurrence_interval: number | null
          recurrence_pattern: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          completed?: boolean | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_recurring?: boolean | null
          next_occurrence?: string | null
          parent_task_id?: string | null
          priority?: string | null
          recurrence_end_date?: string | null
          recurrence_interval?: number | null
          recurrence_pattern?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          completed?: boolean | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_recurring?: boolean | null
          next_occurrence?: string | null
          parent_task_id?: string | null
          priority?: string | null
          recurrence_end_date?: string | null
          recurrence_interval?: number | null
          recurrence_pattern?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          class_course: string | null
          created_at: string | null
          id: string
          last_study_date: string | null
          onboarding_completed: boolean | null
          study_streak: number | null
          target_exam: string | null
          total_study_hours: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          class_course?: string | null
          created_at?: string | null
          id?: string
          last_study_date?: string | null
          onboarding_completed?: boolean | null
          study_streak?: number | null
          target_exam?: string | null
          total_study_hours?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          class_course?: string | null
          created_at?: string | null
          id?: string
          last_study_date?: string | null
          onboarding_completed?: boolean | null
          study_streak?: number | null
          target_exam?: string | null
          total_study_hours?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
