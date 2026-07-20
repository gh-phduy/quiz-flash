import { createClient } from '@/utils/supabase/server';
import { Trophy, Medal, Star, BookOpen } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 60; // Revalidate every 60 seconds

export default async function LeaderboardPage() {
  const supabase = await createClient();

  // ⚡ Song song hóa: Fetch leaderboard + current user cùng lúc
  const [playersResult, userResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, email, avatar_url, current_rank, points, words_learned, full_name')
      .order('points', { ascending: false })
      .limit(50),
    supabase.auth.getUser(),
  ]);

  const players = playersResult.data;
  const user = userResult.data?.user;

  if (playersResult.error) {
    console.error('Error fetching leaderboard:', playersResult.error);
  }

  const getRankColor = (rankStr: string) => {
    const r = rankStr.toLowerCase();
    if (r === 'iron') return 'text-gray-400 border-gray-400';
    if (r === 'bronze') return 'text-[#cd7f32] border-[#cd7f32]';
    if (r === 'silver') return 'text-slate-300 border-slate-300';
    if (r === 'gold') return 'text-yellow-400 border-yellow-400';
    if (r === 'platinum') return 'text-[#e5e4e2] border-[#e5e4e2]';
    if (r === 'emerald') return 'text-emerald-400 border-emerald-400';
    if (r === 'diamond') return 'text-blue-400 border-blue-400';
    if (r === 'master') return 'text-purple-400 border-purple-400';
    if (r === 'grandmaster') return 'text-red-400 border-red-400';
    if (r === 'challenger') return 'text-sky-400 border-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]';
    return 'text-gray-400 border-gray-400';
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-10 px-6 font-sans relative">
      {/* Background neon glows */}
      <div className="absolute top-0 left-1/4 w-80 h-80 bg-[#4255ff]/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-[#b892ff]/5 rounded-full blur-3xl -z-10" />

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

      <div className="flex flex-col items-center mb-12 relative z-10">
        <div className="w-24 h-24 bg-card rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(184,146,255,0.2)] border border-[#b892ff]/30 ring-4 ring-[#4255ff]/10 group transition-all duration-300 hover:scale-105">
          <Trophy className="w-12 h-12 group-hover:scale-110 transition-transform" style={{ stroke: 'url(#logoGradient)' }} />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-[#b892ff] via-[#6d7bff] to-[#4255ff] text-transparent bg-clip-text tracking-tight drop-shadow-[0_2px_10px_rgba(184,146,255,0.25)]">
          Global Leaderboard
        </h1>
        <p className="text-muted-foreground font-semibold mt-3 max-w-lg text-center tracking-wide">
          Top 50 most dedicated learners. Compete, earn points, and climb your way to Challenger rank!
        </p>
      </div>

      <div className="bg-[#0a092d]/50 border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl relative z-10">
        {/* Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-5 bg-card/40 border-b border-white/10 text-xs font-bold text-muted-foreground uppercase tracking-widest">
          <div className="col-span-1 text-center">Rank</div>
          <div className="col-span-5 md:col-span-4">Player</div>
          <div className="col-span-3 md:col-span-3 hidden md:flex items-center justify-center gap-1.5"><Trophy className="w-3.5 h-3.5" style={{ stroke: 'url(#logoGradient)' }}/> Tier</div>
          <div className="col-span-3 md:col-span-2 text-right flex items-center justify-end gap-1.5"><Star className="w-3.5 h-3.5" style={{ stroke: 'url(#logoGradient)' }}/> Points</div>
          <div className="col-span-3 md:col-span-2 text-right flex items-center justify-end gap-1.5"><BookOpen className="w-3.5 h-3.5" style={{ stroke: 'url(#logoGradient)' }}/> Words</div>
        </div>

        {/* Players List */}
        <div className="flex flex-col">
          {players && players.length > 0 ? (
            players.map((player, index) => {
              const isCurrentUser = user?.id === player.id;
              const rankNum = index + 1;
              let rankBadge = <span className="text-muted-foreground font-bold text-lg font-mono">#{rankNum}</span>;
              
              if (rankNum === 1) rankBadge = <Medal className="w-8 h-8 text-yellow-400 mx-auto drop-shadow-[0_0_10px_rgba(250,204,21,0.4)]" />;
              else if (rankNum === 2) rankBadge = <Medal className="w-8 h-8 text-slate-300 mx-auto drop-shadow-[0_0_10px_rgba(203,213,225,0.4)]" />;
              else if (rankNum === 3) rankBadge = <Medal className="w-8 h-8 text-[#cd7f32] mx-auto drop-shadow-[0_0_10px_rgba(205,127,50,0.4)]" />;

              const displayName = isCurrentUser && (user?.user_metadata?.full_name || user?.user_metadata?.name)
                ? (user.user_metadata.full_name || user.user_metadata.name)
                : (player.full_name || player.email?.split('@')[0] || 'Unknown Player');

              const avatar = isCurrentUser && user?.user_metadata?.avatar_url
                ? user.user_metadata.avatar_url
                : (player.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.id}`);

              return (
                <Link 
                  href={`/status/${player.id}`}
                  key={player.id}
                  className={`grid grid-cols-12 gap-4 px-6 py-4.5 items-center border-b border-white/5 transition-all duration-200 hover:bg-white/5 hover:translate-x-1 ${
                    isCurrentUser 
                      ? 'bg-gradient-to-r from-[#4255ff]/10 to-[#b892ff]/10 border-l-[4px] border-l-[#b892ff] hover:from-[#4255ff]/15 hover:to-[#b892ff]/15' 
                      : ''
                  }`}
                >
                  <div className="col-span-1 text-center flex justify-center">
                    {rankBadge}
                  </div>
                  <div className="col-span-5 md:col-span-4 flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-full overflow-hidden bg-gray-900 shrink-0 border-2 ${
                      isCurrentUser ? 'border-[#b892ff] shadow-[0_0_10px_rgba(184,146,255,0.3)]' : 'border-white/10'
                    }`}>
                      <img src={avatar} alt={displayName} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col truncate">
                      <span className={`font-bold truncate ${isCurrentUser ? 'text-[#b892ff]' : 'text-foreground'}`}>
                        {displayName}
                      </span>
                      {isCurrentUser && (
                        <span className="inline-flex max-w-max px-1.5 py-0.5 bg-gradient-to-r from-[#b892ff] to-[#4255ff] text-white text-[8px] font-extrabold uppercase rounded-md mt-1 tracking-widest">
                          You
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="col-span-3 md:col-span-3 hidden md:flex items-center justify-center">
                    <div className={`px-3 py-1 rounded-lg text-[9px] uppercase font-extrabold tracking-widest border bg-background/60 backdrop-blur-sm ${getRankColor(player.current_rank || 'Iron')}`}>
                      {player.current_rank || 'Iron'}
                    </div>
                  </div>
                  <div className="col-span-3 md:col-span-2 text-right">
                    <span className="font-bold text-foreground font-mono text-base">{player.points?.toLocaleString() || 0}</span>
                  </div>
                  <div className="col-span-3 md:col-span-2 text-right">
                    <span className="font-bold text-[#b892ff] font-mono text-base">{player.words_learned?.toLocaleString() || 0}</span>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="px-6 py-12 text-center text-muted-foreground font-semibold">
              No players found on the leaderboard yet. Be the first to earn points!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
