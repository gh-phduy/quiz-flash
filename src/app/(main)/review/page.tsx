import { getDueCardsToReview } from '@/actions/review';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import ReviewGame from './review-game';
import Link from 'next/link';

export const revalidate = 0; // Fresh fetch every time

export default async function ReviewPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const dueCards = await getDueCardsToReview();

  if (!dueCards || dueCards.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto py-20 px-6 font-sans text-center">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#9fa6ff] to-[#b892ff] mb-6">
          You're all caught up! 🎉
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          You have no cards due for review today. Great job keeping up with your studies!
        </p>
        <Link
          href="/"
          className="inline-block px-8 py-4 bg-gradient-to-r from-[#4255ff] to-[#6d7bff] text-white rounded-2xl font-bold hover:scale-105 hover:shadow-[0_0_30px_rgba(66,85,255,0.5)] transition-all shadow-lg"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-10 px-4 md:px-8 font-sans">
      <ReviewGame cards={dueCards} />
    </div>
  );
}
