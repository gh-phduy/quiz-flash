'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, 
  Search, 
  Filter, 
  SlidersHorizontal, 
  Volume2, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Loader2, 
  AlertCircle,
  ChevronDown,
  Check
} from 'lucide-react';
import { getSetDetailsAnalytics, OxfordSetAnalytics, OxfordWordStats } from '@/actions/oxford';

export type SortField = 'term' | 'accuracy' | 'totalReviews' | 'incorrectCount' | 'masteryLevel' | 'nextReviewDate';
export type SortOrder = 'asc' | 'desc';

interface SetAnalyticsModalProps {
  setId: string | null;
  onClose: () => void;
  targetUserId?: string;
}

interface CustomSelectOption {
  label: string;
  value: string;
}

interface CustomSelectProps {
  value: string;
  options: CustomSelectOption[];
  onChange: (val: string) => void;
  icon?: React.ReactNode;
  className?: string;
  valueTextColor?: string;
}

function CustomSelect({ value, options, onChange, icon, className = "", valueTextColor }: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value) || options[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative inline-block ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="h-9 px-3 bg-slate-950/90 hover:bg-slate-900 border border-white/15 hover:border-indigo-500/40 rounded-xl flex items-center justify-between gap-2 text-xs transition-all shadow-sm cursor-pointer w-full text-left"
      >
        <div className="flex items-center gap-2 truncate">
          {icon}
          <span className={`font-semibold truncate ${valueTextColor || 'text-slate-200'}`}>
            {selectedOption?.label}
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180 text-indigo-400' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-max min-w-full max-h-60 overflow-y-auto bg-slate-900/95 backdrop-blur-xl border border-white/15 rounded-xl shadow-2xl z-[100] p-1 animate-in fade-in zoom-in-95 duration-150 scrollbar-none">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                  isSelected 
                    ? 'bg-indigo-600 text-white font-bold' 
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span>{opt.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-white" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const LEVEL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'A1': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  'A2': { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/30' },
  'B1': { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  'B2': { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30' },
  'B2 (Mở rộng)': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  'C1': { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
  'C2': { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/30' },
};

export default function SetAnalyticsModal({ setId, onClose, targetUserId }: SetAnalyticsModalProps) {
  const [analytics, setAnalytics] = useState<OxfordSetAnalytics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal Filtering & Searching State
  const [modalStatusFilter, setModalStatusFilter] = useState<'all' | 'studied' | 'mastered' | 'reviewing' | 'learning' | 'weak' | 'unstudied'>('all');
  const [modalPosFilter, setModalPosFilter] = useState<string>('all');
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [modalGameMode, setModalGameMode] = useState<string>('global');

  // Default Sort Order: Most Errors (incorrectCount-desc)
  const [sortField, setSortField] = useState<SortField>('incorrectCount');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Audio playback state
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  useEffect(() => {
    if (!setId) return;

    let isMounted = true;
    setLoading(true);
    setError(null);
    setModalStatusFilter('all');
    setModalPosFilter('all');
    setModalSearchQuery('');
    setSortField('incorrectCount');
    setSortOrder('desc');

    getSetDetailsAnalytics(setId, targetUserId)
      .then((data) => {
        if (!isMounted) return;
        if (!data) {
          setError('Failed to load set vocabulary details.');
        } else {
          setAnalytics(data);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Error fetching set analytics:', err);
        setError('An unexpected error occurred while loading set details.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [setId, targetUserId]);

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

  const availablePartsOfSpeech = useMemo(() => {
    if (!analytics) return [];
    const posSet = new Set<string>();
    analytics.allCards.forEach(c => {
      if (c.partOfSpeech) posSet.add(c.partOfSpeech.trim().toLowerCase());
    });
    return Array.from(posSet).sort();
  }, [analytics]);

  const posOptions = useMemo(() => [
    { label: 'All POS', value: 'all' },
    ...availablePartsOfSpeech.map(pos => ({
      label: pos.charAt(0).toUpperCase() + pos.slice(1),
      value: pos
    }))
  ], [availablePartsOfSpeech]);

  const gameModeOptions = [
    { label: 'Global Stats (Sum)', value: 'global' },
    { label: 'Flashcards Stats', value: 'flashcards' },
    { label: 'Typing Game Stats', value: 'typing' },
    { label: 'Match Game Stats', value: 'match' },
    { label: 'Test Game Stats', value: 'test' },
    { label: 'Listening Game Stats', value: 'listening' },
    { label: 'Speaking Game Stats', value: 'speaking' },
    { label: 'Review Mode Stats', value: 'review' }
  ];

  const sortOptions = [
    { label: 'Sort: Most Errors', value: 'incorrectCount-desc' },
    { label: 'Sort: Term (A-Z)', value: 'term-asc' },
    { label: 'Sort: Term (Z-A)', value: 'term-desc' },
    { label: 'Sort: Accuracy (High → Low)', value: 'accuracy-desc' },
    { label: 'Sort: Accuracy (Low → High)', value: 'accuracy-asc' },
    { label: 'Sort: Most Reviewed', value: 'totalReviews-desc' },
    { label: 'Sort: Least Reviewed', value: 'totalReviews-asc' },
    { label: 'Sort: Highest Mastery', value: 'masteryLevel-desc' },
    { label: 'Sort: Soonest Review', value: 'nextReviewDate-asc' }
  ];

  const modalCards = useMemo(() => {
    if (!analytics) return [];

    let result = analytics.allCards.filter(card => {
      if (modalStatusFilter === 'studied' && card.totalReviews === 0) return false;
      if (modalStatusFilter === 'mastered' && card.masteryLevel !== 'mastered') return false;
      if (modalStatusFilter === 'reviewing' && card.masteryLevel !== 'reviewing') return false;
      if (modalStatusFilter === 'learning' && card.masteryLevel !== 'learning') return false;
      if (modalStatusFilter === 'unstudied' && (card.masteryLevel !== 'new' && card.totalReviews > 0)) return false;
      if (modalStatusFilter === 'weak') {
        const isWeak = (card.weaknessLevel >= 2) || (card.incorrectCount > 0 && card.incorrectCount >= card.correctCount);
        if (!isWeak) return false;
      }

      if (modalPosFilter !== 'all') {
        if (!card.partOfSpeech || card.partOfSpeech.toLowerCase() !== modalPosFilter) return false;
      }

      if (modalSearchQuery) {
        const query = modalSearchQuery.toLowerCase();
        const termMatch = card.term.toLowerCase().includes(query);
        const defMatch = card.definition.toLowerCase().includes(query);
        const posMatch = card.partOfSpeech?.toLowerCase().includes(query);
        return termMatch || defMatch || Boolean(posMatch);
      }

      return true;
    }).map(card => {
      // Map card stats based on selected game mode
      if (modalGameMode === 'global') return card;
      
      const gameStats = card.modeStats?.[modalGameMode] || { total: 0, correct: 0 };
      const gameIncorrect = gameStats.total - gameStats.correct;
      const gameAccuracy = gameStats.total > 0 ? Math.round((gameStats.correct / gameStats.total) * 100) : 0;
      
      return {
        ...card,
        totalReviews: gameStats.total,
        correctCount: gameStats.correct,
        incorrectCount: gameIncorrect,
        accuracy: gameAccuracy
      };
    });

    result.sort((a, b) => {
      // For accuracy sorting, push N/A (totalReviews === 0) to the bottom
      if (sortField === 'accuracy') {
        const hasA = a.totalReviews > 0;
        const hasB = b.totalReviews > 0;
        if (!hasA && !hasB) return a.term.localeCompare(b.term); // both N/A, sort alphabetically
        if (!hasA) return 1;  // A is N/A, push to bottom
        if (!hasB) return -1; // B is N/A, push to bottom
        
        // both have reviews, sort by accuracy
        if (a.accuracy !== b.accuracy) {
          return sortOrder === 'asc' ? a.accuracy - b.accuracy : b.accuracy - a.accuracy;
        }
        return a.term.localeCompare(b.term);
      }

      let valA: any;
      let valB: any;

      switch (sortField) {
        case 'term':
          valA = a.term.toLowerCase();
          valB = b.term.toLowerCase();
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
  }, [analytics, modalStatusFilter, modalPosFilter, modalSearchQuery, sortField, sortOrder, modalGameMode]);

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

  if (!setId) return null;

  const colorScheme = analytics?.cefrLevel ? LEVEL_COLORS[analytics.cefrLevel] : LEVEL_COLORS['B2'];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-0 sm:p-6 overflow-hidden font-sans">
      <div className="relative w-full h-full sm:h-auto sm:max-w-6xl sm:max-h-[92vh] bg-slate-900 border-0 sm:border border-indigo-500/30 rounded-none sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Loading State Skeleton */}
        {loading ? (
          <div className="flex flex-col h-full overflow-hidden animate-in fade-in duration-200">
            {/* Header Skeleton */}
            <div className="p-4 sm:p-6 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl flex items-center justify-between gap-3 shrink-0">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-12 bg-indigo-500/20 rounded-full animate-pulse"></div>
                  <div className="h-3 w-16 bg-white/10 rounded-full animate-pulse"></div>
                </div>
                <div className="h-6 sm:h-7 w-3/4 max-w-xs bg-white/15 rounded-xl animate-pulse"></div>
              </div>

              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center shrink-0 border border-white/10 active:scale-95 cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics Skeleton */}
            <div className="px-3 sm:px-6 py-3 bg-slate-950/40 border-b border-white/5 shrink-0">
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="p-2 sm:p-2.5 rounded-xl bg-slate-900/80 border border-white/5 space-y-1.5 animate-pulse">
                    <div className="h-2.5 w-10 mx-auto bg-white/10 rounded"></div>
                    <div className="h-5 w-8 mx-auto bg-white/20 rounded-md"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Toolbar Skeleton */}
            <div className="px-3 sm:px-6 py-3 bg-slate-950/50 border-b border-white/10 shrink-0 space-y-3">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-7 w-20 bg-slate-900 rounded-xl border border-white/5 shrink-0 animate-pulse"></div>
                ))}
              </div>
              <div className="h-10 w-full bg-slate-900/90 border border-white/15 rounded-2xl animate-pulse"></div>
            </div>

            {/* Content List Skeleton */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 scrollbar-none">
              {/* Mobile Skeleton Cards */}
              <div className="md:hidden flex flex-col gap-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex flex-col bg-[#0a092d]/70 backdrop-blur-xl border border-white/10 rounded-2xl p-4 gap-3 animate-pulse">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-8 bg-[#4255ff]/30 rounded-md"></div>
                        <div className="h-5 w-28 bg-white/20 rounded-md"></div>
                      </div>
                      <div className="h-5 w-16 bg-emerald-500/20 rounded-full"></div>
                    </div>
                    <div className="h-4 w-32 bg-indigo-500/20 rounded-lg"></div>
                    <div className="h-12 w-full bg-slate-950/50 rounded-xl border border-white/5 p-2 space-y-1.5">
                      <div className="h-3 w-full bg-white/10 rounded"></div>
                      <div className="h-3 w-2/3 bg-white/10 rounded"></div>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[...Array(4)].map((_, j) => (
                        <div key={j} className="h-10 bg-slate-950/60 rounded-xl border border-white/5"></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Skeleton Table */}
              <div className="hidden md:flex flex-col space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-14 w-full bg-slate-950/40 rounded-2xl border border-white/5 animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>
        ) : error || !analytics ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-4 text-center">
            <AlertCircle className="w-10 h-10 text-rose-400" />
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">{error || 'Failed to load details'}</h3>
              <p className="text-xs text-slate-400">Please try again or close this inspector.</p>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-700 transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl flex items-center justify-between gap-3 shrink-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold ${colorScheme?.bg || 'bg-indigo-500/10'} ${colorScheme?.text || 'text-indigo-400'} border ${colorScheme?.border || 'border-indigo-500/20'}`}>
                    {analytics.cefrLevel}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">{analytics.totalCards} words</span>
                </div>
                <h2 className="text-lg sm:text-2xl font-extrabold text-white truncate leading-snug">
                  {analytics.title}
                </h2>
              </div>

              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all shrink-0 cursor-pointer border border-white/10 active:scale-95"
                title="Close table"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Summary Cards Inside Modal Header */}
            <div className="px-3 sm:px-6 pt-3 pb-3 bg-slate-950/40 border-b border-white/5 shrink-0">
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
                <div className="p-2 sm:p-2.5 rounded-xl bg-slate-900/80 border border-white/5">
                  <div className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-semibold">Total</div>
                  <div className="text-sm sm:text-base font-bold text-white mt-0.5">{analytics.totalCards}</div>
                </div>
                <div className="p-2 sm:p-2.5 rounded-xl bg-slate-900/80 border border-emerald-500/20">
                  <div className="text-[9px] sm:text-[10px] text-emerald-400 uppercase font-semibold">Mastered</div>
                  <div className="text-sm sm:text-base font-bold text-emerald-400 mt-0.5">{analytics.masteredCount}</div>
                </div>
                <div className="p-2 sm:p-2.5 rounded-xl bg-slate-900/80 border border-cyan-500/20">
                  <div className="text-[9px] sm:text-[10px] text-cyan-400 uppercase font-semibold">Reviewing</div>
                  <div className="text-sm sm:text-base font-bold text-cyan-400 mt-0.5">{analytics.reviewingCount}</div>
                </div>
                <div className="p-2 sm:p-2.5 rounded-xl bg-slate-900/80 border border-amber-500/20">
                  <div className="text-[9px] sm:text-[10px] text-amber-400 uppercase font-semibold">Learning</div>
                  <div className="text-sm sm:text-base font-bold text-amber-400 mt-0.5">{analytics.learningCount}</div>
                </div>
                <div className="p-2 sm:p-2.5 rounded-xl bg-slate-900/80 border border-rose-500/20">
                  <div className="text-[9px] sm:text-[10px] text-rose-400 uppercase font-semibold">Weak</div>
                  <div className="text-sm sm:text-base font-bold text-rose-400 mt-0.5">{analytics.weakCount}</div>
                </div>
                <div className="p-2 sm:p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/50">
                  <div className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-semibold">Unstudied</div>
                  <div className="text-sm sm:text-base font-bold text-slate-300 mt-0.5">{analytics.unstudiedCount}</div>
                </div>
              </div>
            </div>

            {/* Control Toolbar */}
            <div className="px-3 sm:px-6 py-3 bg-slate-950/50 border-b border-white/10 shrink-0 space-y-3">
              
              {/* Row 1: Status Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 shrink-0">
                <button
                  onClick={() => setModalStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                    modalStatusFilter === 'all'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-900/80 text-slate-400 border border-white/5 hover:text-white'
                  }`}
                >
                  All ({analytics.totalCards})
                </button>

                <button
                  onClick={() => setModalStatusFilter('studied')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                    modalStatusFilter === 'studied'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'bg-slate-900/80 text-blue-400/80 border border-white/5 hover:text-white'
                  }`}
                >
                  Studied ({analytics.totalCards - analytics.unstudiedCount})
                </button>

                <button
                  onClick={() => setModalStatusFilter('mastered')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                    modalStatusFilter === 'mastered'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                      : 'bg-slate-900/80 text-emerald-400 border border-white/5 hover:text-white'
                  }`}
                >
                  Mastered ({analytics.masteredCount})
                </button>

                <button
                  onClick={() => setModalStatusFilter('weak')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                    modalStatusFilter === 'weak'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                      : 'bg-slate-900/80 text-amber-400 border border-white/5 hover:text-white'
                  }`}
                >
                  Weak ({analytics.weakCount})
                </button>

                <button
                  onClick={() => setModalStatusFilter('unstudied')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                    modalStatusFilter === 'unstudied'
                      ? 'bg-slate-700 text-white shadow-md'
                      : 'bg-slate-900/80 text-slate-400 border border-white/5 hover:text-white'
                  }`}
                >
                  Unstudied ({analytics.unstudiedCount})
                </button>
              </div>

              {/* Row 2: Select Dropdowns */}
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
                {/* POS */}
                {availablePartsOfSpeech.length > 0 && (
                  <CustomSelect 
                    value={modalPosFilter}
                    options={posOptions}
                    onChange={setModalPosFilter}
                    icon={<Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                    className="w-full sm:w-auto"
                  />
                )}

                {/* Game Mode */}
                <CustomSelect 
                  value={modalGameMode}
                  options={gameModeOptions}
                  onChange={setModalGameMode}
                  icon={<SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  valueTextColor="text-emerald-400 font-bold"
                  className="w-full sm:w-auto"
                />

                {/* Sort */}
                <CustomSelect 
                  value={`${sortField}-${sortOrder}`}
                  options={sortOptions}
                  onChange={(val) => {
                    const [field, order] = val.split('-') as [SortField, SortOrder];
                    setSortField(field);
                    setSortOrder(order);
                  }}
                  icon={<SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                  className="w-full sm:w-auto col-span-2 sm:col-span-1"
                />
              </div>

              {/* Row 3: Dedicated Search Bar */}
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input 
                  type="text"
                  placeholder="Search vocabulary term or definition..."
                  value={modalSearchQuery}
                  onChange={(e) => setModalSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-8 h-10 rounded-2xl bg-slate-900/90 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all shadow-inner"
                />
                {modalSearchQuery && (
                  <button 
                    onClick={() => setModalSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs bg-slate-800 rounded-full w-5 h-5 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    ×
                  </button>
                )}
              </div>

            </div>

            {/* Modal Interactive Data Table */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4">
              {modalCards.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-sm bg-slate-950/40 rounded-2xl border border-white/5 space-y-2">
                  <Search className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="font-semibold text-slate-300">No vocabulary words match the selected filters.</p>
                  <p className="text-xs text-slate-500">Try adjusting your status filter, part of speech, or search term.</p>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/40">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-white/10 tracking-wider">
                      <tr>
                        <th className="py-3.5 px-4 w-12 text-center">#</th>
                        
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

                        <th 
                          onClick={() => handleHeaderSort('masteryLevel')}
                          className="py-3.5 px-4 min-w-[130px] cursor-pointer hover:text-white transition-colors group select-none"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>Status (SM-2)</span>
                            {renderSortIcon('masteryLevel')}
                          </div>
                        </th>

                        <th 
                          onClick={() => handleHeaderSort('totalReviews')}
                          className="py-3.5 px-4 text-center min-w-[100px] cursor-pointer hover:text-white transition-colors group select-none"
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            <span>Repetitions</span>
                            {renderSortIcon('totalReviews')}
                          </div>
                        </th>

                        <th 
                          onClick={() => handleHeaderSort('incorrectCount')}
                          className="py-3.5 px-4 text-center min-w-[100px] cursor-pointer hover:text-white transition-colors group select-none"
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            <span>Correct / Wrong</span>
                            {renderSortIcon('incorrectCount')}
                          </div>
                        </th>

                        <th 
                          onClick={() => handleHeaderSort('accuracy')}
                          className="py-3.5 px-4 text-center min-w-[110px] cursor-pointer hover:text-white transition-colors group select-none"
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            <span>Accuracy Rate</span>
                            {renderSortIcon('accuracy')}
                          </div>
                        </th>

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
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                              Reviewing
                            </span>
                          );
                        } else if (card.masteryLevel === 'learning' || card.totalReviews > 0) {
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
                            className={`hover:bg-slate-800/40 transition-colors ${
                              isWeak ? 'bg-amber-500/[0.03]' : ''
                            }`}
                          >
                            <td className="py-3 px-4 text-center text-slate-500 text-[11px]">
                              {index + 1}
                            </td>

                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-white">
                                  {card.term}
                                </span>
                                {card.partOfSpeech && (
                                  <span className="text-[10px] italic text-slate-400 font-serif">
                                    ({card.partOfSpeech})
                                  </span>
                                )}
                                {card.audioUrl && (
                                  <button
                                    onClick={() => playAudio(card.audioUrl, card.id)}
                                    className="p-1 rounded bg-slate-800 text-indigo-400 hover:text-indigo-300 hover:bg-slate-700 transition-colors cursor-pointer"
                                    title="Listen pronunciation"
                                  >
                                    <Volume2 className={`w-3.5 h-3.5 ${playingAudioId === card.id ? 'animate-bounce text-indigo-300' : ''}`} />
                                  </button>
                                )}
                              </div>
                              {card.phonetic || card.phoneticUk ? (
                                <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono flex-wrap mt-0.5">
                                  {card.phonetic && <span>🇺🇸 {card.phonetic}</span>}
                                  {card.phoneticUk && <span>🇬🇧 {card.phoneticUk}</span>}
                                </div>
                              ) : null}
                            </td>

                            <td className="py-3 px-4 text-slate-300 max-w-xs font-normal">
                              {card.definition}
                            </td>

                            <td className="py-3 px-4">
                              {statusBadge}
                            </td>

                            <td className="py-3 px-4 text-center">
                              <span className="font-bold text-slate-300">
                                {card.totalReviews}
                              </span>
                              <span className="text-[10px] text-slate-500 block">reviews</span>
                            </td>

                            <td className="py-3 px-4 text-center">
                              <div className="inline-flex items-center gap-1.5 font-bold">
                                <span className="text-emerald-400">+{card.correctCount}</span>
                                <span className="text-slate-600">/</span>
                                <span className="text-rose-400">-{card.incorrectCount}</span>
                              </div>
                            </td>

                            <td className="py-3 px-4 text-center">
                              <div className="space-y-1">
                                <span className={`font-bold ${
                                  card.totalReviews === 0 ? 'text-slate-500' :
                                  card.accuracy >= 80 ? 'text-emerald-400' :
                                  card.accuracy >= 60 ? 'text-amber-400' : 'text-rose-400'
                                }`}>
                                  {card.totalReviews > 0 ? `${card.accuracy}%` : 'N/A'}
                                </span>
                                {card.totalReviews > 0 && (
                                  <div className="w-12 mx-auto bg-slate-800 rounded-full h-1 overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full ${
                                        card.accuracy >= 80 ? 'bg-emerald-400' :
                                        card.accuracy >= 60 ? 'bg-amber-400' : 'bg-rose-400'
                                      }`}
                                      style={{ width: `${card.accuracy}%` }}
                                    />
                                  </div>
                                )}
                              </div>
                            </td>

                            <td className="py-3 px-4 text-center text-slate-400 text-[11px]">
                              {card.nextReviewDate ? (
                                <div>
                                  <span className="text-slate-300 font-semibold block">{card.nextReviewDate}</span>
                                  <span className="text-[10px] text-slate-500 block">Interval: {card.intervalDays}d</span>
                                </div>
                              ) : (
                                <span className="text-slate-600">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden flex flex-col gap-3 pb-8">
                    {modalCards.map((card, index) => {
                      let statusBadge = (
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-white/5">
                          Unstudied
                        </span>
                      );
                      if (card.masteryLevel === 'mastered') {
                        statusBadge = (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            Mastered
                          </span>
                        );
                      } else if (card.masteryLevel === 'reviewing') {
                        statusBadge = (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                            Reviewing
                          </span>
                        );
                      } else if (card.masteryLevel === 'learning' || card.totalReviews > 0) {
                        statusBadge = (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            Learning
                          </span>
                        );
                      }

                      const isWeak = (card.weaknessLevel >= 2) || (card.incorrectCount > 0 && card.incorrectCount >= card.correctCount);

                      return (
                        <div key={card.id} className={`flex flex-col bg-[#0a092d]/70 backdrop-blur-xl border ${isWeak ? 'border-amber-500/40' : 'border-white/10'} rounded-2xl p-4 gap-3 shadow-xl relative overflow-hidden active:scale-[0.99] transition-all`}>
                          {/* Card Top Bar: Index + Term + Audio + Status */}
                          <div className="flex items-start justify-between gap-2.5">
                            <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-[#4255ff]/20 text-[#9fa6ff] border border-[#4255ff]/30 shrink-0">
                                #{index + 1}
                              </span>
                              <span className="font-extrabold text-white text-base truncate">{card.term}</span>
                              {card.partOfSpeech && (
                                <span className="text-[11px] italic text-slate-400 font-serif shrink-0">({card.partOfSpeech})</span>
                              )}
                              {card.audioUrl && (
                                <button
                                  onClick={() => playAudio(card.audioUrl, card.id)}
                                  className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/30 transition-colors shrink-0 cursor-pointer active:scale-95"
                                  title="Play audio"
                                >
                                  <Volume2 className={`w-3.5 h-3.5 ${playingAudioId === card.id ? 'animate-bounce text-white' : ''}`} />
                                </button>
                              )}
                            </div>
                            <div className="shrink-0">{statusBadge}</div>
                          </div>

                          {/* Phonetics Bar */}
                          {(card.phonetic || card.phoneticUk) && (
                            <div className="flex items-center gap-2 text-[11px] text-[#9fa6ff] font-mono flex-wrap bg-white/5 px-2.5 py-1 rounded-xl border border-white/5">
                              {card.phonetic && <span>🇺🇸 {card.phonetic}</span>}
                              {card.phoneticUk && <span>🇬🇧 {card.phoneticUk}</span>}
                            </div>
                          )}

                          {/* Definition */}
                          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-white/5 font-medium">
                            {card.definition}
                          </p>

                          {/* Stats Grid: Exact 4 Columns */}
                          <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] sm:text-[11px]">
                            <div className="bg-slate-950/60 rounded-xl py-2 px-1 flex flex-col items-center justify-center border border-white/5">
                              <span className="text-slate-500 mb-0.5 text-[9px] uppercase font-semibold">Reviews</span>
                              <span className="font-bold text-white">{card.totalReviews}</span>
                            </div>
                            <div className="bg-slate-950/60 rounded-xl py-2 px-1 flex flex-col items-center justify-center border border-white/5">
                              <span className="text-slate-500 mb-0.5 text-[9px] uppercase font-semibold">Acc</span>
                              <span className={`font-bold ${card.totalReviews === 0 ? 'text-slate-500' : card.accuracy >= 80 ? 'text-emerald-400' : card.accuracy >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
                                {card.totalReviews > 0 ? `${card.accuracy}%` : '-'}
                              </span>
                            </div>
                            <div className="bg-[#0a092d]/60 rounded-xl py-2 px-1 flex flex-col items-center justify-center border border-white/5">
                              <span className="text-slate-500 mb-0.5 text-[9px] uppercase font-semibold">C / W</span>
                              <div className="font-bold flex items-center justify-center gap-0.5">
                                <span className="text-emerald-400">+{card.correctCount}</span>
                                <span className="text-slate-600">/</span>
                                <span className="text-rose-400">-{card.incorrectCount}</span>
                              </div>
                            </div>
                            <div className="bg-slate-950/60 rounded-xl py-2 px-1 flex flex-col items-center justify-center border border-white/5">
                              <span className="text-slate-500 mb-0.5 text-[9px] uppercase font-semibold">Due</span>
                              <span className="font-bold text-slate-300 truncate max-w-full">{card.nextReviewDate ? card.nextReviewDate : '-'}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

          </>
        )}

      </div>
    </div>
  );
}
