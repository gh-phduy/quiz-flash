import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ogbwpzclxbidlnygckfz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nYndwemNseGJpZGxueWdja2Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0NDY3NzYsImV4cCI6MjEwMDAyMjc3Nn0.5zHmtaMEbk-DmVspfnE9SlLma09pBz4gJrmfhJRDSnI'
);

async function check() {
  // Try to find the user
  const { data: reviews, error } = await supabase
    .from('card_reviews')
    .select('id, next_review_date, repetitions, easiness_factor, interval_days, correct_count')
    .limit(10);
    
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Reviews:', reviews);
  }
}

check();
