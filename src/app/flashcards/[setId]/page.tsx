import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import FlashcardPlayer from './flashcard-player';

export default async function FlashcardPage({ params }: { params: Promise<{ setId: string }> }) {
  const supabase = await createClient();
  const { setId } = await params;

  // ⚡ Song song hóa: Fetch set + cards cùng lúc thay vì chờ nhau
  const [setResult, cardsResult] = await Promise.all([
    supabase.from('sets').select('*').eq('id', setId).single(),
    supabase.from('cards').select('*').eq('set_id', setId).order('order_index', { ascending: true }),
  ]);

  if (setResult.error || !setResult.data) {
    notFound();
  }

  if (cardsResult.error || !cardsResult.data || cardsResult.data.length === 0) {
    notFound();
  }

  return <FlashcardPlayer set={setResult.data} cards={cardsResult.data} />;
}
