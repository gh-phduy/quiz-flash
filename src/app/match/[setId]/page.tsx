import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import MatchGame from './match-game';

export default async function MatchPage({ params }: { params: Promise<{ setId: string }> }) {
  const supabase = await createClient();
  const { setId } = await params;

  const { data: set, error: setError } = await supabase
    .from('sets')
    .select('*')
    .eq('id', setId)
    .single();

  if (setError || !set) {
    notFound();
  }

  const { data: cards, error: cardsError } = await supabase
    .from('cards')
    .select('*')
    .eq('set_id', setId)
    .order('order_index', { ascending: true });

  if (cardsError || !cards || cards.length === 0) {
    notFound();
  }

  return <MatchGame set={set} cards={cards} />;
}
