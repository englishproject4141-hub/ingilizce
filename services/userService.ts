import { supabase as rawSupabase } from '../lib/supabase';
import type { Database, UserWord, DictionaryEntry } from '../lib/database.types';
import { SupabaseClient } from '@supabase/supabase-js';

const supabase = (rawSupabase as unknown) as SupabaseClient<Database>;

export const userService = {
  /**
   * Kullanıcının kaydettiği kelimeleri sözlük verileriyle birlikte getirir
   */
  async getUserWords(userId: string) {
    try {
      // Önce kullanıcının kelimelerini çek
      const { data: userWords, error: userWordsError } = await supabase
        .from('user_words')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (userWordsError) throw userWordsError;
      const words = (userWords || []) as UserWord[];
      if (words.length === 0) return [];

      // Bu kelimelerin sözlük karşılıklarını çek
      const wordList = words.map(uw => uw.word.toLowerCase());
      const { data: dictionaryEntries, error: dictError } = await supabase
        .from('dictionary')
        .select('*')
        .in('word', wordList);

      if (dictError) throw dictError;
      const dicts = (dictionaryEntries || []) as DictionaryEntry[];

      // Verileri birleştir
      return words.map(uw => {
        const dict = dicts.find(d => d.word.toLowerCase() === uw.word.toLowerCase());
        return {
          ...uw,
          dictionary: dict || null
        };
      });
    } catch (e) {
      console.error('getUserWords error:', e);
      return [];
    }
  },

  /**
   * Kelimeyi kaydeder veya durumunu günceller
   */
  async saveWord(userId: string, word: string, articleId?: string) {
    const { data: existing } = await supabase
      .from('user_words')
      .select('id')
      .eq('user_id', userId)
      .eq('word', word.toLowerCase())
      .maybeSingle();

    if (existing) return;

    await supabase
      .from('user_words')
      .insert([{
        user_id: userId,
        word: word.toLowerCase(),
        article_id: articleId || null,
        status: 'new',
        review_count: 0
      }] as any);
  }
};
