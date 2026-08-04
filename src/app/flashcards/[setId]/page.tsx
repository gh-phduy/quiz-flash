import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import FlashcardPlayer from './flashcard-player';

export async function generateMetadata({ params }: { params: Promise<{ setId: string }> }): Promise<Metadata> {
  const supabase = await createClient();
  const { setId } = await params;
  
  const { data: set } = await supabase
    .from('sets')
    .select('title, description')
    .eq('id', setId)
    .single();

  if (!set) {
    return {
      title: 'Set Not Found | QuizFlash',
    };
  }

  const title = `${set.title} - Flashcards | QuizFlash`;
  const description = set.description || `Learn and study ${set.title} flashcards effectively on QuizFlash.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    }
  };
}

export default async function FlashcardPage({ params }: { params: Promise<{ setId: string }> }) {
  const supabase = await createClient();
  const { setId } = await params;

  // ⚡ Song song hóa: Fetch set + cards cùng lúc thay vì chờ nhau
  const [setResult, cardsResult] = await Promise.all([
    supabase.from('sets').select('id, title, description, created_at, updated_at').eq('id', setId).single(),
    supabase.from('cards').select('id, term, definition, image_url, phonetic, phonetic_uk, part_of_speech, cefr_level, audio_url').eq('set_id', setId).order('order_index', { ascending: true }).limit(200),
  ]);

  if (setResult.error || !setResult.data) {
    notFound();
  }

  if (cardsResult.error || !cardsResult.data || cardsResult.data.length === 0) {
    notFound();
  }

  // Schema.org JSON-LD for Education/LearningResource
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: setResult.data.title,
    description: setResult.data.description || `Interactive flashcard set for ${setResult.data.title}`,
    learningResourceType: 'Flashcard Set',
    url: `https://quizflash.click/flashcards/${setId}`,
    dateCreated: setResult.data.created_at,
    dateModified: setResult.data.updated_at,
    teaches: setResult.data.title,
    educationalUse: 'Review',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FlashcardPlayer set={setResult.data} cards={cardsResult.data} />
    </>
  );
}
