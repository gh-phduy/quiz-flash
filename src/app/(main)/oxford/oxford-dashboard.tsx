'use client';

import React, { useState, useMemo } from 'react';
import { 
  GraduationCap, 
  Target, 
  AlertTriangle, 
  Volume2, 
  CheckCircle2, 
  TrendingUp, 
  Layers, 
  X, 
  Search, 
  Table as TableIcon, 
  User,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  SlidersHorizontal,
  BarChart3,
  HelpCircle,
  Clock,
  Sparkles,
  BookOpenText,
  FileSpreadsheet
} from 'lucide-react';
import { OxfordOverallAnalytics, OxfordSetAnalytics, OxfordWordStats } from '@/actions/oxford';

interface OxfordDashboardProps {
  analytics: OxfordOverallAnalytics;
}

type SortField = 'term' | 'accuracy' | 'totalReviews' | 'incorrectCount' | 'masteryLevel' | 'nextReviewDate';
type SortOrder = 'asc' | 'desc';

const LEVEL_COLORS: Record<string, { bg: string; text: string; border: string; gradient: string; glow: string }> = {
  'A1': {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    gradient: 'from-emerald-500/20 via-emerald-600/10 to-transparent',
    glow: 'shadow-emerald-500/10'
  },
  'A2': {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    border: 'border-cyan-500/30',
    gradient: 'from-cyan-500/20 via-cyan-600/10 to-transparent',
    glow: 'shadow-cyan-500/10'
  },
  'B1': {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    gradient: 'from-blue-500/20 via-blue-600/10 to-transparent',
    glow: 'shadow-blue-500/10'
  },
  'B2': {
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-400',
    border: 'border-indigo-500/30',
    gradient: 'from-indigo-500/20 via-indigo-600/10 to-transparent',
    glow: 'shadow-indigo-500/10'
  },
  'B2 (Expanded)': {
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
    gradient: 'from-purple-500/20 via-purple-600/10 to-transparent',
    glow: 'shadow-purple-500/10'
  },
  'C1': {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    gradient: 'from-amber-500/20 via-amber-600/10 to-transparent',
    glow: 'shadow-amber-500/10'
  },
  'Oxford': {
    bg: 'bg-violet-500/10',
    text: 'text-violet-400',
    border: 'border-violet-500/30',
    gradient: 'from-violet-500/20 via-violet-600/10 to-transparent',
    glow: 'shadow-violet-500/10'
  }
};

export default function OxfordDashboard({ analytics }: OxfordDashboardProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'weak' | string>('all');
  const [selectedSet, setSelectedSet] = useState<OxfordSetAnalytics | null>(null);
  
  // Modal Filtering & Searching
  const [modalStatusFilter, setModalStatusFilter] = useState<'all' | 'studied' | 'mastered' | 'reviewing' | 'learning' | 'weak' | 'unstudied'>('all');
  const [modalPosFilter, setModalPosFilter] = useState<string>('all');
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  
  // Modal Sorting
  const [sortField, setSortField] = useState<SortField>('incorrectCount');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  // Audio playback state
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  
  // Global search for sets / weak words
  const [globalSearch, setGlobalSearch] = useState('');

  const playAudio = (url?: string | null, id?: string) => {
    if (!url) return;
    if (id) setPlayingAudioId(id);
    const audio = new Audio(url);
    audio.play().catch(() => {});
    audio.onended = () => setPlayingAudioId(null);
  };

  const handleHeaderSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'term' ? 'asc' : 'desc');
    }
  };

  // Filter set list on main page
  const filteredSets = useMemo(() => {
    return analytics.sets.filter(s => {
      // Level Tab filter
      if (activeTab !== 'all' && activeTab !== 'weak' && s.cefrLevel !== activeTab) {
        return false;
      }
      // Search filter
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

  // Filter weak cards list
  const filteredWeakCards = useMemo(() => {
    return analytics.topWeakCards.filter(card => {
      if (!globalSearch) return true;
      const query = globalSearch.toLowerCase();
      return card.term.toLowerCase().includes(query) || card.definition.toLowerCase().includes(query);
    });
  }, [analytics.topWeakCards, globalSearch]);

  // Extract unique Parts of Speech for the selected set
  const availablePartsOfSpeech = useMemo(() => {
    if (!selectedSet) return [];
    const posSet = new Set<string>();
    selectedSet.allCards.forEach(c => {
      if (c.partOfSpeech) posSet.add(c.partOfSpeech.trim().toLowerCase());
    });
    return Array.from(posSet).sort();
  }, [selectedSet]);

  // Modal Table cards calculation (Filtering + Searching + Sorting)
  const modalCards = useMemo(() => {
    if (!selectedSet) return [];
    
    // 1. Filter
    let result = selectedSet.allCards.filter(card => {
      // Status Filter
      if (modalStatusFilter === 'studied' && card.totalReviews === 0) return false;
      if (modalStatusFilter === 'mastered' && card.masteryLevel !== 'mastered') return false;
      if (modalStatusFilter === 'reviewing' && card.masteryLevel !== 'reviewing') return false;
      if (modalStatusFilter === 'learning' && card.masteryLevel !== 'learning') return false;
      if (modalStatusFilter === 'unstudied' && (card.masteryLevel !== 'new' && card.totalReviews > 0)) return false;
      if (modalStatusFilter === 'weak') {
        const isWeak = (card.weaknessLevel >= 2) || (card.incorrectCount > 0 && card.incorrectCount >= card.correctCount);
        if (!isWeak) return false;
      }

      // Part of Speech Filter
      if (modalPosFilter !== 'all') {
        if (!card.partOfSpeech || card.partOfSpeech.toLowerCase() !== modalPosFilter) return false;
      }

      // Search Query
      if (modalSearchQuery) {
        const query = modalSearchQuery.toLowerCase();
        const termMatch = card.term.toLowerCase().includes(query);
        const defMatch = card.definition.toLowerCase().includes(query);
        const posMatch = card.partOfSpeech?.toLowerCase().includes(query);
        return termMatch || defMatch || Boolean(posMatch);
      }

      return true;
    });

    // 2. Sort
    result.sort((a, b) => {
      let valA: any;
      let valB: any;

      switch (sortField) {
        case 'term':
          valA = a.term.toLowerCase();
          valB = b.term.toLowerCase();
          break;
        case 'accuracy':
          valA = a.totalReviews > 0 ? a.accuracy : -1;
          valB = b.totalReviews > 0 ? b.accuracy : -1;
          break;
        case 'totalReviews':
          valA = a.totalReviews;
          valB = b.totalReviews;
          break;
        case 'incorrectCount':
          valA = a.incorrectCount;
          valB = b.incorrectCount;
          break;
        case 'masteryLevel':
          const masteryWeight: Record<string, number> = { 'mastered': 4, 'reviewing': 3, 'learning': 2, 'new': 1 };
          valA = masteryWeight[a.masteryLevel] || 0;
          valB = masteryWeight[b.masteryLevel] || 0;
          break;
        case 'nextReviewDate':
          valA = a.nextReviewDate ? new Date(a.nextReviewDate).getTime() : 0;
          valB = b.nextReviewDate ? new Date(b.nextReviewDate).getTime() : 0;
          break;
        default:
          valA = a.term;
          valB = b.term;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [selectedSet, modalStatusFilter, modalPosFilter, modalSearchQuery, sortField, sortOrder]);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 opacity-60 group-hover:opacity-100 transition-opacity" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-indigo-400" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-indigo-400" />
    );
  };

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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
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

            {/* Stat 4: Weak Words */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 backdrop-blur-md space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>Weak Words Focus</span>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-400">
                {analytics.topWeakCards.length}
              </div>
              <div className="text-[11px] text-slate-400 font-medium">
                Based on error rate & SM-2 score
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 2. Controls & Level Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        {/* CEFR Level Filter Tabs */}
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

          <button
            onClick={() => setActiveTab('weak')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
              activeTab === 'weak'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30'
                : 'bg-slate-900/80 text-amber-400/80 hover:text-amber-300 hover:bg-slate-800'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Weak Words ({analytics.topWeakCards.length})
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
            placeholder="Search sets or terms..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
          />
        </div>
      </div>

      {/* 3. Tab Content: Weak Words Spotlight Panel */}
      {activeTab === 'weak' ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-amber-500/20">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Weak Words Spotlight ({filteredWeakCards.length})
              </h2>
              <p className="text-sm text-slate-400">
                Words with low accuracy or high error counts. Reviewing these regularly transitions them into your Mastered pool.
              </p>
            </div>
          </div>

          {filteredWeakCards.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-white/5 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto opacity-80" />
              <h3 className="text-lg font-bold text-white">No Weak Words Found!</h3>
              <p className="text-slate-400 text-sm">All reviewed words meet high accuracy standards.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredWeakCards.map(card => (
                <div 
                  key={card.id}
                  className="p-5 rounded-2xl bg-slate-900/80 border border-amber-500/20 hover:border-amber-500/40 transition-all space-y-4 flex flex-col justify-between group"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-extrabold text-white group-hover:text-amber-300 transition-colors">
                            {card.term}
                          </span>
                          {card.audioUrl && (
                            <button
                              onClick={() => playAudio(card.audioUrl, card.id)}
                              className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors"
                              title="Listen to pronunciation"
                            >
                              <Volume2 className={`w-4 h-4 ${playingAudioId === card.id ? 'animate-bounce text-amber-300' : ''}`} />
                            </button>
                          )}
                        </div>
                        {card.phonetic && (
                          <div className="text-xs text-slate-400 font-mono mt-0.5">
                            {card.phonetic}
                          </div>
                        )}
                      </div>

                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-300 shrink-0">
                        {card.cefrLevel || 'Oxford'}
                      </span>
                    </div>

                    <p className="text-sm text-slate-300 font-medium line-clamp-2">
                      {card.definition}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/5 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Set: <strong className="text-slate-200 font-semibold">{card.setTitle}</strong></span>
                      <span className="text-rose-400 font-semibold">Errors: {card.incorrectCount} / {card.totalReviews}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                      <div className="p-2 rounded-lg bg-slate-950/60 text-center">
                        <span className="text-slate-400 block text-[10px]">Accuracy</span>
                        <span className="font-bold text-amber-400">{card.accuracy}%</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-950/60 text-center">
                        <span className="text-slate-400 block text-[10px]">Repetitions</span>
                        <span className="font-bold text-slate-200">{card.totalReviews}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* 4. Oxford Sets Analytics Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSets.map(set => {
            const color = LEVEL_COLORS[set.cefrLevel] || LEVEL_COLORS['Oxford'];
            return (
              <div 
                key={set.id}
                className="relative overflow-hidden rounded-3xl bg-slate-900/90 border border-white/10 hover:border-indigo-500/40 transition-all duration-300 flex flex-col justify-between p-6 space-y-6 shadow-xl group hover:-translate-y-1"
              >
                {/* Level Accent Header Glow */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${color.gradient}`} />
                
                <div className="space-y-4">
                  {/* Title & Level Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className={`inline-block px-3 py-0.5 rounded-full text-xs font-bold ${color.bg} ${color.text} ${color.border} border`}>
                        {set.cefrLevel}
                      </span>
                      <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">
                        {set.title}
                      </h3>
                    </div>
                    <span className="text-xs font-bold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg border border-white/5 shrink-0">
                      {set.totalCards} words
                    </span>
                  </div>

                  <p className="text-sm text-slate-400 line-clamp-2">
                    {set.description || 'Cambridge / Oxford academic vocabulary set.'}
                  </p>

                  {/* Progress & Mastery Bar */}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-300">Mastery Level</span>
                      <span className="text-emerald-400 font-bold">{set.masteryPercentage}%</span>
                    </div>

                    {/* Segmented Bar */}
                    <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden flex p-0.5 border border-white/5">
                      {/* Mastered (Green) */}
                      {set.totalCards > 0 && (
                        <div 
                          className="bg-emerald-500 h-full rounded-l-full transition-all duration-500" 
                          style={{ width: `${(set.masteredCount / set.totalCards) * 100}%` }}
                          title={`Mastered: ${set.masteredCount}`}
                        />
                      )}
                      {/* Reviewing (Blue) */}
                      {set.totalCards > 0 && (
                        <div 
                          className="bg-blue-500 h-full transition-all duration-500" 
                          style={{ width: `${(set.reviewingCount / set.totalCards) * 100}%` }}
                          title={`Reviewing: ${set.reviewingCount}`}
                        />
                      )}
                      {/* Learning (Amber) */}
                      {set.totalCards > 0 && (
                        <div 
                          className="bg-amber-500 h-full transition-all duration-500" 
                          style={{ width: `${(set.learningCount / set.totalCards) * 100}%` }}
                          title={`Learning: ${set.learningCount}`}
                        />
                      )}
                    </div>

                    {/* Legend */}
                    <div className="grid grid-cols-4 gap-1 text-[11px] font-medium text-slate-400 pt-1">
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>{set.masteredCount} Mastered</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        <span>{set.reviewingCount} Reviewing</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <span>{set.learningCount} Learning</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-500">
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
                    onClick={() => {
                      setSelectedSet(set);
                      setModalStatusFilter('all');
                      setModalPosFilter('all');
                      setModalSearchQuery('');
                      setSortField('incorrectCount');
                      setSortOrder('desc');
                    }}
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

      {/* 5. Detailed Review Analytics Table Modal per Set */}
      {selectedSet && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-6xl max-h-[92vh] bg-slate-900 border border-indigo-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-white/10 bg-slate-950/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${LEVEL_COLORS[selectedSet.cefrLevel]?.bg || 'bg-indigo-500/10'} ${LEVEL_COLORS[selectedSet.cefrLevel]?.text || 'text-indigo-400'} border border-indigo-500/20`}>
                    {selectedSet.cefrLevel}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                    {selectedSet.title}
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-slate-400">
                  Detailed vocabulary review table and spaced repetition metrics ({selectedSet.totalCards} words total).
                </p>
              </div>

              <button
                onClick={() => setSelectedSet(null)}
                className="self-end sm:self-center p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                title="Close table"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Summary Metrics Bar */}
            <div className="p-4 bg-slate-950/30 border-b border-white/5 space-y-4 shrink-0">
              {/* Quick Stat Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-slate-900 border border-white/5">
                  <span className="text-slate-400 block text-[10px]">Total Words</span>
                  <span className="font-bold text-white text-sm">{selectedSet.totalCards}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900 border border-emerald-500/20">
                  <span className="text-emerald-400 block text-[10px]">Mastered</span>
                  <span className="font-bold text-emerald-400 text-sm">{selectedSet.masteredCount}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900 border border-blue-500/20">
                  <span className="text-blue-400 block text-[10px]">Reviewing</span>
                  <span className="font-bold text-blue-400 text-sm">{selectedSet.reviewingCount}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900 border border-amber-500/20">
                  <span className="text-amber-400 block text-[10px]">Learning</span>
                  <span className="font-bold text-amber-400 text-sm">{selectedSet.learningCount}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900 border border-rose-500/20">
                  <span className="text-rose-400 block text-[10px]">Weak Words</span>
                  <span className="font-bold text-rose-400 text-sm">{selectedSet.weakCount}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900 border border-white/5">
                  <span className="text-slate-400 block text-[10px]">Unstudied</span>
                  <span className="font-bold text-slate-400 text-sm">{selectedSet.unstudiedCount}</span>
                </div>
              </div>

              {/* Advanced Controls: Filters, Part of Speech & Sort Selector */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
                
                {/* Status Filters */}
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
                  <button
                    onClick={() => setModalStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                      modalStatusFilter === 'all'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    All ({selectedSet.totalCards})
                  </button>

                  <button
                    onClick={() => setModalStatusFilter('studied')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                      modalStatusFilter === 'studied'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Studied ({selectedSet.totalCards - selectedSet.unstudiedCount})
                  </button>

                  <button
                    onClick={() => setModalStatusFilter('mastered')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                      modalStatusFilter === 'mastered'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-emerald-400 hover:bg-slate-700'
                    }`}
                  >
                    Mastered ({selectedSet.masteredCount})
                  </button>

                  <button
                    onClick={() => setModalStatusFilter('weak')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                      modalStatusFilter === 'weak'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-amber-400 hover:bg-slate-700'
                    }`}
                  >
                    Weak ({selectedSet.weakCount})
                  </button>

                  <button
                    onClick={() => setModalStatusFilter('unstudied')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                      modalStatusFilter === 'unstudied'
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Unstudied ({selectedSet.unstudiedCount})
                  </button>
                </div>

                {/* Inputs: Search, POS & Sort Dropdowns */}
                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                  {/* Part of Speech Dropdown */}
                  {availablePartsOfSpeech.length > 0 && (
                    <div className="relative">
                      <select
                        value={modalPosFilter}
                        onChange={(e) => setModalPosFilter(e.target.value)}
                        className="px-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 appearance-none pr-8 cursor-pointer"
                      >
                        <option value="all">All POS</option>
                        {availablePartsOfSpeech.map(pos => (
                          <option key={pos} value={pos}>
                            {pos.charAt(0).toUpperCase() + pos.slice(1)}
                          </option>
                        ))}
                      </select>
                      <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  )}

                  {/* Sort Field Selector */}
                  <div className="relative">
                    <select
                      value={`${sortField}-${sortOrder}`}
                      onChange={(e) => {
                        const [field, order] = e.target.value.split('-') as [SortField, SortOrder];
                        setSortField(field);
                        setSortOrder(order);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 appearance-none pr-8 cursor-pointer font-medium"
                    >
                      <option value="term-asc">Sort: Term (A-Z)</option>
                      <option value="term-desc">Sort: Term (Z-A)</option>
                      <option value="accuracy-desc">Sort: Accuracy (High → Low)</option>
                      <option value="accuracy-asc">Sort: Accuracy (Low → High)</option>
                      <option value="totalReviews-desc">Sort: Most Reviewed</option>
                      <option value="totalReviews-asc">Sort: Least Reviewed</option>
                      <option value="incorrectCount-desc">Sort: Most Errors</option>
                      <option value="masteryLevel-desc">Sort: Highest Mastery</option>
                      <option value="nextReviewDate-asc">Sort: Soonest Review</option>
                    </select>
                    <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* Search Query */}
                  <div className="relative flex-1 sm:w-48">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text"
                      placeholder="Search term or definition..."
                      value={modalSearchQuery}
                      onChange={(e) => setModalSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Interactive Data Table */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {modalCards.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-sm bg-slate-950/40 rounded-2xl border border-white/5 space-y-2">
                  <Search className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="font-semibold text-slate-300">No vocabulary words match the selected filters.</p>
                  <p className="text-xs text-slate-500">Try adjusting your status filter, part of speech, or search term.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/40">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-white/10 tracking-wider">
                      <tr>
                        <th className="py-3.5 px-4 w-12 text-center">#</th>
                        
                        {/* Term Header */}
                        <th 
                          onClick={() => handleHeaderSort('term')}
                          className="py-3.5 px-4 min-w-[160px] cursor-pointer hover:text-white transition-colors group select-none"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>Vocabulary Term</span>
                            {renderSortIcon('term')}
                          </div>
                        </th>

                        <th className="py-3.5 px-4 min-w-[200px]">Definition</th>

                        {/* Status Header */}
                        <th 
                          onClick={() => handleHeaderSort('masteryLevel')}
                          className="py-3.5 px-4 min-w-[130px] cursor-pointer hover:text-white transition-colors group select-none"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>Status (SM-2)</span>
                            {renderSortIcon('masteryLevel')}
                          </div>
                        </th>

                        {/* Repetitions Header */}
                        <th 
                          onClick={() => handleHeaderSort('totalReviews')}
                          className="py-3.5 px-4 text-center min-w-[100px] cursor-pointer hover:text-white transition-colors group select-none"
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            <span>Repetitions</span>
                            {renderSortIcon('totalReviews')}
                          </div>
                        </th>

                        {/* Incorrect Header */}
                        <th 
                          onClick={() => handleHeaderSort('incorrectCount')}
                          className="py-3.5 px-4 text-center min-w-[100px] cursor-pointer hover:text-white transition-colors group select-none"
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            <span>Correct / Wrong</span>
                            {renderSortIcon('incorrectCount')}
                          </div>
                        </th>

                        {/* Accuracy Header */}
                        <th 
                          onClick={() => handleHeaderSort('accuracy')}
                          className="py-3.5 px-4 text-center min-w-[110px] cursor-pointer hover:text-white transition-colors group select-none"
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            <span>Accuracy Rate</span>
                            {renderSortIcon('accuracy')}
                          </div>
                        </th>

                        {/* Next Review Header */}
                        <th 
                          onClick={() => handleHeaderSort('nextReviewDate')}
                          className="py-3.5 px-4 text-center min-w-[130px] cursor-pointer hover:text-white transition-colors group select-none"
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            <span>Next Interval</span>
                            {renderSortIcon('nextReviewDate')}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-medium text-slate-200">
                      {modalCards.map((card, index) => {
                        let statusBadge = (
                          <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-slate-400 border border-white/5">
                            Unstudied
                          </span>
                        );
                        if (card.masteryLevel === 'mastered') {
                          statusBadge = (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              Mastered
                            </span>
                          );
                        } else if (card.masteryLevel === 'reviewing') {
                          statusBadge = (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                              Reviewing
                            </span>
                          );
                        } else if (card.masteryLevel === 'learning') {
                          statusBadge = (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                              Learning
                            </span>
                          );
                        }

                        const isWeak = (card.weaknessLevel >= 2) || (card.incorrectCount > 0 && card.incorrectCount >= card.correctCount);

                        return (
                          <tr 
                            key={card.id}
                            className={`hover:bg-slate-900/80 transition-colors ${
                              isWeak ? 'bg-amber-500/[0.03]' : ''
                            }`}
                          >
                            {/* Index */}
                            <td className="py-3 px-4 text-center text-slate-500 font-mono">
                              {index + 1}
                            </td>

                            {/* Term & Audio */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-white text-sm">
                                  {card.term}
                                </span>
                                {card.partOfSpeech && (
                                  <span className="text-[10px] italic text-slate-400 font-mono">
                                    ({card.partOfSpeech})
                                  </span>
                                )}
                                {card.audioUrl && (
                                  <button
                                    onClick={() => playAudio(card.audioUrl, card.id)}
                                    className="p-1 rounded bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition-colors"
                                    title="Listen to pronunciation"
                                  >
                                    <Volume2 className={`w-3.5 h-3.5 ${playingAudioId === card.id ? 'animate-bounce text-amber-400' : ''}`} />
                                  </button>
                                )}
                                {isWeak && (
                                  <span className="p-0.5 text-amber-400" title="Weak Word">
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                  </span>
                                )}
                              </div>
                              {card.phonetic && (
                                <div className="text-[11px] text-slate-400 font-mono">
                                  {card.phonetic}
                                </div>
                              )}
                            </td>

                            {/* Definition */}
                            <td className="py-3 px-4 text-slate-300 line-clamp-2">
                              {card.definition}
                            </td>

                            {/* Status */}
                            <td className="py-3 px-4">
                              {statusBadge}
                            </td>

                            {/* Repetitions */}
                            <td className="py-3 px-4 text-center font-bold text-slate-200">
                              {card.totalReviews} <span className="text-[10px] text-slate-500 font-normal">reviews</span>
                            </td>

                            {/* Correct / Incorrect */}
                            <td className="py-3 px-4 text-center">
                              {card.totalReviews > 0 ? (
                                <div className="inline-flex items-center gap-1.5 font-bold">
                                  <span className="text-emerald-400">+{card.correctCount}</span>
                                  <span className="text-slate-600">/</span>
                                  <span className="text-rose-400">-{card.incorrectCount}</span>
                                </div>
                              ) : (
                                <span className="text-slate-600">-</span>
                              )}
                            </td>

                            {/* Accuracy Rate */}
                            <td className="py-3 px-4 text-center font-bold">
                              {card.totalReviews > 0 ? (
                                <div className="space-y-1">
                                  <span className={card.accuracy >= 80 ? 'text-emerald-400' : card.accuracy >= 50 ? 'text-amber-400' : 'text-rose-400'}>
                                    {card.accuracy}%
                                  </span>
                                  <div className="w-12 mx-auto bg-slate-800 rounded-full h-1 overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full ${card.accuracy >= 80 ? 'bg-emerald-500' : card.accuracy >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                      style={{ width: `${card.accuracy}%` }}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-600">-</span>
                              )}
                            </td>

                            {/* Next Review Interval */}
                            <td className="py-3 px-4 text-center text-slate-400 text-[11px]">
                              {card.nextReviewDate ? (
                                <div>
                                  <div className="font-semibold text-slate-300">{card.nextReviewDate}</div>
                                  <div className="text-[10px] text-slate-500">Interval: {card.intervalDays}d</div>
                                </div>
                              ) : (
                                <span className="text-slate-600">Not scheduled</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
