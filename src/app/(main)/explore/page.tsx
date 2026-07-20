import { createClient } from '@/utils/supabase/server';
import ExploreGrid from './explore-grid';

export const revalidate = 60; // Cache for 60 seconds

export default async function ExplorePage() {
  const supabase = await createClient();

  // ⚡ Song song hóa: Fetch user + public sets cùng lúc
  const [userResult, setsResult] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('sets').select('*, cards(count)').eq('is_public', true).order('created_at', { ascending: false }),
  ]);

  const user = userResult.data?.user;

  let savedSetIds: string[] = [];
  if (user) {
    const { data: savedSets } = await supabase
      .from('user_saved_sets')
      .select('set_id')
      .eq('user_id', user.id);
    if (savedSets) {
      savedSetIds = savedSets.map(s => s.set_id);
    }
  }

  // Đồng bộ avatar từ Google Auth vào Profile (chỉ khi cần, không chặn render)
  if (user && user.user_metadata?.avatar_url) {
    // Chạy fire-and-forget, không chờ kết quả
    supabase
      .from('profiles')
      .update({ avatar_url: user.user_metadata.avatar_url })
      .eq('id', user.id)
      .is('avatar_url', null)
      .then(() => {}); // fire-and-forget
  }

  let sets = setsResult.data || [];

  // Fetch author profiles nếu có sets
  if (sets.length > 0) {
    const userIds = [...new Set(sets.map((s: any) => s.user_id))];
    
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, avatar_url, full_name')
      .in('id', userIds);

    if (profiles) {
      sets = sets.map((set: any) => ({
        ...set,
        author: profiles.find((p: any) => p.id === set.user_id) || null
      }));
    }
  }

  return (
    <main className="min-h-[calc(100vh-64px)] bg-background">
      <ExploreGrid sets={sets} initialSavedSetIds={savedSetIds} />
    </main>
  );
}
