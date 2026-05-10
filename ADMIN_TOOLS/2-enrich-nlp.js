const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const baseName = process.argv[2]; // Örn: natural_conversation (uzantısız)

if (!baseName) {
  console.error('❌ Hata: Lütfen dosya ismini belirtin! Örn: node 2-enrich-nlp.js natural_conversation');
  process.exit(1);
}

const INPUT_FILE = path.resolve(process.cwd(), 'assets/processed', `${baseName}_raw.json`);
const OUTPUT_FILE = path.resolve(process.cwd(), 'assets/processed', `${baseName}_enriched.json`);

async function enrichWithGroq() {
  console.log(`🧠 [${baseName}] NLP zenginleştirme (Groq Llama-3)...`);

  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`❌ Hata: ${INPUT_FILE} bulunamadı!`);
    return;
  }

  const rawData = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
  const allWords = rawData.words;
  const uniqueWords = [...new Set(allWords.map(w => w.word.toLowerCase().replace(/[.,!?]/g, '')))];
  
  const enrichedDictionary = {};
  const batchSize = 20; // Daha zengin çıktı için batch boyutunu küçülttük

  for (let i = 0; i < uniqueWords.length; i += batchSize) {
    const batch = uniqueWords.slice(i, i + batchSize);
    console.log(`⏳ İşleniyor: ${i + 1} - ${Math.min(i + batchSize, uniqueWords.length)}...`);

    const prompt = `You are a linguistics expert. For each English word below, return a JSON object where each key is the word and each value has these fields:
- "ipa": IPA phonetic transcription (e.g. "/prəˈdʌk.tɪv/")
- "tr": Turkish translation (most common meaning)
- "en": Short English definition (one sentence)
- "cefr": CEFR level (A1/A2/B1/B2/C1/C2)
- "pos": Part of speech (noun/verb/adjective/adverb/preposition/conjunction/other)
- "example": A natural example sentence using the word
- "family": Array of 1-3 related word forms (e.g. ["production","productive","producer"])

Words: ${batch.join(', ')}`;

    try {
      const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.3
      }, {
        headers: { 'Authorization': `Bearer ${GROQ_API_KEY}` }
      });

      Object.assign(enrichedDictionary, JSON.parse(response.data.choices[0].message.content));
    } catch (e) { console.error('❌ Hata:', e.message); }
  }

  const enrichedWords = allWords.map((wordObj, index) => {
    const cleanWord = wordObj.word.toLowerCase().replace(/[.,!?]/g, '');
    const dict = enrichedDictionary[cleanWord] || {};
    return {
      word: wordObj.word,
      word_lower: cleanWord,
      word_index: index,
      start_ms: Math.round(wordObj.start * 1000),
      end_ms: Math.round(wordObj.end * 1000),
      ipa: dict.ipa || null,
      translation_tr: dict.tr || null,
      definition_en: dict.en || null,
      cefr_level: dict.cefr || "B1",
      pos: dict.pos || null,
      example_sentence: dict.example || null,
      word_family: dict.family || null,
      is_key: ['A1', 'A2', 'B1', 'B2', 'C1'].includes(dict.cefr),
      lemma: cleanWord
    };
  });

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify({ ...rawData, words: enrichedWords }, null, 2));
  console.log(`✨ Zenginleştirilmiş veri hazır: ${OUTPUT_FILE}`);
}

enrichWithGroq();
