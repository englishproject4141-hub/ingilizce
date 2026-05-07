import { supabase as rawSupabase } from '../lib/supabase';
import type { Database, Article, ArticleSentence, DictionaryEntry } from '../lib/database.types';
import { SupabaseClient } from '@supabase/supabase-js';

// En garanti tip eşleme yöntemi
const supabase = (rawSupabase as unknown) as SupabaseClient<Database>;

// Supabase'in otomatik ürettiği Insert tiplerini kullanıyoruz (Maddi 2 & 3 Fix)
type ReadingSessionInsert = Database['public']['Tables']['reading_sessions']['Insert'];
type SentenceBookmarkInsert = Database['public']['Tables']['sentence_bookmarks']['Insert'];

export const articleService = {
  /**
   * Makale detaylarını, cümlelerini ve kelimelerini getirir
   */
  async getFullArticle(idOrSlug: string): Promise<{ article: Article; sentences: ArticleSentence[] } | null> {
    try {
      // 1. UUID kontrolü yapıyoruz (Postgres cast hatasını önlemek için)
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
      
      let query = supabase.from('articles').select('*');
      if (isUuid) {
        query = query.eq('id', idOrSlug);
      } else {
        query = query.eq('slug', idOrSlug);
      }

      const { data: article, error: articleError } = await query.maybeSingle();

      if (articleError || !article) {
        console.error('Makale çekme hatası:', articleError);
        return null;
      }

      // 2. Cümleleri getir
      const { data: sentences, error: sentencesError } = await supabase
        .from('article_sentences')
        .select('*')
        .eq('article_id', (article as Article).id)
        .order('sentence_index', { ascending: true });

      if (sentencesError) throw sentencesError;

      return {
        article,
        sentences: sentences || [],
      };
    } catch (e) {
      console.error('getFullArticle beklenmedik hata:', e);
      return null;
    }
  },

  /**
   * Bookmark durumunu günceller (Sentence-level bookmarking)
   */
  async toggleBookmark(userId: string, articleId: string, sentenceIndex: number, isBookmarked: boolean) {
    if (isBookmarked) {
      await supabase
        .from('sentence_bookmarks')
        .delete()
        .match({ 
          user_id: userId, 
          article_id: articleId, 
          sentence_index: sentenceIndex 
        });
    } else {
      await supabase
        .from('sentence_bookmarks')
        .insert([{
          user_id: userId,
          article_id: articleId,
          sentence_index: sentenceIndex
        }] as any); // Type error'ı aşmak için dizi ve cast
    }
  },

  /**
   * Tekrar sayısını getirir
   */
  async getRepetitionCount(userId: string, articleId: string): Promise<number> {
    const { count, error } = await supabase
      .from('reading_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('article_id', articleId)
      .eq('completed', true);

    if (error) console.error('Repetition count hatası:', error);
    return count || 0;
  },

  /**
   * Sözlükten kelime getirir
   */
  async getDictionaryEntry(word: string): Promise<DictionaryEntry | null> {
    const { data, error } = await supabase
      .from('dictionary')
      .select('*')
      .eq('word', word.toLowerCase())
      .maybeSingle();

    if (error) return null;
    return data;
  },

  /**
   * Okuma seansını kaydeder
   */
  async saveReadingSession(sessionData: ReadingSessionInsert) {
    // TypeScript'in 'never[]' inadını kırmak için dizi içine alıp cast ediyoruz
    const { error } = await supabase
      .from('reading_sessions')
      .insert([sessionData] as any); 
    
    if (error) {
      console.error('Seans kaydı hatası:', error);
      throw error;
    }
  },
};
