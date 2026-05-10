import { fsrs, Rating, State, Card } from 'ts-fsrs';
import { supabase } from '../lib/supabase';
import type { UserWord } from '../lib/database.types';

const f = fsrs();

export const srsService = {
  /**
   * DB'den gelen UserWord nesnesini FSRS Card nesnesine dönüştürür
   */
  mapToCard(word: UserWord): Card {
    return {
      due: word.next_review_at ? new Date(word.next_review_at) : new Date(),
      stability: (word as any).stability || 0,
      difficulty: (word as any).difficulty || 0,
      elapsed_days: (word as any).elapsed_days || 0,
      scheduled_days: (word as any).scheduled_days || 0,
      reps: word.review_count || 0,
      lapses: 0, // Şimdilik basitleştirilmiş
      state: (word as any).state || State.New,
      last_review: word.last_reviewed_at ? new Date(word.last_reviewed_at) : undefined,
    };
  },

  /**
   * Bir kelimeyi değerlendir ve DB'yi güncelle
   */
  async reviewWord(word: UserWord, rating: Rating) {
    const card = this.mapToCard(word);
    const schedulingCards = f.repeat(card, new Date());
    const updatedCard = schedulingCards[rating].card;

    const { error } = await supabase
      .from('user_words')
      .update({
        review_count: updatedCard.reps,
        next_review_at: updatedCard.due.toISOString(),
        last_reviewed_at: updatedCard.last_review?.toISOString(),
        stability: updatedCard.stability,
        difficulty: updatedCard.difficulty,
        elapsed_days: updatedCard.elapsed_days,
        scheduled_days: updatedCard.scheduled_days,
        state: updatedCard.state,
        status: updatedCard.state === State.New ? 'new' : (updatedCard.state === State.Review ? 'known' : 'learning')
      } as any)
      .eq('id', word.id);

    if (error) {
      console.error('SRS Update Error:', error);
      throw error;
    }

    return updatedCard;
  },

  /**
   * Bugün tekrar edilmesi gereken kelimeleri getir
   */
  async getDueWords(userId: string) {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('user_words')
      .select('*, dictionary(*)')
      .eq('user_id', userId)
      .lte('next_review_at', now)
      .order('next_review_at', { ascending: true });

    if (error) {
      console.error('getDueWords error:', error);
      throw error;
    }

    return data;
  }
};
