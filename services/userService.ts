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
        review_count: 0,
        next_review_at: new Date().toISOString()
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
        review_count: 0,
        next_review_at: new Date().toISOString()
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
  },

  /**
   * Kullanıcı profilini getirir
   */
  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('getUserProfile error:', error);
      throw error;
    }
    return data;
  },

  /**
   * Kullanıcı profilini günceller (Onboarding verileri için)
   */
  async updateUserProfile(userId: string, updates: Partial<Database['public']['Tables']['profiles']['Update']>) {
    const { error } = await supabase
      .from('profiles')
      .update(updates as any)
      .eq('id', userId);

    if (error) {
      console.error('updateUserProfile error:', error);
      throw error;
    }
    return true;
  },

  // ─────────────────────────────────────────────────────────────
  // PROFILE ANALİTİK METODLARI (Ayrı hafif query'ler)
  // ─────────────────────────────────────────────────────────────

  /**
   * Profil istatistiklerini getirir (kelime sayıları + dinleme süresi)
   */
  async getProfileStats(userId: string) {
    try {
      // 1. Toplam kelime sayısı
      const { count: totalWords } = await supabase
        .from('user_words')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // 2. Öğrenilmiş kelime sayısı (status = 'known')
      const { count: learnedWords } = await supabase
        .from('user_words')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'known');

      // 3. Toplam dinleme süresi (saat)
      const { data: sessions } = await supabase
        .from('reading_sessions')
        .select('duration_seconds')
        .eq('user_id', userId);

      const totalSeconds = ((sessions || []) as { duration_seconds: number | null }[])
        .reduce((acc, s) => acc + (s.duration_seconds || 0), 0);

      return {
        totalWords: totalWords || 0,
        learnedWords: learnedWords || 0,
        totalListeningMinutes: Math.round(totalSeconds / 60),
        totalSessions: (sessions || []).length,
      };
    } catch (e) {
      console.error('getProfileStats error:', e);
      return { totalWords: 0, learnedWords: 0, totalListeningMinutes: 0, totalSessions: 0 };
    }
  },

  /**
   * Son N günlük seans aktivitesini getirir (Takvim/Heatmap için)
   */
  async getActivityCalendar(userId: string, days: number = 30) {
    try {
      const since = new Date();
      since.setDate(since.getDate() - days);

      const { data: sessions } = await supabase
        .from('reading_sessions')
        .select('created_at, duration_seconds, completed')
        .eq('user_id', userId)
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: true });

      if (!sessions || sessions.length === 0) return [];

      // Günlük gruplama
      const dayMap: Record<string, { sessionCount: number; totalMinutes: number }> = {};
      
      for (const s of sessions as { created_at: string; duration_seconds: number | null; completed: boolean }[]) {
        const dateKey = s.created_at.split('T')[0]; // 'YYYY-MM-DD'
        if (!dayMap[dateKey]) {
          dayMap[dateKey] = { sessionCount: 0, totalMinutes: 0 };
        }
        dayMap[dateKey].sessionCount += 1;
        dayMap[dateKey].totalMinutes += Math.round((s.duration_seconds || 0) / 60);
      }

      return Object.entries(dayMap).map(([date, data]) => ({
        date,
        ...data,
      }));
    } catch (e) {
      console.error('getActivityCalendar error:', e);
      return [];
    }
  },

  /**
   * Haftalık ortalama okuma hızı trendini getirir (WPM Grafiği için)
   */
  async getWeeklyWpmTrend(userId: string, weeks: number = 5) {
    try {
      const since = new Date();
      since.setDate(since.getDate() - (weeks * 7));

      const { data: sessions } = await supabase
        .from('reading_sessions')
        .select('created_at, reading_speed_wpm')
        .eq('user_id', userId)
        .gte('created_at', since.toISOString())
        .not('reading_speed_wpm', 'is', null)
        .order('created_at', { ascending: true });

      if (!sessions || sessions.length === 0) return [];

      // Haftalık gruplama
      const weekLabels = ['Bu hafta', 'Geçen hafta', '2 hafta önce', '3 hafta önce', '4 hafta önce'];
      const now = new Date();
      const weekBuckets: { label: string; wpmValues: number[] }[] = [];

      for (let i = 0; i < weeks; i++) {
        weekBuckets.push({ label: weekLabels[i] || `${i} hafta önce`, wpmValues: [] });
      }

      for (const s of sessions as { created_at: string; reading_speed_wpm: number | null }[]) {
        if (!s.reading_speed_wpm) continue;
        const sessionDate = new Date(s.created_at);
        const daysDiff = Math.floor((now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
        const weekIndex = Math.min(Math.floor(daysDiff / 7), weeks - 1);
        weekBuckets[weekIndex]?.wpmValues.push(s.reading_speed_wpm);
      }

      return weekBuckets
        .map(bucket => ({
          weekLabel: bucket.label,
          avgWpm: bucket.wpmValues.length > 0
            ? Math.round(bucket.wpmValues.reduce((a, b) => a + b, 0) / bucket.wpmValues.length)
            : 0,
        }))
        .reverse(); // En eski → en yeni sıralama
    } catch (e) {
      console.error('getWeeklyWpmTrend error:', e);
      return [];
    }
  },
};
