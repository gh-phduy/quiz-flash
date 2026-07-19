import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import LearnPlayer from './learn-player';

export default async function LearnPage({ params }: { params: Promise<{ setId: string }> }) {
  const supabase = await createClient();
  const { setId } = await params;

  // Fetch Set
  const { data: set, error: setError } = await supabase
    .from('sets')
    .select('*')
    .eq('id', setId)
    .single();

  if (setError || !set) {
    notFound();
  }

  // Fetch Cards
  const { data: cards, error: cardsError } = await supabase
    .from('cards')
    .select('*')
    .eq('set_id', setId)
    .order('order_index', { ascending: true });

  if (cardsError || !cards || cards.length === 0) {
    notFound();
  }

  return <LearnPlayer set={set} cards={cards} />;
}
