import { supabase as rawSupabase } from '../lib/supabase';
import { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Article } from '../lib/database.types';

const supabase = (rawSupabase as unknown) as SupabaseClient<Database>;

export type ContentFilter = {
  level?: string | 'Tümü';
  topics?: string[];
  durationRange?: 'Tümü' | '<5' | '5-10' | '>10';
  searchQuery?: string;
  viewMode?: 'grid' | 'list';
};

export const discoverService = {
  /**
   * Filtrelere göre ana içerik listesini getirir (Sayfalamalı)
   */
  async getArticles(filter: ContentFilter, page: number = 0, pageSize: number = 20) {
    let query = supabase
      .from('articles')
      .select('*', { count: 'exact' })
      .eq('is_published', true);

    // Seviye Filtresi
    if (filter.level && filter.level !== 'Tümü') {
      query = query.eq('level', filter.level);
    }

    // Konu Filtresi (Çoklu seçim)
    if (filter.topics && filter.topics.length > 0 && !filter.topics.includes('Tümü')) {
      query = query.in('topic', filter.topics);
    }

    // Süre Filtresi
    if (filter.durationRange && filter.durationRange !== 'Tümü') {
      if (filter.durationRange === '<5') {
        query = query.lt('duration_seconds', 300);
      } else if (filter.durationRange === '5-10') {
        query = query.gte('duration_seconds', 300).lte('duration_seconds', 600);
      } else if (filter.durationRange === '>10') {
        query = query.gt('duration_seconds', 600);
      }
    }

    // Arama (Debounce UI tarafında yapılacak)
    if (filter.searchQuery) {
      query = query.ilike('title', `%${filter.searchQuery}%`);
    }

    // Sayfalama
    const from = page * pageSize;
    const to = from + pageSize - 1;
    
    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return { data: data as Article[], count };
  },

  /**
   * "Kaldığın Yerden Devam Et" içeriklerini getirir
   */
  async getContinueReading(userId: string) {
    const { data, error } = await supabase
      .from('reading_sessions')
      .select('article_id, sentences_read, article:articles(*)')
      .eq('user_id', userId)
      .eq('completed', false)
      .order('updated_at', { ascending: false })
      .limit(5);

    if (error) return [];
    
    // Veriyi 'any' üzerinden map'leyerek join yapısındaki tip uyuşmazlığını gideriyoruz
    return (data as any[]).map(item => ({
      ...(item.article as Article),
      progress: item.sentences_read / ((item.article as any)?.sentence_count || 1)
    })) as (Article & { progress: number })[];
  },

  /**
   * "Seviyene Uygun" (Henüz okunmamış) içerikleri getirir
   */
  async getRecommendedForLevel(userId: string, level: string) {
    // Önce kullanıcının okuduğu article_id'leri al
    const { data: readIds } = await supabase
      .from('reading_sessions')
      .select('article_id')
      .eq('user_id', userId);

    const excludedIds = (readIds as any[])?.map(r => r.article_id) || [];

    let query = supabase
      .from('articles')
      .select('*')
      .eq('level', level)
      .eq('is_published', true);

    if (excludedIds.length > 0) {
      query = query.not('id', 'in', `(${excludedIds.join(',')})`);
    }

    const { data, error } = await query.limit(10);
    if (error) return [];
    return data as Article[];
  },

  /**
   * "Kısa ve Öz" (6 dakikadan kısa) içerikleri getirir
   */
  async getShortReads() {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .lt('duration_seconds', 360)
      .eq('is_published', true)
      .limit(10);

    if (error) return [];
    return data as Article[];
  }
};
