const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials missing in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSlug() {
  const { data, error } = await supabase
    .from('articles')
    .select('slug')
    .eq('slug', 'natural-conversation-morning')
    .maybeSingle();

  console.log('Result for natural-conversation-morning:', data);
  
  const { data: data2 } = await supabase
    .from('articles')
    .select('slug')
    .eq('slug', 'natural-conversation')
    .maybeSingle();

  console.log('Result for natural-conversation:', data2);
}

checkSlug();
