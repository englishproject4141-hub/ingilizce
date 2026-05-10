import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials missing in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listArticles() {
  const { data, error } = await supabase
    .from('articles')
    .select('id, slug, title')
    .limit(10);

  if (error) {
    console.error('Error fetching articles:', error);
  } else {
    console.log('Articles in database:');
    console.table(data);
  }
}

listArticles();
