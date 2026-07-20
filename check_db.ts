import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('C:/Users/Admin/Projects/quiz-flash', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  const { data, error } = await supabase
    .from('sets')
    .select('*, cards(count), author:profiles!sets_user_id_fkey(id, email, avatar_url, full_name)')
    .eq('is_public', true)
    .limit(4);
    
  console.log('Data:', data?.length);
  if (error) console.error('Error:', error);
}

main();
