/**
 * Database type definitions — Supabase tablolarının TypeScript karşılığı.
 * Supabase CLI ile otomatik generate edilebilir ama başlangıç için elle yazıyoruz.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      // ── 1. articles — Ana içerik tablosu
      articles: {
        Row: {
          id: string;
          title: string;
          slug: string;
          full_text: string;
          audio_url: string | null;
          level: string;
          topic: string;
          category: string;
          duration_seconds: number;
          word_count: number;
          sentence_count: number;
          difficulty_score: number | null;
          cover_image_url: string | null;
          is_premium: boolean;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['articles']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['articles']['Insert']>;
      };

      // ── 2. article_sentences — Cümle bazlı parçalama
      article_sentences: {
        Row: {
          id: string;
          article_id: string;
          sentence_index: number;
          text_en: string;
          text_tr: string | null;
          paragraph_index: number;
          start_ms: number | null;
          end_ms: number | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['article_sentences']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['article_sentences']['Insert']>;
      };

      // ── 3. article_words — EN KRİTİK TABLO (kelime bazlı)
      article_words: {
        Row: {
          id: string;
          article_id: string;
          sentence_id: string | null;
          word: string;
          word_lower: string;
          word_index: number;
          sentence_index: number;
          start_ms: number | null;
          end_ms: number | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['article_words']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['article_words']['Insert']>;
      };

      // ── 4. dictionary — Sözlük tablosu
      dictionary: {
        Row: {
          id: string;
          word: string;
          ipa: string | null;
          pos: string | null;
          definition_en: string;
          definition_tr: string;
          example_sentence: string | null;
          word_family: string[] | null;
          cefr_level: string | null;
          frequency_rank: number | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['dictionary']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['dictionary']['Insert']>;
      };

      // ── 5. profiles — Kullanıcı profili
      profiles: {
        Row: {
          id: string;
          email: string | null;
          display_name: string | null;
          native_language: string;
          target_level: string;
          current_level: string;
          daily_goal_minutes: number;
          interests: string[];
          streak_count: number;
          total_words_learned: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };

      // ── 6. reading_sessions — Okuma seansları
      reading_sessions: {
        Row: {
          id: string;
          user_id: string;
          article_id: string;
          started_at: string;
          ended_at: string | null;
          duration_seconds: number | null;
          reading_speed_wpm: number | null;
          sentences_read: number;
          words_looked_up: number;
          difficulty_feedback: 'easy' | 'right' | 'hard' | null;
          playback_speed: number;
          completed: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['reading_sessions']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['reading_sessions']['Insert']>;
      };

      // ── 7. user_words — Kullanıcının kaydettiği kelimeler
      user_words: {
        Row: {
          id: string;
          user_id: string;
          word: string;
          article_id: string | null;
          status: 'new' | 'learning' | 'known';
          review_count: number;
          next_review_at: string | null;
          last_reviewed_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_words']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['user_words']['Insert']>;
      };

      // ── 8. sentence_bookmarks — Cümle bookmark'ları
      sentence_bookmarks: {
        Row: {
          id: string;
          user_id: string;
          article_id: string;
          sentence_index: number;
          note: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['sentence_bookmarks']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['sentence_bookmarks']['Insert']>;
      };
    };
  };
}

// ── Convenience type aliases
export type Article = Database['public']['Tables']['articles']['Row'];
export type ArticleSentence = Database['public']['Tables']['article_sentences']['Row'];
export type ArticleWord = Database['public']['Tables']['article_words']['Row'];
export type DictionaryEntry = Database['public']['Tables']['dictionary']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ReadingSession = Database['public']['Tables']['reading_sessions']['Row'];
export type UserWord = Database['public']['Tables']['user_words']['Row'];
export type SentenceBookmark = Database['public']['Tables']['sentence_bookmarks']['Row'];
