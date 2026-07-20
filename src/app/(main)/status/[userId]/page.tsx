import React from 'react';
import { getStatusDashboard, getUpcomingReviews } from '@/actions/review';
import { ActivityGraph } from '@/components/shared/activity-graph';
import HardestWords from '../_components/hardest-words';
import ChartsContainer from '../_components/charts-container';
import { Trophy, Star, BookOpen, Clock, Target } from 'lucide-react';
import Link from 'next/link';
import { UserAvatar } from '@/components/shared/user-avatar';
import EditDisplayName from '../_components/edit-display-name';
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
  const upcomingReviews = await getUpcomingReviews(userId);

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
    masteryBreakdown,
    weaknessBreakdown,
    accuracyRate,
    totalReviewedCards,
    dueCount,
    streakHistory,
    hardestCards
  } = dashboard;

  const cardsCount = masteryBreakdown.new + masteryBreakdown.learning + masteryBreakdown.reviewing + masteryBreakdown.mastered;
  
  const displayName = profile?.full_name || profile?.email?.split('@')[0] || 'Student';
  const avatarUrl = profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.id || 'default'}`;
  const joinedDate = profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Recently';

  return (
    <div className="w-full max-w-7xl mx-auto py-10 px-4 md:px-8 font-sans space-y-10">
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
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-4 border-b border-white/5">
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

      {/* Heatmap Section */}
      <div className="w-full">
        <ActivityGraph data={streakHistory} />
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Due Today */}
        <div className="p-6 bg-gradient-to-br from-[#0a092d]/50 to-[#b892ff]/10 border border-white/10 rounded-3xl flex flex-col justify-between transition-all duration-300 hover:border-white/20 hover:shadow-[0_0_30px_rgba(184,146,255,0.15)] relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-[#b892ff]/20 rounded-full blur-2xl group-hover:bg-[#b892ff]/30 transition-all" />
          <div className="flex items-center justify-between text-muted-foreground relative z-10">
            <span className="text-xs font-bold uppercase tracking-widest text-white/60">Due Today</span>
            <Clock className="w-5 h-5 text-[#b892ff]" />
          </div>
          <div className="mt-6 relative z-10">
            <span className="text-5xl font-extrabold font-mono text-[#b892ff] block tracking-tighter">
              {dueCount}
            </span>
            <span className="text-[11px] text-white/50 font-bold mt-2 uppercase tracking-wider block">
              Cards require immediate review
            </span>
          </div>
        </div>

        {/* Accuracy */}
        <div className="p-6 bg-gradient-to-br from-[#0a092d]/50 to-[#9fa6ff]/10 border border-white/10 rounded-3xl flex flex-col justify-between transition-all duration-300 hover:border-white/20 hover:shadow-[0_0_30px_rgba(159,166,255,0.15)] relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-[#9fa6ff]/20 rounded-full blur-2xl group-hover:bg-[#9fa6ff]/30 transition-all" />
          <div className="flex items-center justify-between text-muted-foreground relative z-10">
            <span className="text-xs font-bold uppercase tracking-widest text-white/60">Accuracy</span>
            <Target className="w-5 h-5 text-[#9fa6ff]" />
          </div>
          <div className="mt-6 relative z-10">
            <span className="text-5xl font-extrabold font-mono text-[#9fa6ff] block tracking-tighter">
              {accuracyRate}%
            </span>
            <span className="text-[11px] text-white/50 font-bold mt-2 uppercase tracking-wider block">
              Based on {totalReviewedCards} reviews
            </span>
          </div>
        </div>

        {/* Words Learned */}
        <div className="p-6 bg-gradient-to-br from-[#0a092d]/50 to-[#4255ff]/10 border border-white/10 rounded-3xl flex flex-col justify-between transition-all duration-300 hover:border-white/20 hover:shadow-[0_0_30px_rgba(66,85,255,0.15)] relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-[#4255ff]/20 rounded-full blur-2xl group-hover:bg-[#4255ff]/30 transition-all" />
          <div className="flex items-center justify-between text-muted-foreground relative z-10">
            <span className="text-xs font-bold uppercase tracking-widest text-white/60">Library Size</span>
            <BookOpen className="w-5 h-5 text-[#4255ff]" />
          </div>
          <div className="mt-6 relative z-10">
            <span className="text-5xl font-extrabold font-mono text-[#4255ff] block tracking-tighter">
              {cardsCount}
            </span>
            <span className="text-[11px] text-white/50 font-bold mt-2 uppercase tracking-wider block">
              Total vocabulary cards
            </span>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <ChartsContainer 
        weaknessBreakdown={weaknessBreakdown}
        masteryBreakdown={masteryBreakdown}
        upcomingReviews={upcomingReviews}
      />

      {/* Hardest Words List */}
      <div className="w-full">
        <HardestWords cards={hardestCards} />
      </div>
    </div>
  );
}
