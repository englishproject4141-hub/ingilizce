import { supabase as rawSupabase } from '../lib/supabase';
import type { Database, UserWord, DictionaryEntry } from '../lib/database.types';
import { SupabaseClient } from '@supabase/supabase-js';
import { isVocabularyCandidate, normalizeVocabularyWord, uniqueVocabularyWords } from './vocabularyUtils';

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
    const normalizedWord = normalizeVocabularyWord(word);
    if (!isVocabularyCandidate(normalizedWord)) return false;

    const { error } = await supabase
      .from('user_words')
      .insert([{
        user_id: userId,
        word: normalizedWord,
        article_id: articleId || null,
        status: 'new',
        review_count: 0
      }] as any);

    if (error) {
      if (error.code === '23505') return false;
      console.error('saveWord error:', error);
      throw error;
    }

    return true;
  },

  async saveWords(userId: string, words: string[], articleId?: string) {
    const normalizedWords = uniqueVocabularyWords(words);
    if (normalizedWords.length === 0) return 0;

    const { data: existingWords, error: existingError } = await supabase
      .from('user_words')
      .select('word')
      .eq('user_id', userId)
      .in('word', normalizedWords);

    if (existingError) throw existingError;

    const existingSet = new Set(((existingWords || []) as { word: string }[]).map(item => item.word));
    const newWords = normalizedWords.filter(word => !existingSet.has(word));
    if (newWords.length === 0) return 0;

    const { error } = await supabase
      .from('user_words')
      .insert(newWords.map(word => ({
        user_id: userId,
        word,
        article_id: articleId || null,
        status: 'new',
        review_count: 0
      })) as any);

    if (error) {
      if (error.code === '23505') return 0;
      console.error('saveWords error:', error);
      throw error;
    }

    return newWords.length;
  },

  async getUnsavedDictionaryEntries(userId: string, words: string[], limit = 3) {
    const normalizedWords = uniqueVocabularyWords(words);
    if (normalizedWords.length === 0) return [];

    const { data: existingWords, error: existingError } = await supabase
      .from('user_words')
      .select('word')
      .eq('user_id', userId)
      .in('word', normalizedWords);

    if (existingError) {
      console.error('getUnsavedDictionaryEntries existing error:', existingError);
      return [];
    }

    const existingSet = new Set(((existingWords || []) as { word: string }[]).map(item => item.word.toLowerCase()));
    const unsavedWords = normalizedWords.filter(word => !existingSet.has(word)).slice(0, limit * 4);
    if (unsavedWords.length === 0) return [];

    const { data: dictionaryEntries, error: dictionaryError } = await supabase
      .from('dictionary')
      .select('*')
      .in('word', unsavedWords);

    if (dictionaryError) {
      console.error('getUnsavedDictionaryEntries dictionary error:', dictionaryError);
      return [];
    }

    const entries = (dictionaryEntries || []) as DictionaryEntry[];
    const entryMap = new Map(entries.map(entry => [entry.word.toLowerCase(), entry]));

    return unsavedWords
      .map(word => entryMap.get(word))
      .filter((entry): entry is DictionaryEntry => Boolean(entry))
      .slice(0, limit);
  }
};
