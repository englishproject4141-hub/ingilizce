-- ══════════════════════════════════════════════════════════════
-- LinguaRead — Veritabanı Şeması (Supabase SQL Editor'de çalıştır)
-- ══════════════════════════════════════════════════════════════
-- Bu dosyayı Supabase Dashboard > SQL Editor'e yapıştırıp "Run" butonuna bas.
-- Tüm tablolar, indexler ve RLS kuralları tek seferde oluşur.
-- ══════════════════════════════════════════════════════════════

-- UUID extension (genellikle zaten aktif)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ┌─────────────────────────────────────────────────────────────
-- │ 1. articles — Ana içerik tablosu
-- └─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.articles (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  full_text     TEXT NOT NULL,
  audio_url     TEXT,
  level         TEXT NOT NULL DEFAULT 'B1',       -- A1, A2, B1, B2, C1, C2
  topic         TEXT NOT NULL DEFAULT 'General',
  category      TEXT NOT NULL DEFAULT 'Genel',
  duration_seconds  INTEGER DEFAULT 0,
  word_count    INTEGER DEFAULT 0,
  sentence_count INTEGER DEFAULT 0,
  difficulty_score  REAL,                          -- 0.0 - 1.0 arası AI skoru
  cover_image_url   TEXT,
  is_premium    BOOLEAN DEFAULT FALSE,
  is_published  BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ┌─────────────────────────────────────────────────────────────
-- │ 2. article_sentences — Cümle bazlı parçalama
-- └─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.article_sentences (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id      UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  sentence_index  INTEGER NOT NULL,
  text_en         TEXT NOT NULL,
  text_tr         TEXT,
  paragraph_index INTEGER NOT NULL DEFAULT 0,
  start_ms        INTEGER,                         -- ses timestamp (ms)
  end_ms          INTEGER,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (article_id, sentence_index)
);

-- ┌─────────────────────────────────────────────────────────────
-- │ 3. article_words — Kelime bazlı (karaoke sync için)
-- └─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.article_words (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id      UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  sentence_id     UUID REFERENCES public.article_sentences(id) ON DELETE CASCADE,
  word            TEXT NOT NULL,
  word_lower      TEXT NOT NULL,                    -- lowercase arama için
  word_index      INTEGER NOT NULL,                 -- makale içindeki sıra
  sentence_index  INTEGER NOT NULL,
  start_ms        INTEGER,
  end_ms          INTEGER,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ┌─────────────────────────────────────────────────────────────
-- │ 4. dictionary — Merkezi sözlük
-- └─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.dictionary (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  word            TEXT UNIQUE NOT NULL,
  ipa             TEXT,
  pos             TEXT,                              -- noun, verb, adj...
  definition_en   TEXT NOT NULL,
  definition_tr   TEXT NOT NULL,
  example_sentence TEXT,
  word_family     TEXT[],                            -- {'remotely', 'remoteness'}
  cefr_level      TEXT,                              -- A1, A2, B1, B2, C1
  frequency_rank  INTEGER,                           -- ne kadar yaygın (1=en yaygın)
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ┌─────────────────────────────────────────────────────────────
-- │ 5. profiles — Kullanıcı profilleri (auth.users ile bağlı)
-- └─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email               TEXT,
  display_name        TEXT,
  native_language     TEXT DEFAULT 'tr',
  target_level        TEXT DEFAULT 'B2',
  current_level       TEXT DEFAULT 'B1',
  daily_goal_minutes  INTEGER DEFAULT 15,
  interests           TEXT[] DEFAULT '{}',
  streak_count        INTEGER DEFAULT 0,
  total_words_learned INTEGER DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ┌─────────────────────────────────────────────────────────────
-- │ 6. reading_sessions — Okuma seansları + WPM + zorluk
-- └─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reading_sessions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  article_id          UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  started_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at            TIMESTAMPTZ,
  duration_seconds    INTEGER,
  reading_speed_wpm   INTEGER,
  sentences_read      INTEGER DEFAULT 0,
  words_looked_up     INTEGER DEFAULT 0,
  difficulty_feedback TEXT CHECK (difficulty_feedback IN ('easy', 'right', 'hard')),
  playback_speed      REAL DEFAULT 1.0,
  completed           BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ┌─────────────────────────────────────────────────────────────
-- │ 7. user_words — Kullanıcının kaydettiği kelimeler (SRS)
-- └─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_words (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  word            TEXT NOT NULL,
  article_id      UUID REFERENCES public.articles(id),
  status          TEXT DEFAULT 'new' CHECK (status IN ('new', 'learning', 'known')),
  review_count    INTEGER DEFAULT 0,
  next_review_at  TIMESTAMPTZ,
  last_reviewed_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, word)
);

-- ┌─────────────────────────────────────────────────────────────
-- │ 8. sentence_bookmarks — Cümle işaretleri
-- └─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sentence_bookmarks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  article_id      UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  sentence_index  INTEGER NOT NULL,
  note            TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, article_id, sentence_index)
);


-- ══════════════════════════════════════════════════════════════
-- INDEXLER (Performans)
-- ══════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_article_sentences_article ON public.article_sentences(article_id);
CREATE INDEX IF NOT EXISTS idx_article_words_article ON public.article_words(article_id);
CREATE INDEX IF NOT EXISTS idx_article_words_lower ON public.article_words(word_lower);
CREATE INDEX IF NOT EXISTS idx_dictionary_word ON public.dictionary(word);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_user ON public.reading_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_article ON public.reading_sessions(article_id);
CREATE INDEX IF NOT EXISTS idx_user_words_user ON public.user_words(user_id);
CREATE INDEX IF NOT EXISTS idx_user_words_status ON public.user_words(user_id, status);
CREATE INDEX IF NOT EXISTS idx_sentence_bookmarks_user ON public.sentence_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_articles_level_topic ON public.articles(level, topic);


-- ══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ══════════════════════════════════════════════════════════════

-- articles — herkes okuyabilir
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Articles are viewable by everyone"
  ON public.articles FOR SELECT
  USING (is_published = true);

-- article_sentences — herkes okuyabilir
ALTER TABLE public.article_sentences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sentences are viewable by everyone"
  ON public.article_sentences FOR SELECT
  USING (true);

-- article_words — herkes okuyabilir
ALTER TABLE public.article_words ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Words are viewable by everyone"
  ON public.article_words FOR SELECT
  USING (true);

-- dictionary — herkes okuyabilir
ALTER TABLE public.dictionary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dictionary is viewable by everyone"
  ON public.dictionary FOR SELECT
  USING (true);

-- profiles — kullanıcı sadece kendisini görebilir/güncelleyebilir
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- reading_sessions — kullanıcı kendi seanslarını yönetir
ALTER TABLE public.reading_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own sessions"
  ON public.reading_sessions FOR ALL
  USING (auth.uid() = user_id);

-- user_words — kullanıcı kendi kelimelerini yönetir
ALTER TABLE public.user_words ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own words"
  ON public.user_words FOR ALL
  USING (auth.uid() = user_id);

-- sentence_bookmarks — kullanıcı kendi bookmark'larını yönetir
ALTER TABLE public.sentence_bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own bookmarks"
  ON public.sentence_bookmarks FOR ALL
  USING (auth.uid() = user_id);


-- ══════════════════════════════════════════════════════════════
-- AUTO-UPDATE TRIGGER (updated_at)
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_articles_updated
  BEFORE UPDATE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ══════════════════════════════════════════════════════════════
-- AUTO-CREATE PROFILE (yeni kayıtta otomatik profil)
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
