'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  X, Search, Volume2, Layers, BookOpen, Clock, 
  Sparkles, Filter, Check, Copy, Play, ArrowRight,
  Maximize2, Mic, Headphones, Keyboard, FileText, ChevronDown
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getSetCards } from '@/actions/study';
import { playAudio } from '@/lib/speech';
import { toast } from 'sonner';

export function getCefrBadge(title: string, description?: string) {
  const match = title.match(/\b(A1|A2|B1|B2|C1|C2)\b/i) || 
    (description ? description.match(/\b(A1|A2|B1|B2|C1|C2)\b/i) : null);
  
  if (!match) return null;
  const level = match[1].toUpperCase();

  const configs: Record<string, { label: string; bg: string; text: string; border: string }> = {
    'A1': { label: 'Level A1', bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/30' },
    'A2': { label: 'Level A2', bg: 'bg-teal-500/15', text: 'text-teal-300', border: 'border-teal-500/30' },
    'B1': { label: 'Level B1', bg: 'bg-cyan-500/15', text: 'text-cyan-300', border: 'border-cyan-500/30' },
    'B2': { label: 'Level B2', bg: 'bg-blue-500/15', text: 'text-blue-300', border: 'border-blue-500/30' },
    'C1': { label: 'Level C1', bg: 'bg-purple-500/15', text: 'text-purple-300', border: 'border-purple-500/30' },
    'C2': { label: 'Level C2', bg: 'bg-rose-500/15', text: 'text-rose-300', border: 'border-rose-500/30' },
  };

  return { level, ...(configs[level] || { label: `Level ${level}`, bg: 'bg-indigo-500/15', text: 'text-indigo-300', border: 'border-indigo-500/30' }) };
}

export interface SetWordsModalProps {
  setId: string | null;
  onClose: () => void;
  initialSetInfo?: {
    title?: string;
    description?: string;
    author?: any;
    totalCards?: number;
    created_at?: string;
  };
}

export default function SetWordsModal({ setId, onClose, initialSetInfo }: SetWordsModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [setData, setSetData] = useState<any>(initialSetInfo || null);
  const [cards, setCards] = useState<any[]>([]);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [posFilter, setPosFilter] = useState('all');
  const [accent, setAccent] = useState<'US' | 'UK'>('US');
  const [playingCardId, setPlayingCardId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showPlayMenu, setShowPlayMenu] = useState(false);

  const playMenuRef = useRef<HTMLDivElement>(null);

  // Fetch cards data when setId changes
  useEffect(() => {
    if (!setId) return;

    let isMounted = true;
    setLoading(true);
    setError(null);
    setSearchQuery('');
    setPosFilter('all');
    setShowPlayMenu(false);

    getSetCards(setId)
      .then((res) => {
        if (!isMounted) return;
        if (!res.success || !res.set) {
          setError(res.error || 'Failed to load vocabulary words for this set.');
        } else {
          setSetData(res.set);
          setCards(res.cards || []);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Error loading set words:', err);
        setError('An unexpected error occurred while loading words.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [setId]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedImage) {
          setSelectedImage(null);
        } else if (showPlayMenu) {
          setShowPlayMenu(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, selectedImage, showPlayMenu]);

  // Click outside play menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (playMenuRef.current && !playMenuRef.current.contains(e.target as Node)) {
        setShowPlayMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Extract all unique parts of speech
  const availablePosList = useMemo(() => {
    const posSet = new Set<string>();
    cards.forEach((c) => {
      if (c.part_of_speech) {
        posSet.add(c.part_of_speech.trim().toLowerCase());
      }
    });
    return Array.from(posSet).sort();
  }, [cards]);

  // Filtered Cards
  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      // 1. POS Filter
      if (posFilter !== 'all') {
        if (!card.part_of_speech || card.part_of_speech.toLowerCase() !== posFilter) {
          return false;
        }
      }

      // 2. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const termMatch = card.term?.toLowerCase().includes(q);
        const defMatch = card.definition?.toLowerCase().includes(q);
        const posMatch = card.part_of_speech?.toLowerCase().includes(q);
        const phoneticMatch = (card.phonetic || card.phonetic_uk)?.toLowerCase().includes(q);

        if (!termMatch && !defMatch && !posMatch && !phoneticMatch) {
          return false;
        }
      }

      return true;
    });
  }, [cards, posFilter, searchQuery]);

  const handlePlayAudio = (card: any, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setPlayingCardId(card.id);
    playAudio(card.audio_url, card.term, 1.0, accent);
    setTimeout(() => {
      setPlayingCardId(null);
    }, 1200);
  };

  const handleCopyList = () => {
    if (cards.length === 0) return;
    const textToCopy = cards
      .map((c, i) => `${i + 1}. ${c.term} ${c.part_of_speech ? `(${c.part_of_speech})` : ''}: ${c.definition}`)
      .join('\n');
    
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    toast.success(`Copied ${cards.length} terms to clipboard!`);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (!setId) return null;

  const cefrBadge = setData ? getCefrBadge(setData.title || '', setData.description) : null;
  const authorName = setData?.author?.full_name || 
    (setData?.author?.email ? setData.author.email.split('@')[0] : (setData?.user_id ? 'User' : 'QuizFlash'));

  const GAME_MODES = [
    { id: 'flashcards', name: 'Flashcards', desc: 'Review terms & definitions', icon: <Layers className="w-4 h-4 text-blue-400" />, href: `/flashcards/${setId}` },
    { id: 'typing', name: 'Typing', desc: 'Master spelling & typing', icon: <Keyboard className="w-4 h-4 text-sky-400" />, href: `/typing/${setId}` },
    { id: 'speaking', name: 'Speaking', desc: 'Train your pronunciation', icon: <Mic className="w-4 h-4 text-rose-400" />, href: `/speaking/${setId}` },
    { id: 'listening', name: 'Listening', desc: 'Train your ears', icon: <Headphones className="w-4 h-4 text-amber-400" />, href: `/listening/${setId}` },
    { id: 'test', name: 'Test', desc: 'Evaluate your knowledge', icon: <FileText className="w-4 h-4 text-indigo-400" />, href: `/test/${setId}` },
    { id: 'match', name: 'Match', desc: 'Race against time', icon: <Sparkles className="w-4 h-4 text-cyan-400" />, href: `/match/${setId}` },
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden font-sans animate-in fade-in duration-200">
      <div className="relative w-full h-[95vh] sm:h-[90vh] max-w-5xl bg-gradient-to-b from-[#0c0d28] via-[#0b0a26] to-[#07061d] border border-[#b892ff]/30 rounded-2xl sm:rounded-3xl shadow-[0_0_60px_rgba(66,85,255,0.25)] flex flex-col overflow-hidden text-white">
        
        {/* Background Ambient Glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#4255ff]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#b892ff]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative z-30 p-4 sm:p-6 border-b border-white/10 bg-[#07061d]/95 backdrop-blur-xl shrink-0 space-y-3 sm:space-y-4">
          
          {/* Top Row: Badges & Close Button */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#4255ff]/20 border border-[#4255ff]/40 text-[#9fa6ff] text-xs font-black uppercase tracking-wider shadow-sm">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Vocabulary Terms</span>
              </div>

              {cefrBadge && (
                <span className={`text-xs font-black uppercase px-2.5 py-0.5 rounded-xl border ${cefrBadge.bg} ${cefrBadge.text} ${cefrBadge.border} shadow-sm`}>
                  {cefrBadge.label}
                </span>
              )}

              <span className="flex items-center gap-1 text-xs font-mono font-extrabold text-[#9fa6ff] bg-[#4255ff]/15 border border-[#4255ff]/30 px-2.5 py-0.5 rounded-xl">
                <Layers className="w-3 h-3" />
                {cards.length > 0 ? `${cards.length} terms` : `${initialSetInfo?.totalCards || 0} terms`}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Copy list button */}
              {cards.length > 0 && (
                <button
                  onClick={handleCopyList}
                  className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  title="Copy all terms to clipboard"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{isCopied ? 'Copied' : 'Copy'}</span>
                </button>
              )}

              {/* Close Button */}
              <button
                onClick={onClose}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-white/10 hover:border-rose-500/30 flex items-center justify-center transition-all cursor-pointer active:scale-95"
                title="Close (Esc)"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Set Title & Actions Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#9fa6ff] via-[#b892ff] to-[#ff92d0] leading-tight truncate" title={setData?.title}>
                {setData?.title || 'Loading set...'}
              </h2>
              
              {setData?.description && (
                <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 mt-1 leading-relaxed font-medium">
                  {setData.description}
                </p>
              )}

              {/* Author & Meta */}
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  {setData?.author?.avatar_url ? (
                    <div className="w-4 h-4 rounded-full overflow-hidden relative border border-[#b892ff]/40 shrink-0">
                      <Image src={setData.author.avatar_url} alt="Avatar" fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                      {authorName[0]}
                    </div>
                  )}
                  <span className="font-semibold text-slate-300 truncate max-w-[150px]">
                    {authorName}
                  </span>
                </div>

                {setData?.created_at && (
                  <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>{formatDistanceToNow(new Date(setData.created_at), { addSuffix: true })}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Practice Mode Launcher Button */}
            <div className="relative shrink-0" ref={playMenuRef}>
              <button
                onClick={() => setShowPlayMenu(!showPlayMenu)}
                className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-[#4255ff] to-[#6d7bff] hover:from-[#5b6aff] hover:to-[#8a94ff] text-white font-black text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(66,85,255,0.4)] hover:shadow-[0_0_30px_rgba(66,85,255,0.6)] transition-all cursor-pointer active:scale-95 border border-white/20"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Start Practice</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showPlayMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Mode Dropdown Menu */}
              {showPlayMenu && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-[#0a0928] border border-[#b892ff]/50 rounded-2xl p-2 shadow-[0_20px_60px_rgba(0,0,0,0.95)] z-[120] animate-in fade-in zoom-in-95 duration-150 space-y-1">
                  <div className="px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Select Practice Mode:
                  </div>
                  {GAME_MODES.map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => {
                        setShowPlayMenu(false);
                        onClose();
                        router.push(mode.href);
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-xl bg-white/[0.03] hover:bg-[#4255ff]/25 text-left transition-colors group cursor-pointer border border-transparent hover:border-[#b892ff]/30"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center shrink-0">
                          {mode.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white group-hover:text-[#9fa6ff] transition-colors truncate">{mode.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">{mode.desc}</div>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="relative z-10 px-4 sm:px-6 py-3 bg-[#07061d]/80 border-b border-white/10 shrink-0 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by term, definition, or part of speech..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2 bg-[#0c0d28]/90 border border-white/15 rounded-xl text-white text-xs sm:text-sm placeholder:text-slate-500 focus:outline-none focus:border-[#b892ff]/60 focus:ring-1 focus:ring-[#b892ff]/30 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs bg-slate-800 rounded-full w-5 h-5 flex items-center justify-center transition-colors cursor-pointer"
                >
                  ×
                </button>
              )}
            </div>

            {/* Right Controls: Accent Selector & Counter */}
            <div className="flex items-center gap-2 shrink-0 justify-between sm:justify-end">
              {/* US / UK Accent Switcher */}
              <div className="inline-flex items-center p-0.5 bg-black/40 border border-white/10 rounded-xl">
                <button
                  onClick={() => setAccent('US')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    accent === 'US' 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="US Pronunciation"
                >
                  🇺🇸 US
                </button>
                <button
                  onClick={() => setAccent('UK')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    accent === 'UK' 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="UK Pronunciation"
                >
                  🇬🇧 UK
                </button>
              </div>

              {/* Showing Count */}
              <div className="text-[11px] font-mono font-bold text-slate-400">
                Showing <strong className="text-white">{filteredCards.length}</strong> of {cards.length} terms
              </div>
            </div>
          </div>

          {/* Part of Speech Filter Pills */}
          {availablePosList.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0 mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Part of speech:
              </span>
              <button
                onClick={() => setPosFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  posFilter === 'all'
                    ? 'bg-[#4255ff] text-white shadow-md'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5'
                }`}
              >
                All ({cards.length})
              </button>
              {availablePosList.map((pos) => {
                const count = cards.filter((c) => c.part_of_speech?.toLowerCase() === pos).length;
                return (
                  <button
                    key={pos}
                    onClick={() => setPosFilter(pos)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase transition-all shrink-0 cursor-pointer ${
                      posFilter === pos
                        ? 'bg-[#4255ff] text-white shadow-md'
                        : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5'
                    }`}
                  >
                    {pos} ({count})
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Word Cards List Body */}
        <div className="relative z-10 flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 custom-scrollbar">
          {loading ? (
            /* Loading Skeleton State */
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-pulse">
                  <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-white/10 shrink-0"></div>
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-32 bg-white/20 rounded-md"></div>
                        <div className="h-4 w-12 bg-white/10 rounded-md"></div>
                      </div>
                      <div className="h-4 w-48 bg-white/10 rounded-md"></div>
                    </div>
                  </div>
                  <div className="h-10 w-full sm:w-64 bg-white/10 rounded-xl"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            /* Error State */
            <div className="py-16 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                <X className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white">{error}</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Could not load vocabulary terms for this set. Please check your network connection or try again.
              </p>
            </div>
          ) : filteredCards.length === 0 ? (
            /* Empty State */
            <div className="py-16 text-center space-y-3 bg-white/[0.02] border border-white/5 rounded-3xl p-8">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 text-slate-400 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white">No matching terms found</h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xs mx-auto">
                No terms match "{searchQuery}". Try searching with another keyword or clear the filter.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setPosFilter('all');
                }}
                className="px-4 py-2 bg-[#4255ff] hover:bg-[#4255ff]/80 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Clear Search Filter
              </button>
            </div>
          ) : (
            /* Vocabulary Cards List */
            <div className="grid grid-cols-1 gap-3">
              {filteredCards.map((card, index) => {
                const isPlaying = playingCardId === card.id;

                return (
                  <div
                    key={card.id || index}
                    className="group relative bg-[#0a092d]/70 hover:bg-[#0e0d38]/90 border border-white/10 hover:border-[#b892ff]/40 rounded-2xl p-4 sm:p-5 transition-all duration-200 shadow-sm hover:shadow-[0_0_25px_rgba(184,146,255,0.15)] flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 overflow-hidden"
                  >
                    {/* Left Column: Index + Term + Pronunciation + Audio */}
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      {/* Index Badge */}
                      <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white/5 border border-white/10 text-[11px] sm:text-xs font-mono font-bold text-slate-400 flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>

                      {/* Main Vocabulary Info */}
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-base sm:text-lg font-black text-white group-hover:text-[#9fa6ff] transition-colors leading-snug">
                            {card.term}
                          </h4>

                          {/* Part of Speech Pill */}
                          {card.part_of_speech && (
                            <span className="text-[10px] sm:text-xs font-bold uppercase px-2 py-0.5 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                              {card.part_of_speech}
                            </span>
                          )}

                          {/* CEFR Level Pill */}
                          {card.cefr_level && (
                            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              {card.cefr_level}
                            </span>
                          )}

                          {/* Pronunciation Audio Button */}
                          <button
                            onClick={(e) => handlePlayAudio(card, e)}
                            className={`p-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                              isPlaying
                                ? 'bg-indigo-600 text-white border-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.6)] scale-105'
                                : 'bg-white/5 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-200 border-white/10'
                            }`}
                            title={`Listen to ${card.term} (${accent})`}
                          >
                            <Volume2 className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isPlaying ? 'animate-bounce' : ''}`} />
                            <span className="text-[10px] font-bold uppercase hidden sm:inline">{accent}</span>
                          </button>
                        </div>

                        {/* Phonetics Line */}
                        {(card.phonetic || card.phonetic_uk) && (
                          <div className="flex items-center gap-2.5 text-xs text-slate-400 font-mono flex-wrap">
                            {card.phonetic && (
                              <span className="flex items-center gap-1">
                                <span className="text-[10px]">🇺🇸</span>
                                <span className="text-slate-300">{card.phonetic}</span>
                              </span>
                            )}
                            {card.phonetic_uk && (
                              <span className="flex items-center gap-1">
                                <span className="text-[10px]">🇬🇧</span>
                                <span className="text-slate-300">{card.phonetic_uk}</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Column: Definition & Image Thumbnail */}
                    <div className="flex items-center justify-between md:justify-end gap-3 pl-10 md:pl-0 border-t md:border-t-0 border-white/5 pt-2.5 md:pt-0 flex-1 md:max-w-md">
                      {/* Definition */}
                      <div className="text-xs sm:text-sm font-medium text-slate-200 leading-relaxed min-w-0 flex-1 md:text-right">
                        {card.definition}
                      </div>

                      {/* Image Thumbnail if available */}
                      {card.image_url && (
                        <div 
                          onClick={() => setSelectedImage(card.image_url)}
                          className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden relative border border-white/15 shrink-0 cursor-pointer group/img hover:border-[#b892ff]/60 transition-all shadow-sm"
                          title="Click to enlarge image"
                        >
                          <Image
                            src={card.image_url}
                            alt={card.term}
                            fill
                            className="object-cover group-hover/img:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                            <Maximize2 className="w-3.5 h-3.5 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="relative z-10 p-3.5 sm:p-4 bg-[#07061d]/90 border-t border-white/10 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-400 font-medium text-center sm:text-left">
            💡 <span className="text-slate-300 font-semibold">Tip:</span> Click the speaker icon to listen to pronunciation. Switch between 🇺🇸 US and 🇬🇧 UK accents at the top.
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-bold transition-colors cursor-pointer active:scale-95"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                router.push(`/flashcards/${setId}`);
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#4255ff] to-[#6d7bff] hover:from-[#5b6aff] hover:to-[#8a94ff] text-white font-black transition-all cursor-pointer shadow-md flex items-center gap-1.5 active:scale-95"
            >
              <span>Study Flashcards</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* Image Full Preview Modal if clicked */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer animate-in fade-in duration-150"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-2xl max-h-[80vh] w-full h-full flex items-center justify-center">
            <Image
              src={selectedImage}
              alt="Preview"
              fill
              className="object-contain rounded-2xl"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-2 right-2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
