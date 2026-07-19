import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Search, ChevronDown, User as UserIcon, Pencil, Trophy, Star, BookOpen } from 'lucide-react';
import { ActivityGraph, ActivityData } from '@/components/shared/activity-graph';

export default async function UserLibraryPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { id: userId } = await params;

  // ⚡ Song song hóa: 4 queries chạy đồng thời thay vì tuần tự
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 365);

  const [setsResult, profileResult, activitiesResult, userResult] = await Promise.all([
    // 1. Fetch sets with card count
    supabase.from('sets').select('*, cards(count)').eq('user_id', userId).order('created_at', { ascending: false }),
    // 2. Fetch Profile Stats
    supabase.from('profiles').select('id, email, avatar_url, current_rank, points, words_learned').eq('id', userId).single(),
    // 3. Fetch Study Activity
    supabase.from('study_activity').select('study_date, points_earned, words_learned').eq('user_id', userId).gte('study_date', thirtyDaysAgo.toISOString().split('T')[0]).order('study_date', { ascending: true }),
    // 4. Get current logged-in user
    supabase.auth.getUser(),
  ]);

  const sets = setsResult.data;
  const profile = profileResult.data;
  const activities = activitiesResult.data;
  const currentUser = userResult.data?.user;

  if (setsResult.error) {
    console.error("Error fetching sets:", setsResult.error);
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
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#4255ff] bg-gray-600 shrink-0">
            <img 
              src={avatarUrl} 
              alt="Avatar" 
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{displayName}</h1>
            <p className="text-muted-foreground font-semibold">{profile?.email || 'Student'}</p>
          </div>
        </div>
        
        {/* Stats Badges */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-[#4255ff]/30 to-[#9fa6ff]/20 border border-white/10 rounded-xl transition-transform hover:scale-105">
            <Trophy className="w-5 h-5 text-[#9fa6ff]" />
            <div>
              <p className="text-[10px] text-[#9fa6ff] uppercase font-bold tracking-wider">Rank</p>
              <p className="font-bold text-white text-sm">{profile?.current_rank || 'Iron'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-[#b892ff]/30 to-[#9fa6ff]/20 border border-white/10 rounded-xl transition-transform hover:scale-105">
            <Star className="w-5 h-5 text-[#b892ff]" />
            <div>
              <p className="text-[10px] text-[#b892ff] uppercase font-bold tracking-wider">Points</p>
              <p className="font-bold text-white text-sm">{profile?.points || 0}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-indigo-500/30 to-[#4255ff]/20 border border-white/10 rounded-xl transition-transform hover:scale-105">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <div>
              <p className="text-[10px] text-indigo-400 uppercase font-bold tracking-wider">Words</p>
              <p className="font-bold text-white text-sm">{profile?.words_learned || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-10">
        <ActivityGraph data={(activities as ActivityData[]) || []} />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <button className="px-5 py-2.5 bg-transparent border-2 border-[#4255ff] text-foreground font-bold rounded-full text-sm">
          Flashcard sets
        </button>
        <button className="px-5 py-2.5 bg-card text-foreground hover:bg-[#3a466a] transition font-bold rounded-full text-sm">
          Folders
        </button>
        <button className="px-5 py-2.5 bg-card text-foreground hover:bg-[#3a466a] transition font-bold rounded-full text-sm">
          Practice tests
        </button>
        <button className="px-5 py-2.5 bg-card text-foreground hover:bg-[#3a466a] transition font-bold rounded-full text-sm">
          Expert solutions
        </button>
      </div>

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
                      <div className="w-5 h-5 rounded-full overflow-hidden border border-border shrink-0 relative bg-gray-600">
                        <img 
                          src={avatarUrl} 
                          alt="Avatar" 
                          className="w-full h-full object-cover"
                        />
                      </div>
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
    </div>
  );
}
