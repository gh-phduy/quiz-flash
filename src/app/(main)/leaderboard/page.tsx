import { createClient } from '@/utils/supabase/server';
import { Trophy, Medal, Star, BookOpen, Crown, Sparkles, UserCheck } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { RankBadge } from '@/components/shared/rank-badge';

export const revalidate = 60; // Revalidate every 60 seconds

export default async function LeaderboardPage() {
  const supabase = await createClient();

  // ⚡ Fetch leaderboard + current user concurrently
  const [playersResult, userResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, email, avatar_url, current_rank, points, words_learned, full_name')
      .order('points', { ascending: false })
      .limit(50),
    supabase.auth.getUser(),
  ]);

  const players = playersResult.data || [];
  const user = userResult.data?.user;

  if (playersResult.error) {
    console.error('Error fetching leaderboard:', playersResult.error);
  }

  const top1 = players[0];
  const top2 = players[1];
  const top3 = players[2];
  const remainingPlayers = players.slice(3);

  // Find user rank
  const currentUserIndex = players.findIndex(p => p.id === user?.id);
  const currentUserPlayer = currentUserIndex !== -1 ? players[currentUserIndex] : null;
  const currentUserRank = currentUserIndex !== -1 ? currentUserIndex + 1 : null;

  return (
    <div className="w-full max-w-5xl mx-auto py-5 sm:py-10 px-4 sm:px-6 font-sans relative pb-24 sm:pb-12 overflow-x-clip">
      {/* Background neon glows */}
      <div className="absolute top-0 left-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-[#4255ff]/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-[#b892ff]/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Hero Title Header */}
      <div className="flex flex-col items-center mb-8 sm:mb-12 text-center relative z-10">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-card rounded-3xl flex items-center justify-center mb-4 sm:mb-6 shadow-[0_0_40px_rgba(184,146,255,0.25)] border border-[#b892ff]/30 ring-4 ring-[#4255ff]/10 group transition-all duration-300 hover:scale-105">
          <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-[#b892ff] group-hover:scale-110 transition-transform" />
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold bg-gradient-to-r from-[#b892ff] via-[#ff92d0] to-[#4255ff] text-transparent bg-clip-text tracking-tight drop-shadow-md">
          Global Leaderboard
        </h1>
        <p className="text-muted-foreground text-xs sm:text-base font-medium mt-2 max-w-md tracking-wide px-2">
          Top 50 dedicated learners competing for glory and Challenger status!
        </p>
      </div>

      {/* Top 3 Stage Podium Showcase */}
      {players.length >= 3 && (
        <div className="mb-8 sm:mb-12 relative z-10">
          <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end max-w-2xl mx-auto pt-6">
            
            {/* Rank #2 - Silver */}
            {top2 && (
              <Link 
                href={`/profile/${top2.id}`}
                className="flex flex-col items-center p-2.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-[#0a092d]/70 backdrop-blur-xl border border-slate-300/30 hover:border-slate-300/60 shadow-xl transition-all active:scale-95 group text-center relative min-w-0"
              >
                <div className="relative mb-2 sm:mb-3">
                  <div className="relative w-12 h-12 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 sm:border-3 border-slate-300 shadow-[0_0_15px_rgba(203,213,225,0.4)] group-hover:scale-105 transition-transform">
                    <Image 
                      src={top2.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${top2.id}`} 
                      alt={top2.full_name || 'Player'} 
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 48px, 80px"
                    />
                  </div>
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-slate-300 text-slate-950 font-black text-[10px] sm:text-xs shadow-md border border-white">
                    #2
                  </div>
                </div>
                <span className="font-bold text-white text-xs sm:text-base truncate w-full group-hover:text-slate-200 transition-colors">
                  {top2.full_name || top2.email?.split('@')[0] || 'Runner Up'}
                </span>
                <div className="flex items-center gap-1 mt-1 text-[11px] sm:text-xs font-extrabold text-amber-300 mb-2">
                  <Star className="w-3 h-3 fill-amber-300 shrink-0" />
                  <span className="truncate">{top2.points?.toLocaleString()}</span>
                </div>
                <div className="shrink-0 max-w-full overflow-hidden">
                  <RankBadge rank={top2.current_rank} points={top2.points} size="xs" />
                </div>
              </Link>
            )}

            {/* Rank #1 - Gold (Center Champion) */}
            {top1 && (
              <Link 
                href={`/profile/${top1.id}`}
                className="flex flex-col items-center p-3 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#4255ff]/20 via-[#0a092d]/90 to-[#0a092d]/90 backdrop-blur-xl border-2 border-yellow-400/50 hover:border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.25)] transition-all active:scale-95 group text-center relative -mt-4 sm:-mt-6 min-w-0"
              >
                <div className="absolute -top-4 sm:-top-6 left-1/2 -translate-x-1/2 text-yellow-400 animate-bounce">
                  <Crown className="w-7 h-7 sm:w-9 sm:h-9 fill-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]" />
                </div>
                <div className="relative mb-2 sm:mb-3 mt-1 sm:mt-2">
                  <div className="relative w-16 h-16 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 sm:border-4 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.5)] group-hover:scale-105 transition-transform">
                    <Image 
                      src={top1.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${top1.id}`} 
                      alt={top1.full_name || 'Champion'} 
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 56px, 96px"
                    />
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-yellow-400 text-yellow-950 font-black text-xs shadow-lg border border-white">
                    #1
                  </div>
                </div>
                <span className="font-black text-white text-xs sm:text-lg truncate w-full group-hover:text-yellow-300 transition-colors">
                  {top1.full_name || top1.email?.split('@')[0] || 'Champion'}
                </span>
                <div className="flex items-center gap-1 mt-1 text-xs sm:text-sm font-black text-yellow-400 mb-2">
                  <Star className="w-3.5 h-3.5 fill-yellow-400 shrink-0" />
                  <span className="truncate">{top1.points?.toLocaleString()}</span>
                </div>
                <div className="shrink-0 max-w-full overflow-hidden">
                  <RankBadge rank={top1.current_rank || 'Challenger'} points={top1.points} size="sm" />
                </div>
              </Link>
            )}

            {/* Rank #3 - Bronze */}
            {top3 && (
              <Link 
                href={`/profile/${top3.id}`}
                className="flex flex-col items-center p-2.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-[#0a092d]/70 backdrop-blur-xl border border-[#cd7f32]/30 hover:border-[#cd7f32]/60 shadow-xl transition-all active:scale-95 group text-center relative min-w-0"
              >
                <div className="relative mb-2 sm:mb-3">
                  <div className="relative w-12 h-12 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 sm:border-3 border-[#cd7f32] shadow-[0_0_15px_rgba(205,127,50,0.4)] group-hover:scale-105 transition-transform">
                    <Image 
                      src={top3.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${top3.id}`} 
                      alt={top3.full_name || 'Player'} 
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 48px, 80px"
                    />
                  </div>
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-[#cd7f32] text-white font-black text-[10px] sm:text-xs shadow-md border border-white">
                    #3
                  </div>
                </div>
                <span className="font-bold text-white text-xs sm:text-base truncate w-full group-hover:text-amber-200 transition-colors">
                  {top3.full_name || top3.email?.split('@')[0] || '3rd Place'}
                </span>
                <div className="flex items-center gap-1 mt-1 text-[11px] sm:text-xs font-extrabold text-amber-300 mb-2">
                  <Star className="w-3 h-3 fill-amber-300 shrink-0" />
                  <span className="truncate">{top3.points?.toLocaleString()}</span>
                </div>
                <div className="shrink-0 max-w-full overflow-hidden">
                  <RankBadge rank={top3.current_rank} points={top3.points} size="xs" />
                </div>
              </Link>
            )}

          </div>
        </div>
      )}

      {/* Main Ranks List (Rank 4 to 50 or full list) */}
      <div className="bg-[#0a092d]/60 border border-white/10 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl relative z-10">
        
        {/* Table Header (Desktop View) */}
        <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-4 bg-card/60 border-b border-white/10 text-xs font-extrabold text-muted-foreground uppercase tracking-widest">
          <div className="col-span-1 text-center">Rank</div>
          <div className="col-span-5">Learner</div>
          <div className="col-span-2 text-center">Tier</div>
          <div className="col-span-2 text-right">Points</div>
          <div className="col-span-2 text-right">Words</div>
        </div>

        {/* Players List */}
        <div className="flex flex-col divide-y divide-white/5">
          {players.length > 0 ? (
            players.map((player, index) => {
              const rankNum = index + 1;
              const isCurrentUser = user?.id === player.id;
              
              const displayName = isCurrentUser && (user?.user_metadata?.full_name || user?.user_metadata?.name)
                ? (user.user_metadata.full_name || user.user_metadata.name)
                : (player.full_name || player.email?.split('@')[0] || 'Anonymous Learner');

              const avatar = isCurrentUser && user?.user_metadata?.avatar_url
                ? user.user_metadata.avatar_url
                : (player.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.id}`);

              return (
                <Link 
                  href={`/profile/${player.id}`}
                  key={player.id}
                  className={`p-3.5 sm:px-6 sm:py-4 transition-all duration-200 hover:bg-white/5 active:scale-[0.99] flex sm:grid sm:grid-cols-12 items-center justify-between gap-3 ${
                    isCurrentUser 
                      ? 'bg-gradient-to-r from-[#4255ff]/15 via-[#b892ff]/15 to-transparent border-l-4 border-l-[#b892ff]' 
                      : ''
                  }`}
                >
                  {/* Rank Number */}
                  <div className="sm:col-span-1 shrink-0 text-center">
                    <span className="text-xs sm:text-sm font-extrabold font-mono text-muted-foreground px-2 py-0.5 rounded-lg bg-white/5 border border-white/5">
                      #{rankNum}
                    </span>
                  </div>

                  {/* Learner Info */}
                  <div className="sm:col-span-5 flex items-center gap-3 flex-1 min-w-0">
                    <div className={`relative w-9 h-9 sm:w-11 sm:h-11 rounded-full overflow-hidden bg-gray-900 shrink-0 border-2 ${
                      isCurrentUser ? 'border-[#b892ff] shadow-[0_0_10px_rgba(184,146,255,0.4)]' : 'border-white/10'
                    }`}>
                      <Image src={avatar} alt={displayName} fill sizes="(max-width: 768px) 36px, 44px" referrerPolicy="no-referrer" className="object-cover" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`font-bold text-xs sm:text-base truncate ${isCurrentUser ? 'text-[#b892ff]' : 'text-white'}`}>
                          {displayName}
                        </span>
                        {isCurrentUser && (
                          <span className="px-1.5 py-0.2 bg-gradient-to-r from-[#b892ff] to-[#4255ff] text-white text-[8px] sm:text-[9px] font-black uppercase rounded-md tracking-wider shrink-0">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="sm:hidden flex items-center gap-2 mt-1">
                        <RankBadge rank={player.current_rank} points={player.points} size="xs" />
                      </div>
                    </div>
                  </div>

                  {/* Tier Badge (Desktop) */}
                  <div className="hidden sm:col-span-2 sm:flex items-center justify-center">
                    <RankBadge rank={player.current_rank} points={player.points} size="xs" />
                  </div>

                  {/* Points (Desktop) */}
                  <div className="hidden sm:col-span-2 sm:flex items-center justify-end gap-1.5 text-amber-300 font-mono font-extrabold text-sm sm:text-base">
                    <Star className="w-3.5 h-3.5 fill-amber-300 shrink-0" />
                    <span>{player.points?.toLocaleString() || 0}</span>
                  </div>

                  {/* Words (Desktop) */}
                  <div className="hidden sm:col-span-2 sm:flex items-center justify-end gap-1.5 text-[#b892ff] font-mono font-bold text-xs sm:text-sm">
                    <BookOpen className="w-3.5 h-3.5 shrink-0" />
                    <span>{player.words_learned?.toLocaleString() || 0}</span>
                  </div>

                  {/* Points & Words Stack (Mobile view only) */}
                  <div className="sm:hidden flex flex-col items-end shrink-0">
                    <div className="flex items-center gap-1 text-xs font-black text-amber-300 font-mono">
                      <Star className="w-3 h-3 fill-amber-300 shrink-0" />
                      <span>{player.points?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono mt-0.5">
                      <BookOpen className="w-3 h-3 text-muted-foreground" />
                      <span>{player.words_learned?.toLocaleString() || 0} words</span>
                    </div>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="px-6 py-12 text-center text-muted-foreground font-semibold text-xs sm:text-sm">
              No additional players found on the leaderboard. Keep studying to reach the top!
            </div>
          )}
        </div>
      </div>

      {/* Logged-In User Rank Standing (Mobile Fixed Footer) */}
      {user && currentUserPlayer && (
        <div className="fixed inset-x-4 bottom-4 z-50 sm:hidden bg-[#0c0d28]/95 backdrop-blur-xl border border-[#b892ff]/40 rounded-2xl p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] flex items-center justify-between gap-2.5 shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="px-2 py-1 rounded-lg bg-[#4255ff]/20 text-[#9fa6ff] border border-[#4255ff]/30 text-xs font-black font-mono shrink-0">
              #{currentUserRank}
            </div>
            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-[#b892ff] shrink-0">
                <Image 
                  src={user.user_metadata?.avatar_url || currentUserPlayer.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} 
                  alt="Avatar" 
                  fill
                  sizes="32px"
                  className="object-cover" 
                />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-white text-xs truncate">Your Standing</span>
              <span className="text-[10px] text-amber-300 font-black font-mono flex items-center gap-1">
                <Star className="w-2.5 h-2.5 fill-amber-300 shrink-0" />
                <span className="truncate">{currentUserPlayer.points?.toLocaleString()} pts</span>
              </span>
            </div>
          </div>

          <div className="shrink-0">
            <RankBadge rank={currentUserPlayer.current_rank} points={currentUserPlayer.points} size="xs" />
          </div>
        </div>
      )}
    </div>
  );
}
