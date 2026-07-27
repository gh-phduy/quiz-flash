import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Search, ChevronDown, User as UserIcon, Pencil, Trophy, Star, BookOpen, Folder } from 'lucide-react';
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
      const authorIds = [...new Set(savedSetsResultData.map(s => s.user_id))].filter(Boolean);
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
    <div className="w-full max-w-5xl mx-auto py-5 sm:py-10 px-4 sm:px-6 font-sans">
      {/* Profile Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-10 gap-4 p-4 sm:p-8 rounded-3xl bg-gradient-to-r from-card/60 via-card/40 to-transparent border border-white/10 backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-3.5 sm:gap-4">
          <div className="relative shrink-0">
            <UserAvatar 
              src={avatarUrl}
              alt="Avatar"
              fallbackSeed={userId}
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 border-[#b892ff]/40 bg-gray-600 shadow-md"
            />
            <div className="absolute -bottom-1 -right-1 p-1 bg-[#4255ff] rounded-full border border-background">
              <Folder className="w-3 h-3 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-lg sm:text-3xl font-black text-white drop-shadow-md">
              {isOwnLibrary ? 'Your Library' : `${displayName}'s Library`}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-0.5">
              Manage and practice your custom study sets
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end pt-3 sm:pt-0 border-t sm:border-none border-white/5">
          <div className="px-3.5 py-1.5 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold text-[#9fa6ff]">
            {sets.length + savedSetsData.length} Total Sets
          </div>
        </div>
      </div>

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
