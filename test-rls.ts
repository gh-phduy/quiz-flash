import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function test() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  const { data: sets } = await supabase.from('sets').select('id, title').ilike('title', '%A1%');
  
  if (sets && sets.length > 0) {
    const setId = sets[0].id;
    console.log('Querying reviews for set:', setId);
    
    // Instead of IN clause, let's query card_reviews where card_id.set_id == setId
    const { data: reviews, error } = await supabase
      .from('card_reviews')
      .select('*, cards!inner(set_id)')
      .eq('cards.set_id', setId);
      
    if (error) {
      console.error('ERROR:', error);
    } else {
      console.log('Success! Reviews found:', reviews?.length);
      console.log('Sample:', reviews?.slice(0, 2));
    }
  }
}
test();
