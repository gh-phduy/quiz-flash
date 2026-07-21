import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import SpeakingGame from './speaking-game';

export default async function SpeakingPage({ params }: { params: Promise<{ setId: string }> }) {
  const supabase = await createClient();
  const { setId } = await params;
  
  const [setResult, cardsResult] = await Promise.all([
    supabase.from('sets').select('id, title, description').eq('id', setId).single(),
    supabase.from('cards').select('id, term, definition, image_url, phonetic, audio_url').eq('set_id', setId).order('order_index', { ascending: true }),
  ]);

  if (setResult.error || !setResult.data) {
    notFound();
  }

  if (cardsResult.error || !cardsResult.data || cardsResult.data.length === 0) {
    notFound();
  }

  return <SpeakingGame set={setResult.data} cards={cardsResult.data} />;
}
