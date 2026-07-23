import { createClient } from '@/utils/supabase/server';
import HomeDashboard from './home-dashboard';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile = null;
  let sets: any[] = [];
  let savedSets: any[] = [];
  let savedSetIds: string[] = [];
  
  let suggestedPublicSets: any[] = [];
  let dueCount = 0;
  
  if (user) {
    const todayStr = new Date().toISOString().split('T')[0];

    const [
      { data: profileData },
      { data: setsData },
      { data: userSavedSets },
      { count: dueReviewsCount }
    ] = await Promise.all([
      // 1. Fetch user profile
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single(),
      
      // 2. Fetch created sets
      supabase
        .from('sets')
        .select('*, cards(count)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
        
      // 3. Fetch saved sets
      supabase
        .from('user_saved_sets')
        .select('set_id, sets(*, cards(count))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
        
      // 4. Fetch due reviews count
      supabase
        .from('card_reviews')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .lte('next_review_date', todayStr)
    ]);

    profile = profileData;
    if (setsData) sets = setsData;
    
    if (userSavedSets && Array.isArray(userSavedSets)) {
      savedSetIds = userSavedSets.map((s: any) => s.set_id);
      
      const rawSavedSets = userSavedSets.map((s: any) => {
        const setObj = Array.isArray(s.sets) ? s.sets[0] : s.sets;
        return setObj;
      }).filter(Boolean);

      if (rawSavedSets.length > 0) {
        const savedUserIds = [...new Set(rawSavedSets.map((s: any) => s.user_id))];
        const { data: savedProfiles } = await supabase
          .from('profiles')
          .select('id, email, avatar_url, full_name')
          .in('id', savedUserIds);

        savedSets = rawSavedSets.map((setObj: any) => ({
          ...setObj,
          author: savedProfiles?.find((p: any) => p.id === setObj.user_id) || null
        }));
      }
    }
    
    dueCount = dueReviewsCount || 0;

    // Fetch suggested public sets (if user has very few sets)
    if (sets.length + savedSets.length < 3) {
      const { data: pubSets } = await supabase
        .from('sets')
        .select('*, cards(count)')
        .eq('is_public', true)
        .neq('user_id', user.id)
        .limit(20);
        
      if (pubSets && pubSets.length > 0) {
        const sortedPubSets = pubSets
          .sort((a: any, b: any) => (b.cards?.[0]?.count || 0) - (a.cards?.[0]?.count || 0))
          .slice(0, 3);
          
        const userIds = [...new Set(sortedPubSets.map((s: any) => s.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email, avatar_url, full_name')
          .in('id', userIds);
          
        suggestedPublicSets = sortedPubSets.map((set: any) => ({
          ...set,
          author: profiles?.find((p: any) => p.id === set.user_id) || null
        }));
      }
    }
  }

  return (
    <HomeDashboard
      user={user}
      profile={profile}
      sets={sets}
      savedSets={savedSets}
      initialSavedSetIds={savedSetIds}
      suggestedPublicSets={suggestedPublicSets}
      dueCount={dueCount}
    />
  );
}
