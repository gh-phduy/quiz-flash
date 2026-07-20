import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Search, ChevronDown, User as UserIcon, Pencil, Trophy, Star, BookOpen } from 'lucide-react';
import { ActivityGraph, ActivityData } from '@/components/shared/activity-graph';
import { UserAvatar } from '@/components/shared/user-avatar';

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




      {/* Filters */}
      <div className="flex items-center justify-between gap-4 mb-10">
        <button className="flex items-center gap-2 px-4 py-2 bg-card text-foreground hover:bg-[#3a466a] transition font-bold rounded-lg text-sm">
          Created
          <ChevronDown className="w-4 h-4" />
        </button>

        <div className="flex-1 max-w-md relative">
          <input 
            type="text" 
            placeholder="Search flashcards" 
            className="w-full bg-card text-foreground placeholder-gray-400 font-semibold px-4 py-2.5 pr-10 rounded-lg outline-none focus:ring-2 focus:ring-[#4255ff] transition border border-transparent"
          />
          <Search className="w-5 h-5 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Set List */}
      <div>
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">CREATED</h2>
        <div className="flex flex-col gap-3">
          {sets && sets.length > 0 ? (
            sets.map((set: any) => (
              <div 
                key={set.id}
                className="group flex items-center justify-between px-6 py-4 bg-card hover:bg-[#3a466a] transition-colors rounded-lg border-b-2 border-transparent hover:border-[#b892ff]"
              >
                <Link href={`/flashcards/${set.id}`} className="flex-1 flex flex-col justify-center">
                  <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground mb-1.5">
                    <span>{set.cards[0]?.count || 0} Terms</span>
                    <div className="w-px h-3 bg-border"></div>
                    <div className="flex items-center gap-1.5 text-foreground">
                      <UserAvatar 
                        src={avatarUrl}
                        alt="Avatar"
                        fallbackSeed={userId}
                        className="w-5 h-5 rounded-full border border-border shrink-0 bg-gray-600"
                      />
                      <span className="font-semibold">{displayName}</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-foreground group-hover:text-foreground">{set.title}</h3>
                </Link>
                
                <Link 
                  href={`/edit-set/${set.id}`} 
                  className="ml-4 p-2 text-muted-foreground hover:text-foreground hover:bg-[#4255ff]/20 rounded-full transition-all"
                  title="Edit this set"
                >
                  <Pencil className="w-5 h-5" />
                </Link>
              </div>
            ))
          ) : (
            <div className="text-muted-foreground font-semibold py-8 text-center bg-card/50 rounded-lg">
              You don't have any flashcard sets yet.
            </div>
          )}
        </div>
      </div>

      {/* Saved Sets List */}
      <div className="mt-12">
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">SAVED</h2>
        <div className="flex flex-col gap-3">
          {savedSetsData && savedSetsData.length > 0 ? (
            savedSetsData.map((set: any) => {
              const authorAvatar = set.author?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${set.user_id}`;
              const authorName = set.author?.full_name || (set.author?.email ? set.author.email.split('@')[0] : 'Anonymous');
              
              return (
              <div 
                key={set.id}
                className="group flex items-center justify-between px-6 py-4 bg-card hover:bg-[#3a466a] transition-colors rounded-lg border-b-2 border-transparent hover:border-[#b892ff]"
              >
                <Link href={`/flashcards/${set.id}`} className="flex-1 flex flex-col justify-center">
                  <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground mb-1.5">
                    <span>{set.cards?.[0]?.count || 0} Terms</span>
                    <div className="w-px h-3 bg-border"></div>
                    <div className="flex items-center gap-1.5 text-foreground">
                      <UserAvatar 
                        src={authorAvatar}
                        alt="Avatar"
                        fallbackSeed={set.user_id}
                        className="w-5 h-5 rounded-full border border-border shrink-0 bg-gray-600"
                      />
                      <span className="font-semibold">{authorName}</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-foreground group-hover:text-foreground">{set.title}</h3>
                </Link>
                
                <Link 
                  href={`/edit-set/${set.id}`} 
                  className="ml-4 p-2 text-muted-foreground hover:text-foreground hover:bg-[#4255ff]/20 rounded-full transition-all"
                  title="View/Edit this set"
                >
                  <Pencil className="w-5 h-5" />
                </Link>
              </div>
            )})
          ) : (
            <div className="text-muted-foreground font-semibold py-8 text-center bg-card/50 rounded-lg">
              You haven't saved any public sets yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
