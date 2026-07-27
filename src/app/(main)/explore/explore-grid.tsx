'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search, Layers, User, Play, Clock, BookOpen, FileText, Copy, Bookmark, Mic, Headphones, RefreshCw, Keyboard } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { saveSetToLibrary, unsaveSetFromLibrary } from '@/actions/collaboration';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ExploreGridProps {
  sets: any[];
  initialSavedSetIds?: string[];
}

export default function ExploreGrid({ sets, initialSavedSetIds = [] }: ExploreGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCefr, setSelectedCefr] = useState<string>('all');
  const [savedSets, setSavedSets] = useState<Set<string>>(new Set(initialSavedSetIds));
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const router = useRouter();

  const [selectedMode, setSelectedMode] = useState<{ id: string; name: string; href: string } | null>(null);
  const [isModeDialogOpen, setIsModeDialogOpen] = useState(false);
  const [dialogSearchQuery, setDialogSearchQuery] = useState('');

  const CEFR_LEVELS = ['all', 'A1', 'A2', 'B1', 'B2', 'C1'];

  const filteredSets = sets.filter(set => {
    const matchesSearch = set.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (set.description && set.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (selectedCefr === 'all') return matchesSearch;
    
    const titleLower = set.title.toLowerCase();
    const descLower = (set.description || '').toLowerCase();
    const target = selectedCefr.toLowerCase();

    return matchesSearch && (titleLower.includes(target) || descLower.includes(target));
  });

  const GAME_MODES: { id: string; name: string; desc: string; icon: any; href: string; bg: string; border: string; disabled?: boolean }[] = [
    { id: 'flashcards', name: 'Flashcards', desc: 'Review terms & definitions', icon: <Layers className="w-8 h-8 text-blue-400 group-hover:scale-110 transition-transform" />, href: '/flashcards', bg: 'from-blue-500/10 to-blue-600/5', border: 'border-blue-500/20 hover:border-blue-500/40' },
    { id: 'typing', name: 'Typing', desc: 'Master spelling & typing', icon: <Keyboard className="w-8 h-8 text-sky-400 group-hover:scale-110 transition-transform" />, href: '/typing', bg: 'from-sky-500/10 to-sky-600/5', border: 'border-sky-500/20 hover:border-sky-500/40' },
    { id: 'speaking', name: 'Speaking', desc: 'Train your pronunciation', icon: <Mic className="w-8 h-8 text-rose-400 group-hover:scale-110 transition-transform" />, href: '/speaking', bg: 'from-rose-500/10 to-rose-600/5', border: 'border-rose-500/20 hover:border-rose-500/40' },
    { id: 'listening', name: 'Listening', desc: 'Train your ears', icon: <Headphones className="w-8 h-8 text-amber-400 group-hover:scale-110 transition-transform" />, href: '/listening', bg: 'from-amber-500/10 to-amber-600/5', border: 'border-amber-500/20 hover:border-amber-500/40' },
    { id: 'test', name: 'Test', desc: 'Evaluate your knowledge', icon: <FileText className="w-8 h-8 text-indigo-400 group-hover:scale-110 transition-transform" />, href: '/test', bg: 'from-indigo-500/10 to-indigo-600/5', border: 'border-indigo-500/20 hover:border-indigo-500/40' },
    { id: 'match', name: 'Match', desc: 'Race against time', icon: <Copy className="w-8 h-8 text-cyan-400 group-hover:scale-110 transition-transform" />, href: '/match', bg: 'from-cyan-500/10 to-cyan-600/5', border: 'border-cyan-500/20 hover:border-cyan-500/40' },
  ];

  const handleToggleSave = async (e: React.MouseEvent, setId: string) => {
    e.preventDefault();
    e.stopPropagation(); // Ngăn Dialog bật lên
    if (isLoading === setId) return;

    const isSaved = savedSets.has(setId);
    
    // Optimistic UI update
    setSavedSets(prev => {
      const newSet = new Set(prev);
      if (isSaved) newSet.delete(setId);
      else newSet.add(setId);
      return newSet;
    });
    
    setIsLoading(setId);
    const res = isSaved ? await unsaveSetFromLibrary(setId) : await saveSetToLibrary(setId);
    
    if (res.error) {
      // Revert if error
      setSavedSets(prev => {
        const newSet = new Set(prev);
        if (isSaved) newSet.add(setId);
        else newSet.delete(setId);
        return newSet;
      });
      toast.error(res.error);
    } else {
      toast.success(isSaved ? "Removed from library" : "Saved to library");
    }
    setIsLoading(null);
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-6 sm:py-10 px-4 sm:px-6 font-sans">
      {/* Gamer Hero Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 sm:mb-12 gap-6 p-6 sm:p-8 rounded-3xl sm:rounded-[2.5rem] bg-gradient-to-r from-[#0c0d28]/95 via-[#0d0c2b]/85 to-[#130f3a]/90 backdrop-blur-2xl border border-[#b892ff]/30 shadow-[0_0_50px_rgba(66,85,255,0.18)] relative overflow-hidden group">
        
        {/* Background Cyberpunk Ambient Glows */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-[#4255ff]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#b892ff]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Left: Section Info */}
        <div className="relative z-10 space-y-2 min-w-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4255ff]/10 border border-[#4255ff]/30 text-[#9fa6ff] text-xs font-black uppercase tracking-wider">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#b892ff] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#b892ff]"></span>
            </span>
            Community Arena • {sets.length} Public Sets
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white drop-shadow-lg leading-tight">
            Explore Public <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9fa6ff] via-[#b892ff] to-[#ff92d0]">Sets</span>
          </h1>
          <p className="font-semibold text-sm sm:text-base text-slate-300 max-w-lg leading-relaxed">
            Discover community flashcard decks & level up your vocabulary skills.
          </p>
        </div>

        {/* Right: Search Input & CEFR Filter */}
        <div className="relative z-10 flex flex-col gap-3 w-full lg:w-auto shrink-0">
          {/* Search Box */}
          <div className="relative w-full lg:w-96">
            <Search className="h-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by title or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 sm:py-3 bg-[#07061d]/90 backdrop-blur-md border border-white/15 rounded-2xl text-white text-xs sm:text-sm placeholder:text-slate-500 focus:outline-none focus:border-[#b892ff]/60 focus:ring-1 focus:ring-[#b892ff]/30 transition-all shadow-inner"
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

          {/* CEFR Level Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0 mr-1">
              Level:
            </span>
            {CEFR_LEVELS.map(level => (
              <button
                key={level}
                onClick={() => setSelectedCefr(level)}
                className={`px-3 py-1 rounded-xl text-xs font-extrabold uppercase transition-all shrink-0 cursor-pointer ${
                  selectedCefr === level
                    ? 'bg-gradient-to-r from-[#4255ff] to-[#6d7bff] text-white shadow-[0_0_15px_rgba(66,85,255,0.4)] border border-[#b892ff]/40'
                    : 'bg-slate-900/80 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5'
                }`}
              >
                {level === 'all' ? 'All Sets' : level}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      {filteredSets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
          {filteredSets.map((set) => (
            <Dialog key={set.id}>
              <DialogTrigger 
                render={<div />}
                nativeButton={false}
                className="cursor-pointer group relative bg-[#0c0d28]/70 backdrop-blur-xl border border-white/10 hover:border-[#b892ff]/40 rounded-3xl p-5 sm:p-6 transition-all duration-300 hover:shadow-[0_0_30px_rgba(184,146,255,0.18)] hover:-translate-y-1 flex flex-col w-full text-left justify-between overflow-hidden"
              >
                {/* Ambient Card Background Glow */}
                <div className="absolute top-0 right-0 w-36 h-36 bg-[#b892ff]/10 rounded-full blur-3xl pointer-events-none group-hover:bg-[#b892ff]/20 transition-all" />

                <div className="relative z-10 flex-1">
                  {/* Top Row: Title + Bookmark */}
                  <div className="flex justify-between items-start gap-3 mb-2 w-full">
                    <h3 className="text-base sm:text-xl font-extrabold text-white group-hover:text-[#9fa6ff] transition-colors line-clamp-2 leading-snug">
                      {set.title}
                    </h3>
                    
                    <button 
                      onClick={(e) => handleToggleSave(e, set.id)}
                      disabled={isLoading === set.id}
                      className={`p-1.5 transition-all duration-300 rounded-xl hover:scale-110 shrink-0 ${
                        savedSets.has(set.id) 
                          ? 'text-amber-400 bg-amber-400/10 border border-amber-400/20' 
                          : 'text-slate-400 hover:text-white bg-white/5 border border-white/5'
                      }`}
                      title={savedSets.has(set.id) ? "Unsave set" : "Save set"}
                    >
                      <Bookmark className={`w-4 h-4 sm:w-5 sm:h-5 ${savedSets.has(set.id) ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  {/* Terms Count Tag */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="flex items-center gap-1 text-[10px] sm:text-xs font-mono font-extrabold text-[#9fa6ff] bg-[#4255ff]/15 border border-[#4255ff]/30 px-2.5 py-0.5 rounded-lg shrink-0">
                      {set.cards?.[0]?.count || 0} terms
                    </span>
                  </div>
                  
                  {set.description && (
                    <p className="text-slate-300 text-xs sm:text-sm line-clamp-2 mb-4 leading-relaxed">
                      {set.description}
                    </p>
                  )}
                </div>

                <div className="relative z-10 mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {set.author?.avatar_url ? (
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden relative shadow-sm border border-[#b892ff]/40 shrink-0">
                        <Image 
                          src={set.author.avatar_url} 
                          alt="Avatar" 
                          fill 
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center border border-white/20 shadow-sm shrink-0">
                        <span className="text-white text-xs font-bold uppercase">
                          {((set.author?.full_name || set.author?.email || (set.user_id ? 'Anonymous' : 'QuizFlash'))[0])}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex flex-col justify-center min-w-0">
                      <span className="text-xs sm:text-sm text-white font-bold truncate max-w-[120px] sm:max-w-[150px] leading-tight">
                        {set.author?.full_name || (set.author?.email ? set.author.email.split('@')[0] : (set.user_id ? 'Anonymous' : 'QuizFlash'))}
                      </span>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{formatDistanceToNow(new Date(set.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-r from-[#4255ff] to-[#6d7bff] flex items-center justify-center text-white shadow-[0_0_15px_rgba(66,85,255,0.4)] group-hover:scale-110 transition-transform pointer-events-none">
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>
              </DialogTrigger>

              <DialogContent className="sm:max-w-md bg-[#0c0d28] border border-[#b892ff]/30 text-white rounded-3xl p-5 sm:p-6 shadow-2xl">
                <DialogHeader className="mb-3">
                  <DialogTitle className="text-xl sm:text-2xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#9fa6ff] to-[#b892ff]">
                    🎮 Choose Practice Mode
                  </DialogTitle>
                </DialogHeader>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {GAME_MODES.map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => !mode.disabled && router.push(mode.href === '/learn' ? `/flashcards/${set.id}/learn` : `${mode.href}/${set.id}`)}
                      disabled={mode.disabled}
                      className={`group relative overflow-hidden bg-gradient-to-br ${mode.bg} backdrop-blur-xl border ${mode.border} ${mode.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-card/80 hover:-translate-y-1 cursor-pointer'} p-3.5 rounded-2xl transition-all duration-300 flex flex-col items-center justify-center text-center`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-950/60 border border-white/10 flex items-center justify-center mb-2 shadow-inner">
                        <div className="scale-75">
                          {mode.icon}
                        </div>
                      </div>
                      <h3 className="text-xs sm:text-sm font-bold text-white mb-0.5">{mode.name}</h3>
                      <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium leading-tight">{mode.desc}</p>
                    </button>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>
      ) : (
        <div className="w-full py-20 flex flex-col items-center justify-center text-center bg-[#0c0d28]/50 border border-white/10 rounded-3xl p-8">
          <div className="w-20 h-20 bg-slate-950/60 border border-white/10 rounded-full flex items-center justify-center mb-4 shadow-inner">
            <Search className="w-8 h-8 text-slate-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No flashcard sets found</h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm">We couldn't find any public sets matching "{searchQuery}". Try searching for another topic or clearing search.</p>
          <button 
            onClick={() => setSearchQuery('')}
            className="mt-5 px-5 py-2.5 bg-[#4255ff] hover:bg-[#4255ff]/80 text-white rounded-xl text-xs font-extrabold transition-colors cursor-pointer shadow-lg"
          >
            Clear Search Filter
          </button>
        </div>
      )}
    </div>
  );
}
