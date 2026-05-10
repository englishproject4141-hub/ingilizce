const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const fileName = process.argv[2]; // Terminalden gelen dosya ismi

if (!fileName) {
  console.error('❌ Hata: Lütfen bir ses dosyası ismi belirtin! Örn: node process.js natural_conversation.mp3');
  process.exit(1);
}

const baseName = path.parse(fileName).name;
const AUDIO_FILE_PATH = path.resolve(process.cwd(), 'assets/audio', fileName);
const OUTPUT_FILE = path.resolve(process.cwd(), 'assets/processed', `${baseName}_raw.json`);

async function processAudio() {
  console.log(`🎙️ [${fileName}] Analizi başlıyor (Groq Whisper)...`);

  if (!fs.existsSync(AUDIO_FILE_PATH)) {
    console.error(`❌ Dosya bulunamadı: ${AUDIO_FILE_PATH}`);
    process.exit(1);
  }

  const formData = new FormData();
  formData.append('file', fs.createReadStream(AUDIO_FILE_PATH));
  formData.append('model', 'whisper-large-v3');
  formData.append('response_format', 'verbose_json');
  formData.append('timestamp_granularities[]', 'word');

  try {
    const response = await axios.post('https://api.groq.com/openai/v1/audio/transcriptions', formData, {
      headers: { ...formData.getHeaders(), 'Authorization': `Bearer ${GROQ_API_KEY}` },
    });

    if (!fs.existsSync(path.dirname(OUTPUT_FILE))) fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(response.data, null, 2));
    console.log(`✅ Ham veri oluşturuldu: ${OUTPUT_FILE}`);
  } catch (error) {
    console.error('❌ Hata:', error.response ? error.response.data : error.message);
  }
}

processAudio();
