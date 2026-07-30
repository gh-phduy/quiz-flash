import { getDueCardsToReview } from '@/actions/review';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import ReviewGame from './review-game';
import Link from 'next/link';

export const dynamic = 'force-dynamic'; // Prevent static caching

export default async function ReviewPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const dueCards = await getDueCardsToReview();
  
  // Limit to 50 cards per session to prevent Edge Worker CPU limits (Error 1102)
  // when Next.js serializes massive arrays into the RSC payload.
  const limitedCards = (dueCards || []).slice(0, 50);
  
  // Always render ReviewGame. We let the Client Component handle the empty state.
  // This prevents the Server Action re-renders from blowing away the UI state when dueCards becomes empty.
  return (
    <div className="w-full max-w-4xl mx-auto py-10 px-4 md:px-8 font-sans">
      <ReviewGame cards={limitedCards} />
    </div>
  );
}
