import React from 'react';
import { getStatusDashboard } from '@/actions/review';
import { ActivityGraph } from '@/components/shared/activity-graph';
import { Star, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { UserAvatar } from '@/components/shared/user-avatar';
import EditDisplayName from '../_components/edit-display-name';
import EditAvatar from '../_components/edit-avatar';
import ModePerformance from '../../status/_components/mode-performance';
import DailyGoalCard from '../../status/_components/daily-goal-card';
import { createClient } from '@/utils/supabase/server';
import { RankBadge } from '@/components/shared/rank-badge';

export const dynamic = 'force-dynamic'; // Fresh stats on each load

interface PageProps {
  params: Promise<{ userId: string }>;
}

export default async function UserProfilePage({ params }: PageProps) {
  const { userId } = await params;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isOwner = user?.id === userId;

  let dashboard = await getStatusDashboard(userId);

  if (!dashboard || !dashboard.profile?.id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profile) {
      dashboard = {
        profile,
        modePerformance: [],
        streakHistory: [],
        dailyGoal: null
      };
    }
  }

  if (!dashboard || !dashboard.profile) {
    return (
      <div className="w-full max-w-7xl mx-auto py-20 px-6 text-center font-sans">
        <h1 className="text-2xl font-bold text-white mb-4">User Profile Not Found</h1>
        <p className="text-muted-foreground font-semibold mb-8">The user profile you are trying to view does not exist or is private.</p>
        <Link 
          href="/leaderboard" 
          className="px-6 py-3 bg-gradient-to-r from-[#4255ff] to-[#6b7bff] text-white font-bold rounded-xl hover:opacity-90 transition-opacity shadow-lg"
        >
          Back to Leaderboard
        </Link>
      </div>
    );
  }

  const {
    profile,
    modePerformance,
    streakHistory,
    dailyGoal
  } = dashboard;

  const displayName = profile?.full_name || profile?.email?.split('@')[0] || 'Learner';
  const avatarUrl = profile?.avatar_url || (isOwner ? user?.user_metadata?.avatar_url : null);
  const joinedDate = profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Recently';

  return (
    <div className="w-full max-w-7xl mx-auto py-5 sm:py-10 px-4 md:px-8 font-sans space-y-6 sm:space-y-8">
      {/* Hidden SVG definition for icon gradients */}
      <svg width="0" height="0" className="absolute pointer-events-none">
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#b892ff" />
            <stop offset="50%" stopColor="#6d7bff" />
            <stop offset="100%" stopColor="#4255ff" />
          </linearGradient>
        </defs>
      </svg>

      {/* Profile Header Hero Card */}
      <div className="bg-gradient-to-br from-[#0c0d28]/95 via-[#0d0c2b]/90 to-[#130f3a]/90 backdrop-blur-2xl border border-[#b892ff]/30 p-6 sm:p-8 rounded-3xl sm:rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#4255ff]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#b892ff]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5 sm:gap-6 relative z-10">
          <div className="relative shrink-0 group">
            <UserAvatar 
              src={avatarUrl}
              alt="Avatar"
              className="w-20 h-20 sm:w-28 sm:h-28 rounded-full border-[3px] border-[#b892ff] bg-gray-900 shadow-[0_0_25px_rgba(184,146,255,0.4)]"
            />
            {isOwner && (
              <EditAvatar currentUrl={avatarUrl || ''} userId={userId} />
            )}
          </div>
          <div className="space-y-1.5 min-w-0">
            {isOwner ? (
              <EditDisplayName currentName={displayName} />
            ) : (
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                {displayName}
              </h1>
            )}
            <p className="text-xs sm:text-sm text-muted-foreground font-semibold tracking-wide">
              Joined QuizFlash {joinedDate}
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Grid (Mobile & Desktop Responsive Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Rank Tier & Progress */}
        <div className="p-5 bg-[#0a092d]/70 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl shadow-xl flex flex-col justify-between gap-3 hover:border-[#b892ff]/40 transition-colors">
          <p className="text-[10px] sm:text-xs bg-gradient-to-r from-[#b892ff] via-[#6d7bff] to-[#4255ff] text-transparent bg-clip-text uppercase font-black tracking-widest">
            Rank Tier & Progress
          </p>
          <RankBadge 
            rank={profile?.current_rank} 
            points={profile?.points || 0} 
            size="md" 
            showProgress 
          />
        </div>

        {/* Card 2: Total Points */}
        <div className="p-5 bg-[#0a092d]/70 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl shadow-xl flex items-center gap-4 hover:border-amber-400/40 transition-colors group">
          <div className="p-3 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-400 group-hover:scale-110 transition-transform shrink-0">
            <Star className="w-7 h-7 fill-amber-400/20" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs bg-gradient-to-r from-[#b892ff] via-[#6d7bff] to-[#4255ff] text-transparent bg-clip-text uppercase font-black tracking-widest">
              Total Points
            </p>
            <p className="font-mono font-black text-amber-300 text-2xl sm:text-3xl truncate">
              {profile?.points?.toLocaleString() || 0} <span className="text-xs font-normal text-slate-400">LP</span>
            </p>
          </div>
        </div>

        {/* Card 3: Words Learned */}
        <div className="p-5 bg-[#0a092d]/70 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl shadow-xl flex items-center gap-4 hover:border-[#9fa6ff]/40 transition-colors group">
          <div className="p-3 rounded-2xl bg-[#4255ff]/15 border border-[#4255ff]/30 text-[#9fa6ff] group-hover:scale-110 transition-transform shrink-0">
            <BookOpen className="w-7 h-7" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs bg-gradient-to-r from-[#b892ff] via-[#6d7bff] to-[#4255ff] text-transparent bg-clip-text uppercase font-black tracking-widest">
              Words Learned
            </p>
            <p className="font-mono font-black text-white text-2xl sm:text-3xl truncate">
              {profile?.words_learned?.toLocaleString() || 0} <span className="text-xs font-normal text-slate-400">words</span>
            </p>
          </div>
        </div>
      </div>

      {/* Daily Goal Target Section */}
      <DailyGoalCard dailyGoal={dailyGoal} />

      {/* Per-Mode Skill Breakdown */}
      <ModePerformance modePerformance={modePerformance} />

      {/* Heatmap Section */}
      <div className="w-full">
        <ActivityGraph data={streakHistory} />
      </div>
    </div>
  );
}
