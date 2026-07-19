import { createClient } from '@/utils/supabase/server';
import { Trophy, Medal, Star, BookOpen } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 60; // Revalidate every 60 seconds

export default async function LeaderboardPage() {
  const supabase = await createClient();

  // Lấy danh sách Top 50 user theo điểm số
  const { data: players, error } = await supabase
    .from('profiles')
    .select('*')
    .order('points', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching leaderboard:', error);
  }

  // Get current user to highlight them
  const { data: { user } } = await supabase.auth.getUser();

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
    <div className="w-full max-w-5xl mx-auto py-10 px-6 font-sans">
      <div className="flex flex-col items-center mb-12">
        <div className="w-20 h-20 bg-card rounded-2xl flex items-center justify-center mb-6 shadow-2xl border border-white/10 ring-4 ring-[#4255ff]/20">
          <Trophy className="w-10 h-10 text-yellow-400 drop-shadow-md" />
        </div>
        <h1 className="text-4xl font-extrabold text-foreground tracking-tight">Global Leaderboard</h1>
        <p className="text-muted-foreground font-semibold mt-3 max-w-lg text-center">
          Top 50 most dedicated learners. Compete, earn points, and climb your way to Challenger rank!
        </p>
      </div>

      <div className="bg-[#0a092d]/50 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-card/80 border-b border-white/10 text-xs font-bold text-muted-foreground uppercase tracking-wider">
          <div className="col-span-1 text-center">Rank</div>
          <div className="col-span-5 md:col-span-4">Player</div>
          <div className="col-span-3 md:col-span-3 hidden md:flex items-center gap-1"><Trophy className="w-3.5 h-3.5"/> Tier</div>
          <div className="col-span-3 md:col-span-2 text-right flex items-center justify-end gap-1"><Star className="w-3.5 h-3.5"/> Points</div>
          <div className="col-span-3 md:col-span-2 text-right flex items-center justify-end gap-1"><BookOpen className="w-3.5 h-3.5"/> Words</div>
        </div>

        {/* Players List */}
        <div className="flex flex-col">
          {players && players.length > 0 ? (
            players.map((player, index) => {
              const isCurrentUser = user?.id === player.id;
              const rankNum = index + 1;
              let rankBadge = <span className="text-muted-foreground font-bold text-lg">#{rankNum}</span>;
              
              if (rankNum === 1) rankBadge = <Medal className="w-7 h-7 text-yellow-400 mx-auto drop-shadow-md" />;
              else if (rankNum === 2) rankBadge = <Medal className="w-7 h-7 text-slate-300 mx-auto drop-shadow-md" />;
              else if (rankNum === 3) rankBadge = <Medal className="w-7 h-7 text-[#cd7f32] mx-auto drop-shadow-md" />;

              const displayName = isCurrentUser && (user?.user_metadata?.full_name || user?.user_metadata?.name)
                ? (user.user_metadata.full_name || user.user_metadata.name)
                : (player.full_name || player.email?.split('@')[0] || 'Unknown Player');

              const avatar = isCurrentUser && user?.user_metadata?.avatar_url
                ? user.user_metadata.avatar_url
                : (player.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.id}`);

              return (
                <Link 
                  href={`/user/${player.id}`}
                  key={player.id}
                  className={`grid grid-cols-12 gap-4 px-6 py-4 items-center border-b border-white/5 transition-colors hover:bg-white/5 ${
                    isCurrentUser ? 'bg-[#4255ff]/10 hover:bg-[#4255ff]/20' : ''
                  }`}
                >
                  <div className="col-span-1 text-center flex justify-center">
                    {rankBadge}
                  </div>
                  <div className="col-span-5 md:col-span-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-600 shrink-0 border border-border">
                      <img src={avatar} alt={displayName} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col truncate">
                      <span className="font-bold text-foreground truncate">{displayName}</span>
                      {isCurrentUser && <span className="text-[10px] uppercase font-extrabold text-[#4255ff]">You</span>}
                    </div>
                  </div>
                  <div className="col-span-3 md:col-span-3 hidden md:flex items-center">
                    <div className={`px-2.5 py-1 rounded-md text-[10px] uppercase font-extrabold tracking-wider border bg-background/50 ${getRankColor(player.current_rank || 'Iron')}`}>
                      {player.current_rank || 'Iron'}
                    </div>
                  </div>
                  <div className="col-span-3 md:col-span-2 text-right">
                    <span className="font-bold text-foreground font-mono">{player.points?.toLocaleString() || 0}</span>
                  </div>
                  <div className="col-span-3 md:col-span-2 text-right">
                    <span className="font-bold text-[#b892ff] font-mono">{player.words_learned?.toLocaleString() || 0}</span>
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
