const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Anonim key yerine (eğer varsa) Service Role Key kullanıyoruz (RLS'yi aşmak için)
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, supabaseKey);
const baseName = process.argv[2];

if (!baseName) {
  console.error('❌ Hata: Lütfen dosya ismini belirtin! Örn: node 3-loader.js natural_conversation');
  process.exit(1);
}

const INPUT_FILE = path.resolve(process.cwd(), 'assets/processed', `${baseName}_enriched.json`);

async function uploadToSupabase() {
  console.log(`📦 [${baseName}] Supabase yüklemesi başlıyor...`);

  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`❌ Hata: ${INPUT_FILE} bulunamadı!`);
    return;
  }

  const data = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
  const words = data.words;
  const slug = baseName.replace(/_/g, '-');

  // 0. VARSA ESKİSİNİ SİL (Unique Constraint hatasını önler)
  console.log(`🧹 Eski [${slug}] verileri temizleniyor...`);
  await supabase.from('articles').delete().eq('slug', slug);

  // 1. Makale
  const { data: article, error: articleError } = await supabase
    .from('articles')
    .insert([{
      title: baseName.replace(/_/g, ' ').toUpperCase(),
      slug: slug,
      level: "B1",
      audio_url: `https://mwwqaqhmmddwgvopfmqi.supabase.co/storage/v1/object/public/audio-files/${baseName}.mp3`,
      full_text: data.text,
      duration_seconds: Math.round(data.duration),
      word_count: words.length,
      is_published: true
    }])
    .select().single();

  if (articleError) { console.error('❌ Makale hatası:', articleError.message); return; }
  
  const sentencesToInsert = [];
  const wordsToInsert = [];
  let curSentIdx = 0;
  let curSentWords = [];

  words.forEach((w, idx) => {
    curSentWords.push(w.word);
    if (/[.!?]/.test(w.word) || idx === words.length - 1) {
      sentencesToInsert.push({
        article_id: article.id,
        sentence_index: curSentIdx,
        text_en: curSentWords.join(' '),
        start_ms: words[idx - curSentWords.length + 1].start_ms,
        end_ms: w.end_ms
      });

      curSentWords.forEach((wt, sWIdx) => {
        const orig = words[idx - curSentWords.length + 1 + sWIdx];
        wordsToInsert.push({ article_id: article.id, sentence_index: curSentIdx, ...orig, word_index: sWIdx });
      });
      curSentIdx++;
      curSentWords = [];
    }
  });

  await supabase.from('article_sentences').insert(sentencesToInsert);
  const { error: wErr } = await supabase.from('article_words').insert(wordsToInsert);

  // 4. SÖZLÜK TABLOSUNU GÜNCELLE (Global Sözlük — Tüm Groq Verileri)
  console.log(`📖 Global sözlük güncelleniyor...`);
  const uniqueDictWords = {};
  words.forEach(w => {
    if (!uniqueDictWords[w.word_lower]) {
      uniqueDictWords[w.word_lower] = {
        word: w.word_lower,
        ipa: w.ipa,
        definition_tr: w.translation_tr,
        definition_en: w.definition_en || null,
        cefr_level: w.cefr_level,
        pos: w.pos || null,
        example_sentence: w.example_sentence || null,
        word_family: w.word_family || null
      };
    }
  });

  const dictToInsert = Object.values(uniqueDictWords);
  const { error: dErr } = await supabase.from('dictionary').upsert(dictToInsert, { onConflict: 'word' });

  if (wErr) console.error('❌ Kelime hatası:', wErr.message);
  if (dErr) console.error('❌ Sözlük güncelleme hatası:', dErr.message);
  else console.log(`🎉 BAŞARILI! Makale, kelimeler ve global sözlük yüklendi: ${baseName}`);
}

uploadToSupabase();
