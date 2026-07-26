'use client';

import { Trophy, ArrowRight, Home, CheckCircle2, XCircle, Target, Flame } from 'lucide-react';

interface ReviewSummaryProps {
  correctCount: number;
  incorrectCount: number;
  totalCards: number;
  pointsEarned: number;
}

export function ReviewSummary({
  correctCount,
  incorrectCount,
  totalCards,
  pointsEarned,
}: ReviewSummaryProps) {
  const accuracy = totalCards > 0 ? Math.round((correctCount / (correctCount + incorrectCount)) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-8 duration-700 py-10 px-4">
      {/* Trophy Icon with glowing effect */}
      <div className="relative mb-12 group">
        <div className="absolute inset-0 bg-gradient-to-br from-[#b892ff] to-[#4255ff] blur-3xl opacity-50 group-hover:opacity-70 transition-opacity duration-500 rounded-full"></div>
        <div className="relative w-32 h-32 bg-gradient-to-br from-[#1a1c29] to-[#0f111a] border-[3px] border-[#b892ff]/30 rounded-full flex items-center justify-center shadow-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-[#b892ff]/20 to-transparent"></div>
          <Trophy className="w-16 h-16 text-[#b892ff] drop-shadow-[0_0_15px_rgba(184,146,255,0.8)] z-10 animate-bounce" style={{ animationDuration: '2s' }} />
        </div>
      </div>

      <h2 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#9fa6ff] via-[#b892ff] to-[#ff92d0] drop-shadow-sm mb-6 tracking-tight">
        Session Complete!
      </h2>
      <p className="text-xl text-muted-foreground font-medium mb-12 max-w-lg">
        Excellent work! You've successfully completed your review and reinforced your memory.
      </p>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full mb-14">
        {/* Accuracy Card */}
        <div className="bg-gradient-to-b from-white/[0.08] to-transparent backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden group hover:border-[#b892ff]/50 transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-[#b892ff]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="w-12 h-12 bg-[#b892ff]/20 rounded-2xl flex items-center justify-center mb-4 text-[#b892ff]">
            <Target className="w-6 h-6" />
          </div>
          <p className="text-4xl font-black text-white mb-1">{accuracy}%</p>
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Accuracy</p>
        </div>

        {/* Correct Card */}
        <div className="bg-gradient-to-b from-white/[0.08] to-transparent backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden group hover:border-emerald-500/50 transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-4 text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <p className="text-4xl font-black text-emerald-400 mb-1">{correctCount}</p>
          <p className="text-xs text-emerald-400/70 font-bold uppercase tracking-widest">Correct</p>
        </div>

        {/* Incorrect Card */}
        <div className="bg-gradient-to-b from-white/[0.08] to-transparent backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden group hover:border-rose-500/50 transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="w-12 h-12 bg-rose-500/20 rounded-2xl flex items-center justify-center mb-4 text-rose-400">
            <XCircle className="w-6 h-6" />
          </div>
          <p className="text-4xl font-black text-rose-400 mb-1">{incorrectCount}</p>
          <p className="text-xs text-rose-400/70 font-bold uppercase tracking-widest">Incorrect</p>
        </div>

        {/* Points Card */}
        <div className="bg-gradient-to-b from-white/[0.08] to-transparent backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden group hover:border-[#ff92d0]/50 transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-[#ff92d0]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="w-12 h-12 bg-[#ff92d0]/20 rounded-2xl flex items-center justify-center mb-4 text-[#ff92d0]">
            <Flame className="w-6 h-6" />
          </div>
          <p className="text-4xl font-black text-[#ff92d0] mb-1">+{pointsEarned}</p>
          <p className="text-xs text-[#ff92d0]/70 font-bold uppercase tracking-widest">Points</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
        <a
          href="/status"
          className="group relative px-8 py-4 bg-gradient-to-r from-[#4255ff] to-[#6d7bff] text-white rounded-2xl font-bold text-lg overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(66,85,255,0.4)] flex items-center gap-3 w-full sm:w-auto min-w-[220px] justify-center"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
          <span className="relative z-10 flex items-center gap-2">
            View My Stats <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </span>
        </a>

        <a
          href="/"
          className="group relative px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl font-bold text-lg transition-all hover:scale-105 flex items-center gap-3 w-full sm:w-auto min-w-[220px] justify-center shadow-lg hover:border-white/20"
        >
          <span className="relative z-10 flex items-center gap-2">
            <Home className="w-5 h-5" /> Back to Home
          </span>
        </a>
      </div>
    </div>
  );
}
