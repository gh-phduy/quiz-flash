'use client';

import Link from 'next/link';
import { Trophy, ArrowRight, Home } from 'lucide-react';

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
  const accuracy = totalCards > 0 ? Math.round((correctCount / totalCards) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="w-24 h-24 bg-gradient-to-br from-[#b892ff] to-[#4255ff] rounded-[2rem] rotate-12 flex items-center justify-center mb-8 shadow-2xl shadow-[#b892ff]/30">
        <div className="w-full h-full bg-white/10 backdrop-blur-sm rounded-[2rem] flex items-center justify-center -rotate-12">
          <Trophy className="w-12 h-12 text-white drop-shadow-md" />
        </div>
      </div>

      <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#9fa6ff] via-[#b892ff] to-[#ff92d0] drop-shadow-sm mb-4">
        Review Complete!
      </h2>
      <p className="text-xl text-muted-foreground font-medium mb-10 max-w-md">
        You've successfully completed your daily review and reinforced your memory.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mb-10">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-5 flex flex-col items-center justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <p className="text-sm text-muted-foreground font-bold uppercase tracking-wider mb-2">Accuracy</p>
          <p className="text-3xl font-black text-white">{accuracy}%</p>
        </div>
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-5 flex flex-col items-center justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-[#ff92d0]/10 to-[#b892ff]/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <p className="text-sm text-muted-foreground font-bold uppercase tracking-wider mb-2">Points</p>
          <p className="text-3xl font-black text-[#ff92d0]">+{pointsEarned}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-5 flex flex-col items-center justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <p className="text-sm text-muted-foreground font-bold uppercase tracking-wider mb-2">Correct</p>
          <p className="text-3xl font-black text-green-400">{correctCount}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-5 flex flex-col items-center justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <p className="text-sm text-muted-foreground font-bold uppercase tracking-wider mb-2">Incorrect</p>
          <p className="text-3xl font-black text-red-400">{incorrectCount}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
        <Link
          href="/status"
          className="group relative px-8 py-4 bg-gradient-to-r from-[#4255ff] to-[#6d7bff] text-white rounded-2xl font-bold text-lg overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(66,85,255,0.4)] flex items-center gap-3 flex-1 max-w-xs justify-center"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
          <span className="relative z-10 flex items-center gap-2">
            View My Stats <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </span>
        </Link>

        <Link
          href="/"
          className="group relative px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-2xl font-bold text-lg overflow-hidden transition-all hover:scale-105 flex items-center gap-3 flex-1 max-w-xs justify-center shadow-lg"
        >
          <span className="relative z-10 flex items-center gap-2">
            <Home className="w-5 h-5" /> Back to Home
          </span>
        </Link>
      </div>
    </div>
  );
}
