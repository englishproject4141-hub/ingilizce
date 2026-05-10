const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GROQ_API_KEY) {
  console.error('❌ Hata: .env dosyasında GROQ_API_KEY bulunamadı!');
  process.exit(1);
}

// Ayarlar
const AUDIO_FILE_PATH = path.join(__dirname, '../../assets/audio/natural_conversation.mp3');
const OUTPUT_DIR = path.join(__dirname, '../../assets/processed');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'natural_conversation_raw.json');

async function processAudio() {
  console.log('🎙️ Ses analizi başlıyor (Groq Whisper API - Ultra Fast)...');

  if (!fs.existsSync(AUDIO_FILE_PATH)) {
    console.error(`❌ Dosya bulunamadı: ${AUDIO_FILE_PATH}`);
    return;
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const formData = new FormData();
  formData.append('file', fs.createReadStream(AUDIO_FILE_PATH));
  formData.append('model', 'whisper-large-v3'); // Groq'un en iyi modeli
  formData.append('response_format', 'verbose_json');
  formData.append('timestamp_granularities[]', 'word');

  try {
    const response = await axios.post('https://api.groq.com/openai/v1/audio/transcriptions', formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
    });

    console.log('✅ Groq Analizi tamamlandı!');
    
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(response.data, null, 2));
    console.log(`📂 Veri kaydedildi: ${OUTPUT_FILE}`);
    
    console.log('\n--- ÖZET ---');
    console.log(`Metin: ${response.data.text.substring(0, 100)}...`);
    console.log(`Kelime Sayısı: ${response.data.words?.length || 0}`);
    
  } catch (error) {
    console.error('❌ Groq API Hatası:', error.response ? error.response.data : error.message);
  }
}

processAudio();
