import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Search, ChevronDown, User as UserIcon, Pencil, Trophy, Star, BookOpen } from 'lucide-react';
import { ActivityGraph, ActivityData } from '@/components/shared/activity-graph';
import { UserAvatar } from '@/components/shared/user-avatar';
import { LibraryView } from './library-view';

export default async function UserLibraryPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { id: userId } = await params;

  // ⚡ Song song hóa: 4 queries chạy đồng thời thay vì tuần tự
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 365);

  const [setsResult, profileResult, activitiesResult, userResult, savedSetIdsResult] = await Promise.all([
    // 1. Fetch sets with card count
    supabase.from('sets').select('*, cards(count)').eq('user_id', userId).order('created_at', { ascending: false }),
    // 2. Fetch Profile Stats
    supabase.from('profiles').select('id, email, avatar_url, current_rank, points, words_learned').eq('id', userId).single(),
    // 3. Fetch Study Activity
    supabase.from('study_activity').select('study_date, points_earned, words_learned').eq('user_id', userId).gte('study_date', thirtyDaysAgo.toISOString().split('T')[0]).order('study_date', { ascending: true }),
    // 4. Get current logged-in user
    supabase.auth.getUser(),
    // 5. Fetch saved sets IDs
    supabase.from('user_saved_sets').select('set_id').eq('user_id', userId),
  ]);

  const sets = setsResult.data || [];
  const profile = profileResult.data;
  const activities = activitiesResult.data;
  const currentUser = userResult.data?.user;

  let savedSetsData: any[] = [];
  const savedSetIds = savedSetIdsResult.data?.map(s => s.set_id) || [];
  
  if (savedSetIds.length > 0) {
    const { data: savedSetsResultData } = await supabase
      .from('sets')
      .select('*, cards(count)')
      .in('id', savedSetIds)
      .order('created_at', { ascending: false });
      
    if (savedSetsResultData && savedSetsResultData.length > 0) {
      // Fetch authors for saved sets
      const authorIds = [...new Set(savedSetsResultData.map(s => s.user_id))];
      const { data: authors } = await supabase
        .from('profiles')
        .select('id, email, avatar_url, full_name')
        .in('id', authorIds);
        
      savedSetsData = savedSetsResultData.map(s => ({
        ...s,
        author: authors?.find(a => a.id === s.user_id) || null
      }));
    }
  }

  const isOwnLibrary = currentUser?.id === userId;
  
  const avatarUrl = isOwnLibrary && currentUser?.user_metadata?.avatar_url 
    ? currentUser.user_metadata.avatar_url 
    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`;
    
  const displayName = isOwnLibrary && (currentUser?.user_metadata?.full_name || currentUser?.user_metadata?.name || currentUser?.user_metadata?.custom_username)
    ? (currentUser.user_metadata.full_name || currentUser.user_metadata.name || currentUser.user_metadata.custom_username)
    : userId.substring(0, 8);

  return (
    <div className="w-full max-w-5xl mx-auto py-10 px-6 font-sans">



      <LibraryView 
        sets={sets} 
        savedSetsData={savedSetsData} 
        userId={userId} 
        avatarUrl={avatarUrl || ''} 
        displayName={displayName || ''} 
      />
    </div>
  );
}
