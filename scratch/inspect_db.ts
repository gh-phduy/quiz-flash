import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('c:/Users/Admin/Projects/quiz-flash', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  const userIds = ['c8accee3-8467-438b-a8c8-f68dc0dcb6e6', null];
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, avatar_url, full_name')
    .in('id', userIds);

  console.log('Profiles with null in array:', profiles);
  console.log('Error:', error);
}

main();
