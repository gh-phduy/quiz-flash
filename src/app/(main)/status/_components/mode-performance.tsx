'use client';

import React from 'react';
import { Layers, Headphones, Mic, FileText, Zap } from 'lucide-react';

interface ModePerformanceProps {
  modePerformance?: Record<string, { correct: number; total: number; accuracy: number }>;
}

const modeInfo: Record<string, { label: string; icon: any; color: string; bg: string; border: string; bar: string }> = {
  flashcards: { 
    label: 'Flashcards', 
    icon: Layers, 
    color: 'text-blue-400', 
    bg: 'from-blue-500/15 via-blue-500/5 to-transparent',
    border: 'hover:border-blue-500/40 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]',
    bar: 'bg-blue-500'
  },
  speaking: { 
    label: 'Speaking', 
    icon: Mic, 
    color: 'text-rose-400', 
    bg: 'from-rose-500/15 via-rose-500/5 to-transparent',
    border: 'hover:border-rose-500/40 hover:shadow-[0_0_20px_rgba(244,63,94,0.15)]',
    bar: 'bg-rose-500'
  },
  listening: { 
    label: 'Listening', 
    icon: Headphones, 
    color: 'text-amber-400', 
    bg: 'from-amber-500/15 via-amber-500/5 to-transparent',
    border: 'hover:border-amber-500/40 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]',
    bar: 'bg-amber-500'
  },
  test: { 
    label: 'Test', 
    icon: FileText, 
    color: 'text-emerald-400', 
    bg: 'from-emerald-500/15 via-emerald-500/5 to-transparent',
    border: 'hover:border-emerald-500/40 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]',
    bar: 'bg-emerald-500'
  },
  match: { 
    label: 'Match', 
    icon: Zap, 
    color: 'text-cyan-400', 
    bg: 'from-cyan-500/15 via-cyan-500/5 to-transparent',
    border: 'hover:border-cyan-500/40 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]',
    bar: 'bg-cyan-500'
  },
};

export default function ModePerformance({ modePerformance }: ModePerformanceProps) {
  if (!modePerformance) return null;

  return (
    <div className="p-6 md:p-8 bg-[#0a092d]/60 backdrop-blur-xl border border-white/10 rounded-3xl space-y-6 shadow-xl relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            Skill Breakdown by Mode
          </h2>
          <p className="text-xs text-muted-foreground font-semibold mt-1">
            Track your accuracy and strength across each active practice mode
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {Object.entries(modeInfo).map(([modeKey, info]) => {
          const stats = modePerformance[modeKey] || { correct: 0, total: 0, accuracy: 0 };
          const Icon = info.icon;

          return (
            <div
              key={modeKey}
              className={`p-5 bg-gradient-to-br ${info.bg} border border-white/10 rounded-2xl flex flex-col items-center justify-between text-center transition-all duration-300 ${info.border} group`}
            >
              <div className={`p-3 rounded-2xl bg-white/5 border border-white/10 ${info.color} mb-3 group-hover:scale-110 transition-transform`}>
                <Icon className="w-6 h-6" />
              </div>

              <span className="text-xs font-extrabold text-white/90 uppercase tracking-wider mb-2">
                {info.label}
              </span>
              
              <div className="w-full my-2 space-y-0.5">
                <span className={`text-3xl font-black ${info.color} tracking-tight block`}>
                  {stats.accuracy}%
                </span>
                <p className="text-[11px] text-white/50 font-bold">
                  {stats.correct} / {stats.total} correct
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden mt-3 p-[1px]">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${info.bar}`}
                  style={{ width: `${Math.min(100, stats.accuracy)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
