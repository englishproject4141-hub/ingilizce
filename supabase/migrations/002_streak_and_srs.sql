-- ══════════════════════════════════════════════════════════════
-- LinguaRead — Migrasyon 002: Streak ve SRS Hazırlığı
-- ══════════════════════════════════════════════════════════════

-- 1. USER_WORDS TABLOSUNA FSRS ALANLARINI EKLE
-- ts-fsrs kütüphanesi için gerekli veriler
ALTER TABLE public.user_words
ADD COLUMN IF NOT EXISTS stability REAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS difficulty REAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS elapsed_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS scheduled_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS state INTEGER DEFAULT 0; -- 0: New, 1: Learning, 2: Review, 3: Relearning

-- 2. STREAK MANTIĞI: FONKSİYON
CREATE OR REPLACE FUNCTION public.handle_streak_update()
RETURNS TRIGGER AS $$
DECLARE
  last_session_date DATE;
  today DATE := (NEW.created_at AT TIME ZONE 'UTC')::DATE;
  current_streak INTEGER;
BEGIN
  -- Sadece tamamlanmış ve yeni eklenen seanslarda çalış
  IF NEW.completed = TRUE THEN
    -- Kullanıcının mevcut streak'ini al
    SELECT streak_count INTO current_streak FROM public.profiles WHERE id = NEW.user_id;

    -- Bugün zaten streak artmış mı kontrol et
    -- (Bugün yapılan başka bir tamamlanmış seans var mı?)
    IF EXISTS (
      SELECT 1 FROM public.reading_sessions 
      WHERE user_id = NEW.user_id 
        AND completed = TRUE 
        AND id != NEW.id 
        AND (created_at AT TIME ZONE 'UTC')::DATE = today
    ) THEN
      RETURN NEW; -- Bugün zaten seans yapılmış, bir şey yapma
    END IF;

    -- En son tamamlanan seans tarihini bul (bugün hariç)
    SELECT (created_at AT TIME ZONE 'UTC')::DATE INTO last_session_date
    FROM public.reading_sessions
    WHERE user_id = NEW.user_id 
      AND completed = TRUE 
      AND id != NEW.id
      AND (created_at AT TIME ZONE 'UTC')::DATE < today
    ORDER BY created_at DESC
    LIMIT 1;

    -- MANTIK:
    -- 1. Eğer dün seans yapmışsa: streak + 1
    -- 2. Eğer dün yapmamışsa ama bu ilk seansıysa veya çok ara vermişse: streak = 1
    IF last_session_date = today - 1 THEN
      UPDATE public.profiles SET streak_count = streak_count + 1, updated_at = NOW() WHERE id = NEW.user_id;
    ELSIF last_session_date IS NULL OR last_session_date < today - 1 THEN
      UPDATE public.profiles SET streak_count = 1, updated_at = NOW() WHERE id = NEW.user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. STREAK MANTIĞI: TRIGGER
-- Seans güncellendiğinde (completed=true olduğunda) veya yeni eklendiğinde tetiklenir
DROP TRIGGER IF EXISTS on_session_completed ON public.reading_sessions;
CREATE TRIGGER on_session_completed
  AFTER INSERT OR UPDATE ON public.reading_sessions
  FOR EACH ROW EXECUTE FUNCTION public.handle_streak_update();
