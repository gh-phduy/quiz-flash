import { createClient } from '@/utils/supabase/server';
import ExploreGrid from './explore-grid';

export const revalidate = 60; // Cache for 60 seconds

export default async function ExplorePage() {
  const supabase = await createClient();

  // Tự động đồng bộ ảnh đại diện từ Google Auth vào Profile nếu đang thiếu
  const { data: { user } } = await supabase.auth.getUser();
  if (user && user.user_metadata?.avatar_url) {
    await supabase
      .from('profiles')
      .update({ avatar_url: user.user_metadata.avatar_url })
      .eq('id', user.id)
      .is('avatar_url', null);
  }

  // 1. Fetch public sets and count their cards
  const { data: setsData, error: setsError } = await supabase
    .from('sets')
    .select('*, cards(count)')
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  let sets = setsData || [];

  // 2. Fetch author profiles to display email/avatar
  if (sets.length > 0) {
    const userIds = [...new Set(sets.map((s: any) => s.user_id))];
    
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, avatar_url')
      .in('id', userIds);

    if (profiles) {
      // 3. Merge profile data into sets
      sets = sets.map((set: any) => ({
        ...set,
        author: profiles.find((p: any) => p.id === set.user_id) || null
      }));
    }
  }

  return (
    <main className="min-h-[calc(100vh-64px)] bg-background">
      <ExploreGrid sets={sets} />
    </main>
  );
}
