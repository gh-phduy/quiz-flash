'use client';

import React, { useState, useMemo } from 'react';
import { 
  GraduationCap, 
  CheckCircle2, 
  Target, 
  TrendingUp, 
  Layers, 
  Search, 
  User,
  Table as TableIcon
} from 'lucide-react';
import { OxfordSummaryAnalytics, OxfordSetSummary } from '@/actions/oxford';
import SetAnalyticsModal from '@/components/shared/set-analytics-modal';

interface OxfordDashboardProps {
  analytics: OxfordSummaryAnalytics;
}

const LEVEL_COLORS: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  'A1': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', glow: 'shadow-emerald-500/10' },
  'A2': { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/30', glow: 'shadow-teal-500/10' },
  'B1': { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30', glow: 'shadow-cyan-500/10' },
  'B2': { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30', glow: 'shadow-indigo-500/10' },
  'B2 (Mở rộng)': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30', glow: 'shadow-purple-500/10' },
  'C1': { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30', glow: 'shadow-rose-500/10' },
  'C2': { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/30', glow: 'shadow-pink-500/10' },
  'Oxford': { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30', glow: 'shadow-indigo-500/10' },
};

export default function OxfordDashboard({ analytics }: OxfordDashboardProps) {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [globalSearch, setGlobalSearch] = useState('');
  
  // State for inspecting set details in reusable modal
  const [inspectingSetId, setInspectingSetId] = useState<string | null>(null);

  // Filter set list on main page
  const filteredSets = useMemo(() => {
    return analytics.sets.filter(s => {
      if (activeTab !== 'all' && s.cefrLevel !== activeTab) {
        return false;
      }
      if (globalSearch) {
        const query = globalSearch.toLowerCase();
        const titleMatch = s.title.toLowerCase().includes(query);
        const descMatch = s.description?.toLowerCase().includes(query);
        const levelMatch = s.cefrLevel.toLowerCase().includes(query);
        return titleMatch || descMatch || levelMatch;
      }
      return true;
    });
  }, [analytics.sets, activeTab, globalSearch]);

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-8 font-sans text-slate-100">
      
      {/* 1. Header Banner & Global Analytics */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#020617] border border-indigo-500/20 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold tracking-wider uppercase">
                <GraduationCap className="w-4 h-4 text-indigo-400" />
                Oxford Academic Standard
              </div>
              {analytics.userName && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  User: {analytics.userName}
                </div>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-indigo-300">
              Oxford Vocabulary Analytics
            </h1>
            <p className="text-slate-400 text-sm sm:text-base max-w-4xl">
              Comprehensive analytics tracking word mastery levels, repetition intervals, accuracy rates, and weak word performance across Cambridge / Oxford CEFR benchmarks (A1 → C1).
            </p>
          </div>

          {/* Stat Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Stat 1: Words Mastered */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 backdrop-blur-md space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>Mastered Words</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white">
                {analytics.totalMasteredWords.toLocaleString()} <span className="text-xs text-slate-500 font-normal">/ {analytics.totalOxfordWords.toLocaleString()}</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${analytics.overallMasteryPercentage}%` }} 
                />
              </div>
              <div className="text-[11px] text-emerald-400 font-medium pt-0.5">
                {analytics.overallMasteryPercentage}% of entire vocabulary
              </div>
            </div>

            {/* Stat 2: Overall Accuracy */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 backdrop-blur-md space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>Overall Accuracy</span>
                <Target className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white">
                {analytics.overallAccuracy}%
              </div>
              <div className="text-[11px] text-slate-400 font-medium">
                {analytics.totalCorrect.toLocaleString()} correct / {analytics.totalReviews.toLocaleString()} reviews
              </div>
            </div>

            {/* Stat 3: Total Reviews */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 backdrop-blur-md space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>Total Review Count</span>
                <TrendingUp className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white">
                {analytics.totalReviews.toLocaleString()}
              </div>
              <div className="text-[11px] text-cyan-400 font-medium">
                Recorded SM-2 Spaced Repetitions
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 2. Controls & Level Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
              activeTab === 'all'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            All Levels ({analytics.sets.length})
          </button>

          {analytics.sets.map(s => {
            const color = LEVEL_COLORS[s.cefrLevel] || LEVEL_COLORS['Oxford'];
            const isActive = activeTab === s.cefrLevel;
            return (
              <button
                key={s.id}
                onClick={() => setActiveTab(s.cefrLevel)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all border ${
                  isActive
                    ? `${color.bg} ${color.text} ${color.border} shadow-lg ${color.glow}`
                    : 'bg-slate-900/80 border-transparent text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>{s.cefrLevel}</span>
                <span className="text-xs opacity-75 font-normal">({s.totalCards})</span>
              </button>
            );
          })}
        </div>

        {/* Global Search Input */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search sets..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
          />
        </div>
      </div>

      {/* 3. Oxford Sets Analytics Cards Grid */}
      {filteredSets.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-white/5 space-y-3">
          <Search className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Matching Sets Found</h3>
          <p className="text-slate-400 text-sm">Try clearing your search criteria or switching level tabs.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSets.map(set => {
            const color = LEVEL_COLORS[set.cefrLevel] || LEVEL_COLORS['Oxford'];

            return (
              <div 
                key={set.id}
                className="group relative rounded-3xl bg-slate-900/80 border border-white/10 hover:border-indigo-500/40 p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10 space-y-6"
              >
                <div className="space-y-4">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${color.bg} ${color.text} border ${color.border}`}>
                      {set.cefrLevel}
                    </span>
                    <span className="text-xs font-semibold text-slate-400 bg-slate-950/60 px-3 py-1 rounded-full border border-white/5">
                      {set.totalCards.toLocaleString()} words
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1.5">
                    <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {set.title}
                    </h3>
                    <p className="text-slate-400 text-xs sm:text-sm line-clamp-2 leading-relaxed">
                      {set.description || 'Cambridge / Oxford academic vocabulary set.'}
                    </p>
                  </div>

                  {/* Mastery Progress Bar */}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-400">Mastery Level</span>
                      <span className="text-emerald-400">{set.masteryPercentage}%</span>
                    </div>

                    <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden flex p-0.5 border border-white/5">
                      {set.totalCards > 0 && (
                        <>
                          <div 
                            className="bg-emerald-400 h-full rounded-l-full transition-all duration-500" 
                            style={{ width: `${(set.masteredCount / set.totalCards) * 100}%` }}
                            title={`Mastered: ${set.masteredCount}`}
                          />
                          <div 
                            className="bg-cyan-400 h-full transition-all duration-500" 
                            style={{ width: `${(set.reviewingCount / set.totalCards) * 100}%` }}
                            title={`Reviewing: ${set.reviewingCount}`}
                          />
                          <div 
                            className="bg-amber-400 h-full transition-all duration-500" 
                            style={{ width: `${(set.learningCount / set.totalCards) * 100}%` }}
                            title={`Learning: ${set.learningCount}`}
                          />
                        </>
                      )}
                    </div>

                    {/* Legend */}
                    <div className="grid grid-cols-4 gap-1 text-[10px] text-slate-400 pt-1">
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span>{set.masteredCount} Mastered</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-cyan-400" />
                        <span>{set.reviewingCount} Reviewing</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        <span>{set.learningCount} Learning</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-slate-700" />
                        <span>{set.unstudiedCount} Unstudied</span>
                      </div>
                    </div>
                  </div>

                  {/* Secondary Metrics */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-center">
                    <div className="p-2 rounded-xl bg-slate-950/50">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Accuracy</div>
                      <div className="text-sm font-bold text-indigo-300">{set.accuracy}%</div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950/50">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Reviews</div>
                      <div className="text-sm font-bold text-cyan-300">{set.totalReviews}</div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950/50">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Weak Words</div>
                      <div className="text-sm font-bold text-amber-400">{set.weakCount}</div>
                    </div>
                  </div>
                </div>

                {/* Pure Table Inspection Action Button */}
                <div className="pt-4 border-t border-white/5">
                  <button
                    onClick={() => setInspectingSetId(set.id)}
                    className="w-full py-3 px-4 rounded-2xl bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/30 text-indigo-200 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md group-hover:bg-indigo-600 group-hover:text-white"
                  >
                    <TableIcon className="w-4 h-4 text-indigo-400 group-hover:text-white" />
                    Inspect Vocabulary Table ({set.totalCards} Words)
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Reusable Standalone Set Analytics Modal (Lazy Loaded On-Demand) */}
      {inspectingSetId && (
        <SetAnalyticsModal 
          setId={inspectingSetId}
          onClose={() => setInspectingSetId(null)}
          targetUserId={analytics.userId}
        />
      )}

    </div>
  );
}
