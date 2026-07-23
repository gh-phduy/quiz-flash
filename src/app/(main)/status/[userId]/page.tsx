import React from 'react';
import { getStatusDashboard } from '@/actions/review';
import { ActivityGraph } from '@/components/shared/activity-graph';
import { Trophy, Star, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { UserAvatar } from '@/components/shared/user-avatar';
import EditDisplayName from '../_components/edit-display-name';
import ModePerformance from '../_components/mode-performance';
import DailyGoalCard from '../_components/daily-goal-card';
import { createClient } from '@/utils/supabase/server';

export const revalidate = 0; // Fresh stats on each load

interface PageProps {
  params: Promise<{ userId: string }>;
}

export default async function UserStatusPage({ params }: PageProps) {
  const { userId } = await params;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isOwner = user?.id === userId;

  const dashboard = await getStatusDashboard(userId);

  if (!dashboard) {
    return (
      <div className="w-full max-w-7xl mx-auto py-20 px-6 text-center font-sans">
        <h1 className="text-2xl font-bold text-white mb-4">User Not Found</h1>
        <p className="text-muted-foreground font-semibold mb-8">The user status dashboard you are trying to view does not exist or is private.</p>
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

  const displayName = profile?.full_name || profile?.email?.split('@')[0] || 'Student';
  const avatarUrl = profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.id || 'default'}`;
  const joinedDate = profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Recently';

  return (
    <div className="w-full max-w-7xl mx-auto py-10 px-4 md:px-8 font-sans space-y-8">
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

      {/* Header section with User Profile */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-white/10">
        <div className="flex items-center gap-5">
          <UserAvatar 
            src={avatarUrl}
            alt="Avatar"
            fallbackSeed={profile?.id || 'default'}
            className="w-24 h-24 rounded-full border-[3px] border-[#4255ff] bg-gray-900 shrink-0 shadow-[0_0_20px_rgba(66,85,255,0.3)]"
          />
          <div>
            {isOwner ? (
              <EditDisplayName currentName={displayName} />
            ) : (
              <h1 className="text-4xl font-extrabold text-white tracking-tight flex items-center gap-2">
                {displayName}
              </h1>
            )}
            <p className="text-sm text-muted-foreground font-semibold mt-1 tracking-wide">Joined {joinedDate}</p>
          </div>
        </div>
        
        {/* Stats Badges */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3 px-5 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl transition-all hover:bg-white/10 hover:scale-105 group hover:border-[#b892ff]/40">
            <Trophy className="w-6 h-6 group-hover:scale-110 transition-transform" style={{ stroke: 'url(#logoGradient)' }} />
            <div>
              <p className="text-[10px] bg-gradient-to-r from-[#b892ff] via-[#6d7bff] to-[#4255ff] text-transparent bg-clip-text uppercase font-extrabold tracking-widest">Rank</p>
              <p className="font-bold text-white text-base">{profile?.current_rank || 'Iron'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 px-5 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl transition-all hover:bg-white/10 hover:scale-105 group hover:border-[#b892ff]/40">
            <Star className="w-6 h-6 group-hover:scale-110 transition-transform" style={{ stroke: 'url(#logoGradient)' }} />
            <div>
              <p className="text-[10px] bg-gradient-to-r from-[#b892ff] via-[#6d7bff] to-[#4255ff] text-transparent bg-clip-text uppercase font-extrabold tracking-widest">Points</p>
              <p className="font-bold text-white text-base">{profile?.points || 0}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 px-5 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl transition-all hover:bg-white/10 hover:scale-105 group hover:border-[#b892ff]/40">
            <BookOpen className="w-6 h-6 group-hover:scale-110 transition-transform" style={{ stroke: 'url(#logoGradient)' }} />
            <div>
              <p className="text-[10px] bg-gradient-to-r from-[#b892ff] via-[#6d7bff] to-[#4255ff] text-transparent bg-clip-text uppercase font-extrabold tracking-widest">Words</p>
              <p className="font-bold text-white text-base">{profile?.words_learned || 0}</p>
            </div>
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
