'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import {
  Search, Layers, Play, Clock, BookOpen, FileText, Copy, Bookmark,
  Plus, Users, Flame, Star, RefreshCw, Trophy, Mic, Headphones
} from 'lucide-react';
import { saveSetToLibrary, unsaveSetFromLibrary } from '@/actions/collaboration';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface HomeDashboardProps {
  user: any;
  profile: any;
  sets: any[];
  savedSets: any[];
  initialSavedSetIds: string[];
  suggestedPublicSets?: any[];
  dueCount?: number;
}

export default function HomeDashboard({ user, profile, sets, savedSets, initialSavedSetIds, suggestedPublicSets = [], dueCount = 0 }: HomeDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'created' | 'saved'>('created');
  const [savedSetIds, setSavedSetIds] = useState<Set<string>>(new Set(initialSavedSetIds));
  const [isLoading, setIsLoading] = useState<string | null>(null);

  // Mode Selection State
  const [selectedMode, setSelectedMode] = useState<{ id: string; name: string; href: string } | null>(null);
  const [isModeDialogOpen, setIsModeDialogOpen] = useState(false);
  const [dialogSearchQuery, setDialogSearchQuery] = useState('');

  const GAME_MODES: { id: string; name: string; desc: string; icon: any; href: string; bg: string; border: string; disabled?: boolean }[] = [
    { id: 'flashcards', name: 'Flashcards', desc: 'Review terms & definitions', icon: <Layers className="w-8 h-8 text-blue-400 group-hover:scale-110 transition-transform" />, href: '/flashcards', bg: 'from-blue-500/10 to-blue-600/5', border: 'border-blue-500/20 hover:border-blue-500/40' },
    { id: 'speaking', name: 'Speaking', desc: 'Train your pronunciation', icon: <Mic className="w-8 h-8 text-rose-400 group-hover:scale-110 transition-transform" />, href: '/speaking', bg: 'from-rose-500/10 to-rose-600/5', border: 'border-rose-500/20 hover:border-rose-500/40' },
    { id: 'listening', name: 'Listening', desc: 'Train your ears', icon: <Headphones className="w-8 h-8 text-amber-400 group-hover:scale-110 transition-transform" />, href: '/listening', bg: 'from-amber-500/10 to-amber-600/5', border: 'border-amber-500/20 hover:border-amber-500/40' },
    { id: 'test', name: 'Test', desc: 'Evaluate your knowledge', icon: <FileText className="w-8 h-8 text-indigo-400 group-hover:scale-110 transition-transform" />, href: '/test', bg: 'from-indigo-500/10 to-indigo-600/5', border: 'border-indigo-500/20 hover:border-indigo-500/40' },
    { id: 'match', name: 'Match', desc: 'Race against time', icon: <Copy className="w-8 h-8 text-cyan-400 group-hover:scale-110 transition-transform" />, href: '/match', bg: 'from-cyan-500/10 to-cyan-600/5', border: 'border-cyan-500/20 hover:border-cyan-500/40' },
  ];

  const handleModeClick = (mode: { id: string; name: string; href: string }) => {
    setSelectedMode(mode);
    setDialogSearchQuery('');
    setIsModeDialogOpen(true);
  };

  const handleSetClickForMode = (setId: string) => {
    if (!selectedMode) return;
    setIsModeDialogOpen(false);
    
    const basePath = selectedMode.href.startsWith('/') ? selectedMode.href : `/${selectedMode.href}`;
    router.push(`${basePath}/${setId}`);
  };

  const activeSavedSets = savedSets.filter(s => savedSetIds.has(s.id));
  const newlySavedSets = (suggestedPublicSets || []).filter(s => savedSetIds.has(s.id) && !activeSavedSets.find(as => as.id === s.id));
  const currentSavedSets = [...activeSavedSets, ...newlySavedSets];

  const displayedSets = activeTab === 'created' ? sets : currentSavedSets;

  const allDialogSets = [...sets, ...currentSavedSets].filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);
  const filteredDialogSets = allDialogSets.filter(set => 
    set.title.toLowerCase().includes(dialogSearchQuery.toLowerCase()) || 
    set.description?.toLowerCase().includes(dialogSearchQuery.toLowerCase())
  );
  
  const filteredSuggestedSets = (suggestedPublicSets || []).filter(set => 
    set.title.toLowerCase().includes(dialogSearchQuery.toLowerCase()) || 
    set.description?.toLowerCase().includes(dialogSearchQuery.toLowerCase())
  );

  const displayName = profile?.full_name || profile?.email?.split('@')[0] || user?.user_metadata?.full_name || 'Student';

  const handleToggleSave = async (e: React.MouseEvent, setId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLoading === setId) return;

    const isSaved = savedSetIds.has(setId);
    
    setSavedSetIds(prev => {
      const newSet = new Set(prev);
      if (isSaved) newSet.delete(setId);
      else newSet.add(setId);
      return newSet;
    });
    
    setIsLoading(setId);
    const res = isSaved ? await unsaveSetFromLibrary(setId) : await saveSetToLibrary(setId);
    
    if (res.error) {
      setSavedSetIds(prev => {
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
    <div className="w-full max-w-7xl mx-auto py-10 px-6 font-sans">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#9fa6ff] to-[#b892ff] mb-3 drop-shadow-sm">
            Welcome back, {displayName}! 👋
          </h1>
          <p className="text-muted-foreground font-medium text-lg">
            Ready to conquer your next learning goal?
          </p>
        </div>
        
        {/* Current Rank */}
        <div className="flex flex-col items-start md:items-end justify-end">
          <span className="text-xs text-muted-foreground font-bold tracking-[0.2em] uppercase mb-1 drop-shadow-sm">Current Rank</span>
          <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#9fa6ff] via-[#b892ff] to-[#ff92d0] drop-shadow-[0_0_20px_rgba(184,146,255,0.4)] uppercase tracking-tight">
            {profile?.current_rank || 'Iron'}
          </h2>
        </div>
      </div>
      
      {/* Daily Review Banner */}
      {dueCount > 0 && (
        <div className="mb-12 relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-[#9fa6ff]/20 to-[#b892ff]/20 border border-[#b892ff]/30 p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 group">
          <div className="absolute inset-0 bg-gradient-to-r from-[#9fa6ff]/10 to-[#b892ff]/10 mix-blend-overlay group-hover:opacity-70 transition-opacity"></div>
          <div className="relative z-10">
            <h2 className="text-3xl font-extrabold text-white mb-2 flex items-center gap-3">
              <Flame className="w-8 h-8 text-[#ff92d0]" />
              Time to review!
            </h2>
            <p className="text-lg text-white/80 font-medium">
              You have <strong className="text-[#ff92d0] text-xl mx-1">{dueCount}</strong> cards due for review today to maintain your memory.
            </p>
          </div>
          <Link 
            href="/review"
            className="relative z-10 shrink-0 px-8 py-4 bg-gradient-to-r from-[#ff92d0] to-[#b892ff] text-white rounded-2xl font-bold text-lg hover:scale-105 hover:shadow-[0_0_30px_rgba(255,146,208,0.5)] transition-all shadow-lg"
          >
            Review Now
          </Link>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
        <Link 
          href="/create-set"
          className="group relative overflow-hidden bg-gradient-to-br from-[#4255ff] to-[#6d7bff] hover:from-[#5b6aff] hover:to-[#8a94ff] p-6 rounded-3xl transition-all duration-300 shadow-[0_0_30px_rgba(66,85,255,0.3)] hover:shadow-[0_0_40px_rgba(66,85,255,0.5)] hover:-translate-y-1 flex items-center justify-between"
        >
          <div className="relative z-10">
            <h3 className="text-2xl font-bold text-white mb-1">Create new set</h3>
            <p className="text-white/80 font-medium">Build your own custom flashcards</p>
          </div>
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center shrink-0 backdrop-blur-md relative z-10 group-hover:scale-110 transition-transform">
            <Plus className="w-8 h-8 text-white" />
          </div>
          {/* Decorative shapes */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        </Link>
        
        <button 
          className="group relative overflow-hidden bg-card/60 backdrop-blur-xl border border-white/10 hover:bg-card/80 p-6 rounded-3xl transition-all duration-300 hover:border-[#b892ff]/50 flex items-center justify-between"
        >
          <div className="relative z-10 text-left">
            <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-[#b892ff] transition-colors">Play Live</h3>
            <p className="text-muted-foreground font-medium">Compete with friends in real-time</p>
          </div>
          <div className="w-14 h-14 bg-[#b892ff]/10 rounded-full flex items-center justify-center shrink-0 relative z-10 group-hover:bg-[#b892ff]/20 transition-colors">
            <Users className="w-8 h-8 text-[#b892ff]" />
          </div>
        </button>
      </div>

      {/* Ways to Play & Learn */}
      <div className="mb-14">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-2xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">Ways to Play & Learn</h2>
          <div className="h-[1px] flex-1 bg-gradient-to-r from-white/10 to-transparent"></div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
          {GAME_MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => !mode.disabled && handleModeClick(mode as any)}
              disabled={mode.disabled}
              className={`group relative overflow-hidden bg-gradient-to-br ${mode.bg} backdrop-blur-xl border ${mode.border} ${mode.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-card/80 hover:shadow-[0_0_25px_rgba(255,255,255,0.1)] hover:-translate-y-1 cursor-pointer'} p-5 rounded-3xl transition-all duration-300 flex flex-col items-center justify-center text-center shadow-lg`}
            >
              <div className="w-16 h-16 rounded-full bg-background/50 border border-white/5 flex items-center justify-center mb-4 shadow-inner">
                {mode.icon}
              </div>
              <h3 className="text-lg font-bold text-white mb-1">{mode.name}</h3>
              <p className="text-[11px] text-muted-foreground font-medium leading-tight">{mode.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Sets Section */}
      <div className="mb-6 flex items-center gap-4 border-b border-white/10 pb-4">
        <button 
          onClick={() => setActiveTab('created')}
          className={`text-xl font-bold transition-all ${activeTab === 'created' ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'text-muted-foreground hover:text-white/80'}`}
        >
          Your Sets
        </button>
        <button 
          onClick={() => setActiveTab('saved')}
          className={`text-xl font-bold transition-all ${activeTab === 'saved' ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'text-muted-foreground hover:text-white/80'}`}
        >
          Saved Sets
        </button>
      </div>

      {/* Sets Grid */}
      {displayedSets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {displayedSets.map((set) => (
            <Dialog key={set.id}>
              <DialogTrigger 
                render={<div />}
                nativeButton={false}
                className="cursor-pointer group relative bg-[#0a092d]/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 transition-all duration-300 hover:bg-[#0a092d]/80 hover:border-[#9fa6ff]/30 hover:shadow-[0_0_30px_rgba(159,166,255,0.15)] flex flex-col w-full text-left h-[230px]"
              >
                <div className="flex-1">
                  <div className="flex justify-between items-start gap-4 mb-4 w-full">
                    <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                      <h3 className="text-xl font-bold text-white group-hover:text-[#9fa6ff] transition-colors line-clamp-2 leading-snug">
                        {set.title}
                      </h3>
                      <span className="flex items-center gap-1 text-[11px] font-bold text-[#6b7bff] bg-[#4255ff]/10 px-2 py-0.5 rounded-md shrink-0">
                        {set.cards?.[0]?.count || 0} terms
                      </span>
                    </div>
                    
                    {activeTab === 'saved' && (
                      <button 
                        onClick={(e) => handleToggleSave(e, set.id)}
                        disabled={isLoading === set.id}
                        className={`p-1.5 transition-all duration-300 rounded-lg hover:scale-110 shrink-0 ${
                          savedSetIds.has(set.id) 
                            ? 'text-[#4255ff]' 
                            : 'text-muted-foreground hover:text-[#9fa6ff]'
                        }`}
                        title={savedSetIds.has(set.id) ? "Unsave set" : "Save set"}
                      >
                        <Bookmark className={`w-5 h-5 ${savedSetIds.has(set.id) ? 'fill-current' : ''}`} />
                      </button>
                    )}
                  </div>
                  
                  {set.description && (
                    <p className="text-muted-foreground text-sm line-clamp-2 mb-6">
                      {set.description}
                    </p>
                  )}
                </div>

                <div className="mt-5 pt-5 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {set.author?.avatar_url || (activeTab === 'created' && profile?.avatar_url) ? (
                      <div className="w-9 h-9 rounded-full overflow-hidden relative shadow-sm border border-white/10 shrink-0">
                        <Image 
                          src={set.author?.avatar_url || profile.avatar_url} 
                          alt="Avatar" 
                          fill 
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center border border-white/10 shadow-sm shrink-0">
                        <span className="text-white text-sm font-bold uppercase">
                          {((set.author?.full_name || set.author?.email || displayName)[0])}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex flex-col justify-center">
                      <span className="text-sm text-white font-medium truncate max-w-[150px] leading-tight">
                        {set.author?.full_name || (set.author?.email ? set.author.email.split('@')[0] : (activeTab === 'created' ? displayName : 'Anonymous'))}
                      </span>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/80 font-medium mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{formatDistanceToNow(new Date(set.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-[#4255ff]/10 flex items-center justify-center text-[#9fa6ff] group-hover:bg-[#4255ff] group-hover:text-white transition-all duration-300 hover:scale-110 shadow-lg pointer-events-none">
                      <Play className="w-4 h-4 fill-current" />
                    </div>
                  </div>
                </div>
              </DialogTrigger>

              <DialogContent className="sm:max-w-md bg-[#0a092d] border border-white/10 text-white rounded-3xl p-6 shadow-2xl">
                <DialogHeader className="mb-4">
                  <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                    Choose a Game Mode
                  </DialogTitle>
                </DialogHeader>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {GAME_MODES.map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => !mode.disabled && router.push(mode.href === '/learn' ? `/flashcards/${set.id}/learn` : `${mode.href}/${set.id}`)}
                      disabled={mode.disabled}
                      className={`group relative overflow-hidden bg-gradient-to-br ${mode.bg} backdrop-blur-xl border ${mode.border} ${mode.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-card/80 hover:-translate-y-1 cursor-pointer'} p-4 rounded-2xl transition-all duration-300 flex flex-col items-center justify-center text-center`}
                    >
                      <div className="w-12 h-12 rounded-full bg-background/50 border border-white/5 flex items-center justify-center mb-3 shadow-inner">
                        {/* Smaller icon for modal */}
                        <div className="scale-75">
                          {mode.icon}
                        </div>
                      </div>
                      <h3 className="text-sm font-bold text-white mb-1">{mode.name}</h3>
                      <p className="text-[10px] text-muted-foreground font-medium leading-tight">{mode.desc}</p>
                    </button>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>
      ) : (
        <div className="w-full py-20 flex flex-col items-center justify-center text-center bg-card/20 rounded-3xl border border-white/5 border-dashed">
          <div className="w-20 h-20 bg-card/50 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <Layers className="w-10 h-10 text-muted-foreground opacity-50" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">No sets found</h2>
          <p className="text-muted-foreground mb-6">
            {activeTab === 'created' 
              ? "You haven't created any flashcard sets yet." 
              : "You haven't saved any sets from the community."}
          </p>
          {activeTab === 'created' ? (
            <Link 
              href="/create-set"
              className="px-6 py-3 bg-[#4255ff] hover:bg-[#5b6aff] rounded-xl text-white font-bold transition-colors shadow-lg"
            >
              Create your first set
            </Link>
          ) : (
            <Link 
              href="/explore"
              className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-bold transition-colors shadow-lg border border-white/5"
            >
              Explore public sets
            </Link>
          )}
        </div>
      )}

      {/* Mode Selection Dialog */}
      <Dialog open={isModeDialogOpen} onOpenChange={setIsModeDialogOpen}>
        <DialogContent className="bg-background text-foreground border border-white/10 sm:max-w-xl w-[90vw] rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
              Play {selectedMode?.name}
            </DialogTitle>
            <p className="text-center text-muted-foreground text-sm mb-4">Select a flashcard set to begin</p>
          </DialogHeader>

          {/* Search Input for Dialog */}
          <div className="px-1 mb-4 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search your sets..."
              value={dialogSearchQuery}
              onChange={(e) => setDialogSearchQuery(e.target.value)}
              className="w-full bg-card/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-[#4255ff]/50 focus:bg-card/80 transition-all"
            />
          </div>

          <div className="flex flex-col gap-3 max-h-[340px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredDialogSets.length > 0 ? (
              filteredDialogSets.map((set) => (
                <button
                  key={set.id}
                  onMouseEnter={() => {
                    if (selectedMode) {
                      const path = selectedMode.href === '/learn' 
                        ? `/flashcards/${set.id}/learn` 
                        : `${selectedMode.href.startsWith('/') ? selectedMode.href : `/${selectedMode.href}`}/${set.id}`;
                      router.prefetch(path);
                    }
                  }}
                  onClick={() => handleSetClickForMode(set.id)}
                  className="flex items-center justify-between p-4 bg-card/50 hover:bg-card/80 border border-white/5 hover:border-[#b892ff]/50 rounded-xl transition-all text-left cursor-pointer group"
                >
                  <div className="flex flex-col overflow-hidden pr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-white text-base truncate group-hover:text-[#b892ff] transition-colors">{set.title}</span>
                      {set.user_id === user?.id ? (
                        <span className="text-[10px] uppercase font-bold tracking-wider text-[#b892ff] bg-[#b892ff]/10 border border-[#b892ff]/20 px-2 py-0.5 rounded-full shrink-0">Yours</span>
                      ) : (
                        <span className="text-[10px] uppercase font-bold tracking-wider text-[#b892ff] bg-[#b892ff]/10 border border-[#b892ff]/20 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                          <Bookmark className="w-3 h-3" /> Saved
                        </span>
                      )}
                    </div>
                    {set.description && <span className="text-sm text-muted-foreground truncate">{set.description}</span>}
                  </div>
                  <span className="text-xs font-bold text-[#b892ff] bg-[#b892ff]/10 px-3 py-1 rounded-full shrink-0">
                    {set.cards?.[0]?.count || 0} Terms
                  </span>
                </button>
              ))
            ) : dialogSearchQuery ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">No sets found matching "{dialogSearchQuery}"</p>
              </div>
            ) : (
              <div className="flex flex-col gap-6 pt-2">
                <div className="text-center py-6 bg-card/10 rounded-2xl border border-white/5 border-dashed">
                  <p className="text-muted-foreground mb-4 text-sm">You don't have any flashcard sets yet.</p>
                  <Link 
                    href="/create-set"
                    onClick={() => setIsModeDialogOpen(false)}
                    className="inline-block px-5 py-2.5 bg-[#4255ff] text-white font-bold rounded-xl hover:bg-[#5b6aff] transition shadow-lg hover:shadow-[#4255ff]/20 hover:-translate-y-0.5"
                  >
                    Create a new set
                  </Link>
                </div>

                {filteredSuggestedSets && filteredSuggestedSets.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3 mb-1">
                      <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/10"></div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Or try these public sets</span>
                      <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/10"></div>
                    </div>
                    {filteredSuggestedSets.map((set) => (
                      <button
                        key={set.id}
                        onMouseEnter={() => {
                          if (selectedMode) {
                            const path = selectedMode.href === '/learn' 
                              ? `/flashcards/${set.id}/learn` 
                              : `${selectedMode.href.startsWith('/') ? selectedMode.href : `/${selectedMode.href}`}/${set.id}`;
                            router.prefetch(path);
                          }
                        }}
                        onClick={() => handleSetClickForMode(set.id)}
                        className="flex items-center justify-between p-4 bg-card/30 hover:bg-card/60 border border-white/5 hover:border-[#b892ff]/40 rounded-xl transition-all text-left cursor-pointer group"
                      >
                        <div className="flex flex-col overflow-hidden pr-4">
                          <span className="font-bold text-white text-base truncate group-hover:text-[#b892ff] transition-colors">{set.title}</span>
                          <span className="text-xs text-muted-foreground mt-0.5 truncate">
                            By {set.author?.full_name || set.author?.email?.split('@')[0] || 'Community'}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-white/40 bg-white/5 px-3 py-1 rounded-full shrink-0 group-hover:bg-[#b892ff]/10 group-hover:text-[#b892ff] transition-colors">
                          {set.cards?.[0]?.count || 0} Terms
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
