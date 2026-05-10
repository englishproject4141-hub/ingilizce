const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Dosya Yolları (Garantili Mutlak Yol)
const INPUT_FILE = path.resolve(process.cwd(), 'assets/processed/natural_conversation_raw.json');
const OUTPUT_FILE = path.resolve(process.cwd(), 'assets/processed/natural_conversation_enriched.json');

async function enrichWithGroq() {
  console.log('🧠 Groq Llama-3 ile NLP zenginleştirme başlıyor...');

  if (!fs.existsSync(INPUT_FILE)) {
    console.error('❌ Hata: Önce process-audio.js çalıştırılmalı!');
    return;
  }

  const rawData = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
  const allWords = rawData.words;
  
  // Kelimeleri tekil hale getirip (unique) analiz edelim ki API'yi yormayalım
  const uniqueWords = [...new Set(allWords.map(w => w.word.toLowerCase().replace(/[.,!?]/g, '')))];
  console.log(`📝 Toplam ${allWords.length} kelimeden ${uniqueWords.length} tanesi benzersiz. Analiz ediliyor...`);

  const enrichedDictionary = {};
  const batchSize = 30; // Her seferinde 30 kelime gönderelim

  for (let i = 0; i < uniqueWords.length; i += batchSize) {
    const batch = uniqueWords.slice(i, i + batchSize);
    console.log(`⏳ İşleniyor: ${i + 1} - ${Math.min(i + batchSize, uniqueWords.length)}...`);

    const prompt = `
      Analyze these English words and return a JSON object where each key is the word and the value is:
      { "ipa": "phonetic transcription", "tr": "turkish translation", "cefr": "A1/A2/B1/B2/C1/C2" }
      
      Words: ${batch.join(', ')}
      Return ONLY JSON.
    `;

    try {
      const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      }, {
        headers: { 'Authorization': `Bearer ${GROQ_API_KEY}` }
      });

      const results = JSON.parse(response.data.choices[0].message.content);
      Object.assign(enrichedDictionary, results);
    } catch (error) {
      console.error('❌ Batch işleme hatası:', error.message);
    }
  }

  // Ham veriyi zenginleştirilmiş veriyle birleştir
  const enrichedWords = allWords.map((wordObj, index) => {
    const cleanWord = wordObj.word.toLowerCase().replace(/[.,!?]/g, '');
    const dict = enrichedDictionary[cleanWord] || {};
    
    return {
      word: wordObj.word,
      word_lower: cleanWord,
      word_index: index,
      start_ms: Math.round(wordObj.start * 1000), // Saniyeyi milisaniyeye çevir
      end_ms: Math.round(wordObj.end * 1000),
      ipa: dict.ipa || null,
      translation_tr: dict.tr || null,
      cefr_level: dict.cefr || "B1",
      is_key: ['B1', 'B2', 'C1'].includes(dict.cefr),
      lemma: cleanWord
    };
  });

  const finalData = {
    ...rawData,
    words: enrichedWords
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalData, null, 2));
  console.log(`\n✨ MÜKEMMEL! Zenginleştirilmiş veri hazır: ${OUTPUT_FILE}`);
}

enrichWithGroq();
