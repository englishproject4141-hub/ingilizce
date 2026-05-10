const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Dosya Yolu (Garantili Mutlak Yol)
const INPUT_FILE = path.resolve(process.cwd(), 'assets/processed/natural_conversation_enriched.json');

async function uploadToSupabase() {
  console.log('📦 Supabase\'e veri transferi başlıyor...');

  if (!fs.existsSync(INPUT_FILE)) {
    console.error('❌ Hata: Enriched JSON dosyası bulunamadı!');
    return;
  }

  const data = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
  const words = data.words;

  // 1. Makaleyi Oluştur
  const { data: article, error: articleError } = await supabase
    .from('articles')
    .insert([{
      title: "Natural Conversations: Morning in the Woods",
      slug: "natural-conversation",
      level: "B1",
      topic: "Nature",
      category: "Daily Life",
      audio_url: "https://mwwqaqhmmddwgvopfmqi.supabase.co/storage/v1/object/public/audio-files/natural_conversation.mp3",
      full_text: data.text,
      duration_seconds: Math.round(data.duration),
      word_count: words.length,
      is_premium: false,
      is_published: true
    }])
    .select()
    .single();

  if (articleError) {
    console.error('❌ Makale hatası:', articleError.message);
    return;
  }
  const articleId = article.id;
  console.log(`✅ Makale oluşturuldu: ${articleId}`);

  // 2. Cümleleri ve Kelimeleri Hazırla (İlişkisel Dağıtım)
  const sentencesToInsert = [];
  const wordsToInsert = [];
  
  let currentSentenceIndex = 0;
  let currentSentenceWords = [];

  words.forEach((w, idx) => {
    currentSentenceWords.push(w.word);
    
    // Kelime sonunda nokta, soru işareti veya ünlem varsa cümleyi bitir
    const isEndOfSentence = /[.!?]/.test(w.word) || idx === words.length - 1;
    
    if (isEndOfSentence) {
      const sentenceText = currentSentenceWords.join(' ');
      sentencesToInsert.push({
        article_id: articleId,
        sentence_index: currentSentenceIndex,
        text_en: sentenceText,
        start_ms: words[idx - currentSentenceWords.length + 1].start_ms,
        end_ms: w.end_ms,
        paragraph_index: 0
      });

      // Bu cümledeki kelimeleri de hazırla
      currentSentenceWords.forEach((wordText, sWIdx) => {
        const originalWordObj = words[idx - currentSentenceWords.length + 1 + sWIdx];
        wordsToInsert.push({
          article_id: articleId,
          sentence_index: currentSentenceIndex,
          word: originalWordObj.word,
          word_lower: originalWordObj.word_lower,
          word_index: sWIdx,
          start_ms: originalWordObj.start_ms,
          end_ms: originalWordObj.end_ms,
          ipa: originalWordObj.ipa,
          translation_tr: originalWordObj.translation_tr,
          cefr_level: originalWordObj.cefr_level,
          is_key: originalWordObj.is_key,
          lemma: originalWordObj.lemma
        });
      });

      currentSentenceIndex++;
      currentSentenceWords = [];
    }
  });

  // 3. Cümleleri Toplu Yükle (Batch Insert)
  console.log(`⏳ ${sentencesToInsert.length} cümle yükleniyor...`);
  const { data: insertedSentences, error: sErr } = await supabase
    .from('article_sentences')
    .insert(sentencesToInsert)
    .select();

  if (sErr) {
    console.error('❌ Cümle yükleme hatası:', sErr.message);
    return;
  }

  // 4. Kelimeleri Toplu Yükle (Batch Insert)
  // Not: Postgres limitleri nedeniyle kelimeleri 500'erli gruplar halinde yükleyebiliriz
  console.log(`⏳ ${wordsToInsert.length} kelime yükleniyor...`);
  
  const { error: wErr } = await supabase
    .from('article_words')
    .insert(wordsToInsert);

  if (wErr) {
    console.error('❌ Kelime yükleme hatası:', wErr.message);
  } else {
    console.log('🎉 TEBRİKLER! Makale, Cümleler ve Kelimeler senkronize şekilde yüklendi.');
    console.log('🚀 Artık Reader ekranında Karaoke keyfi yapabilirsin!');
  }
}

uploadToSupabase();
