'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  AlertCircle 
} from 'lucide-react';
import { getSetDetailsAnalytics, OxfordSetAnalytics, OxfordWordStats } from '@/actions/oxford';

export type SortField = 'term' | 'accuracy' | 'totalReviews' | 'incorrectCount' | 'masteryLevel' | 'nextReviewDate';
export type SortOrder = 'asc' | 'desc';

interface SetAnalyticsModalProps {
  setId: string | null;
  onClose: () => void;
  targetUserId?: string;
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
    });

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
  }, [analytics, modalStatusFilter, modalPosFilter, modalSearchQuery, sortField, sortOrder]);

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
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-sans">
      <div className="relative w-full max-w-6xl max-h-[92vh] bg-slate-900 border border-indigo-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Loading State */}
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center space-y-4 text-center">
            <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Loading Set Vocabulary Analytics...</h3>
              <p className="text-xs text-slate-400">Fetching spaced repetition metrics & card performance</p>
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
            <div className="p-5 sm:p-6 border-b border-white/10 bg-slate-950/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${colorScheme?.bg || 'bg-indigo-500/10'} ${colorScheme?.text || 'text-indigo-400'} border ${colorScheme?.border || 'border-indigo-500/20'}`}>
                    {analytics.cefrLevel}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                    {analytics.title}
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-slate-400">
                  Detailed vocabulary review table and spaced repetition metrics ({analytics.totalCards} words total).
                </p>
              </div>

              <button
                onClick={onClose}
                className="self-end sm:self-center p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                title="Close table"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Summary Cards Inside Modal Header */}
            <div className="px-5 sm:px-6 pt-4 pb-2 bg-slate-950/30 border-b border-white/5 shrink-0 space-y-4">
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/5">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Words</div>
                  <div className="text-base font-bold text-white mt-0.5">{analytics.totalCards}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-emerald-500/20">
                  <div className="text-[10px] text-emerald-400 uppercase font-semibold">Mastered</div>
                  <div className="text-base font-bold text-emerald-400 mt-0.5">{analytics.masteredCount}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-cyan-500/20">
                  <div className="text-[10px] text-cyan-400 uppercase font-semibold">Reviewing</div>
                  <div className="text-base font-bold text-cyan-400 mt-0.5">{analytics.reviewingCount}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-amber-500/20">
                  <div className="text-[10px] text-amber-400 uppercase font-semibold">Learning</div>
                  <div className="text-base font-bold text-amber-400 mt-0.5">{analytics.learningCount}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-rose-500/20">
                  <div className="text-[10px] text-rose-400 uppercase font-semibold">Weak Words</div>
                  <div className="text-base font-bold text-rose-400 mt-0.5">{analytics.weakCount}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/50">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Unstudied</div>
                  <div className="text-base font-bold text-slate-300 mt-0.5">{analytics.unstudiedCount}</div>
                </div>
              </div>

              {/* Modal Filters & Control Tools */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2">
                
                {/* Status Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
                  <button
                    onClick={() => setModalStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                      modalStatusFilter === 'all'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    All ({analytics.totalCards})
                  </button>

                  <button
                    onClick={() => setModalStatusFilter('studied')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                      modalStatusFilter === 'studied'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-800 text-blue-400/80 hover:bg-slate-700'
                    }`}
                  >
                    Studied ({analytics.totalCards - analytics.unstudiedCount})
                  </button>

                  <button
                    onClick={() => setModalStatusFilter('mastered')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                      modalStatusFilter === 'mastered'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-emerald-400 hover:bg-slate-700'
                    }`}
                  >
                    Mastered ({analytics.masteredCount})
                  </button>

                  <button
                    onClick={() => setModalStatusFilter('weak')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                      modalStatusFilter === 'weak'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-amber-400 hover:bg-slate-700'
                    }`}
                  >
                    Weak ({analytics.weakCount})
                  </button>

                  <button
                    onClick={() => setModalStatusFilter('unstudied')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                      modalStatusFilter === 'unstudied'
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    Unstudied ({analytics.unstudiedCount})
                  </button>
                </div>

                {/* POS, Sorting, Search Controls */}
                <div className="flex items-center gap-2">
                  {/* Part of Speech Filter */}
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
                      <option value="incorrectCount-desc">Sort: Most Errors</option>
                      <option value="term-asc">Sort: Term (A-Z)</option>
                      <option value="term-desc">Sort: Term (Z-A)</option>
                      <option value="accuracy-desc">Sort: Accuracy (High → Low)</option>
                      <option value="accuracy-asc">Sort: Accuracy (Low → High)</option>
                      <option value="totalReviews-desc">Sort: Most Reviewed</option>
                      <option value="totalReviews-asc">Sort: Least Reviewed</option>
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
                                    className="p-1 rounded bg-slate-800 text-indigo-400 hover:text-indigo-300 hover:bg-slate-700 transition-colors"
                                    title="Listen pronunciation"
                                  >
                                    <Volume2 className={`w-3.5 h-3.5 ${playingAudioId === card.id ? 'animate-bounce text-indigo-300' : ''}`} />
                                  </button>
                                )}
                              </div>
                              {card.phonetic && (
                                <div className="text-[11px] text-slate-400 font-mono">
                                  {card.phonetic}
                                </div>
                              )}
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
              )}
            </div>

          </>
        )}

      </div>
    </div>
  );
}
