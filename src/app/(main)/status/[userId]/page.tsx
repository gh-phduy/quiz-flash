import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ userId: string }>;
}

export default async function UserStatusPage({ params }: PageProps) {
  const { userId } = await params;
  redirect(`/profile/${userId}`);
}
