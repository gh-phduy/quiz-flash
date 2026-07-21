import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ setId: string }>;
}

export default async function LearnRedirectPage({ params }: PageProps) {
  const { setId } = await params;
  redirect(`/flashcards/${setId}`);
}
