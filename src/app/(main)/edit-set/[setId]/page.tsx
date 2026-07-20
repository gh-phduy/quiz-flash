import { createClient } from '@/utils/supabase/server';
import { checkCollaboratorStatus } from '@/actions/collaboration';
import { notFound } from 'next/navigation';
import EditSetForm from './edit-form';

export default async function EditSetPage({ params }: { params: Promise<{ setId: string }> }) {
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

  const collabStatus = await checkCollaboratorStatus(setId);

  const { data: fetchedCards, error: cardsError } = await supabase
    .from('cards')
    .select('*')
    .eq('set_id', setId)
    .order('order_index', { ascending: true });

  let cards = [];
  if (fetchedCards && fetchedCards.length > 0) {
    cards = fetchedCards.map(c => ({
      id: c.id,
      term: c.term,
      definition: c.definition,
      image_url: c.image_url,
      image_file: null,
      phonetic: c.phonetic,
      audio_url: c.audio_url
    }));
  } else {
    cards = [
      { id: 'card-1', term: '', definition: '', image_url: null, image_file: null, phonetic: null, audio_url: null },
      { id: 'card-2', term: '', definition: '', image_url: null, image_file: null, phonetic: null, audio_url: null },
    ];
  }

  return (
    <EditSetForm 
      initialSet={set} 
      initialCards={cards} 
      initialCollabStatus={collabStatus} 
    />
  );
}
