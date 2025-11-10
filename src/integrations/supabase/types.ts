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
          achieved_at: string | null
          achievement_name: string
          achievement_type: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          user_id: string
        }
        Insert: {
          achieved_at?: string | null
          achievement_name: string
          achievement_type?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          user_id: string
        }
        Update: {
          achieved_at?: string | null
          achievement_name?: string
          achievement_type?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_request_logs: {
        Row: {
          completion_tokens: number | null
          created_at: string | null
          id: string
          model: string | null
          prompt_tokens: number | null
          request_type: string
          total_tokens: number | null
          user_id: string | null
        }
        Insert: {
          completion_tokens?: number | null
          created_at?: string | null
          id?: string
          model?: string | null
          prompt_tokens?: number | null
          request_type: string
          total_tokens?: number | null
          user_id?: string | null
        }
        Update: {
          completion_tokens?: number | null
          created_at?: string | null
          id?: string
          model?: string | null
          prompt_tokens?: number | null
          request_type?: string
          total_tokens?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_request_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_logs: {
        Row: {
          created_at: string | null
          health_score: number | null
          id: string
          log_date: string
          steps: number | null
          total_calories: number | null
          total_carbs_g: number | null
          total_fats_g: number | null
          total_protein_g: number | null
          user_id: string
          water_glasses: number | null
          weight_kg: number | null
        }
        Insert: {
          created_at?: string | null
          health_score?: number | null
          id?: string
          log_date?: string
          steps?: number | null
          total_calories?: number | null
          total_carbs_g?: number | null
          total_fats_g?: number | null
          total_protein_g?: number | null
          user_id: string
          water_glasses?: number | null
          weight_kg?: number | null
        }
        Update: {
          created_at?: string | null
          health_score?: number | null
          id?: string
          log_date?: string
          steps?: number | null
          total_calories?: number | null
          total_carbs_g?: number | null
          total_fats_g?: number | null
          total_protein_g?: number | null
          user_id?: string
          water_glasses?: number | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      health_data_sync: {
        Row: {
          calories_burned: number | null
          created_at: string | null
          heart_rate_avg: number | null
          id: string
          provider: string
          sleep_hours: number | null
          steps: number | null
          sync_date: string
          user_id: string
        }
        Insert: {
          calories_burned?: number | null
          created_at?: string | null
          heart_rate_avg?: number | null
          id?: string
          provider: string
          sleep_hours?: number | null
          steps?: number | null
          sync_date: string
          user_id: string
        }
        Update: {
          calories_burned?: number | null
          created_at?: string | null
          heart_rate_avg?: number | null
          id?: string
          provider?: string
          sleep_hours?: number | null
          steps?: number | null
          sync_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_data_sync_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      health_metrics: {
        Row: {
          created_at: string | null
          id: string
          last_log_date: string | null
          score: number | null
          streak_days: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_log_date?: string | null
          score?: number | null
          streak_days?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_log_date?: string | null
          score?: number | null
          streak_days?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard: {
        Row: {
          created_at: string | null
          health_score: number | null
          id: string
          last_updated: string | null
          streak_days: number | null
          total_meals_logged: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          health_score?: number | null
          id?: string
          last_updated?: string | null
          streak_days?: number | null
          total_meals_logged?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          health_score?: number | null
          id?: string
          last_updated?: string | null
          streak_days?: number | null
          total_meals_logged?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meals: {
        Row: {
          calories: number
          carbs_g: number
          created_at: string | null
          fats_g: number
          fiber_g: number | null
          id: string
          image_url: string | null
          logged_at: string | null
          meal_name: string
          meal_type: string | null
          protein_g: number
          user_id: string
        }
        Insert: {
          calories?: number
          carbs_g?: number
          created_at?: string | null
          fats_g?: number
          fiber_g?: number | null
          id?: string
          image_url?: string | null
          logged_at?: string | null
          meal_name: string
          meal_type?: string | null
          protein_g?: number
          user_id: string
        }
        Update: {
          calories?: number
          carbs_g?: number
          created_at?: string | null
          fats_g?: number
          fiber_g?: number | null
          id?: string
          image_url?: string | null
          logged_at?: string | null
          meal_name?: string
          meal_type?: string | null
          protein_g?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          content: string
          created_at: string | null
          id: string
          image_url: string | null
          likes_count: number | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          likes_count?: number | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          likes_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: number | null
          created_at: string | null
          daily_calorie_goal: number | null
          daily_carbs_goal: number | null
          daily_fats_goal: number | null
          daily_protein_goal: number | null
          dietary_preferences: string[] | null
          full_name: string | null
          gender: string | null
          height_cm: number | null
          id: string
          target_weight_kg: number | null
          updated_at: string | null
          weight_kg: number | null
        }
        Insert: {
          age?: number | null
          created_at?: string | null
          daily_calorie_goal?: number | null
          daily_carbs_goal?: number | null
          daily_fats_goal?: number | null
          daily_protein_goal?: number | null
          dietary_preferences?: string[] | null
          full_name?: string | null
          gender?: string | null
          height_cm?: number | null
          id: string
          target_weight_kg?: number | null
          updated_at?: string | null
          weight_kg?: number | null
        }
        Update: {
          age?: number | null
          created_at?: string | null
          daily_calorie_goal?: number | null
          daily_carbs_goal?: number | null
          daily_fats_goal?: number | null
          daily_protein_goal?: number | null
          dietary_preferences?: string[] | null
          full_name?: string | null
          gender?: string | null
          height_cm?: number | null
          id?: string
          target_weight_kg?: number | null
          updated_at?: string | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string | null
          end_date: string | null
          id: string
          plan: string
          start_date: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          plan?: string
          start_date?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          plan?: string
          start_date?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wearable_connections: {
        Row: {
          access_token: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          provider: string
          refresh_token: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          provider: string
          refresh_token?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          provider?: string
          refresh_token?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wearable_connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_health_score: { Args: { user_uuid: string }; Returns: number }
      check_achievements: { Args: { user_uuid: string }; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      update_leaderboard: { Args: { user_uuid: string }; Returns: undefined }
      update_user_streak: { Args: { user_uuid: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "user"
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
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
