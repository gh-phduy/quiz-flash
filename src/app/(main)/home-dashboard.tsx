'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import {
  Search, Layers, BookOpen, FileText, Copy, Bookmark,
  Plus, Users, Flame, Mic, Headphones
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
    <div className="w-full max-w-7xl mx-auto py-10 px-6 font-sans relative">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black mb-3 drop-shadow-md flex items-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-[#9fa6ff] to-[#b892ff]">
            Welcome back, {displayName}! 👋
          </h1>
          <p className="font-semibold text-lg text-muted-foreground">
            Ready to conquer your next learning goal?
          </p>
        </div>
        
        {/* Current Rank */}
        <div className="flex flex-col items-start md:items-end justify-end">
          <span className="text-xs font-bold tracking-[0.2em] uppercase mb-1 drop-shadow-sm text-muted-foreground">
            Current Rank
          </span>
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-[#9fa6ff] via-[#b892ff] to-[#ff92d0] drop-shadow-[0_0_20px_rgba(184,146,255,0.4)]">
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
          className="group relative overflow-hidden p-6 rounded-3xl transition-all duration-300 flex items-center justify-between shadow-lg bg-gradient-to-br from-[#4255ff] to-[#6d7bff] hover:from-[#5b6aff] hover:to-[#8a94ff] shadow-[0_0_30px_rgba(66,85,255,0.3)] hover:shadow-[0_0_40px_rgba(66,85,255,0.5)] hover:-translate-y-1"
        >
          <div className="relative z-10">
            <h3 className="text-2xl font-bold text-white mb-1">
              Create new set
            </h3>
            <p className="text-white/80 font-medium text-sm">
              Build your own custom flashcards
            </p>
          </div>
          <div className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 backdrop-blur-md relative z-10 group-hover:scale-110 transition-transform bg-white/20 text-white">
            <Plus className="w-8 h-8" />
          </div>
        </Link>
        
        <button 
          className="group relative overflow-hidden backdrop-blur-xl border p-6 rounded-3xl transition-all duration-300 flex items-center justify-between bg-card/60 border-white/10 hover:bg-card/80 hover:border-[#b892ff]/50"
        >
          <div className="relative z-10 text-left">
            <h3 className="text-2xl font-bold text-white mb-1 transition-colors group-hover:text-[#b892ff]">
              Play Live
            </h3>
            <p className="text-muted-foreground font-medium text-sm">
              Compete with friends in real-time
            </p>
          </div>
          <div className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 relative z-10 transition-colors bg-[#b892ff]/10 text-[#b892ff]">
            <Users className="w-8 h-8" />
          </div>
        </button>
      </div>

      {/* Ways to Play & Learn */}
      <div className="mb-14">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-2xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
            Ways to Play & Learn
          </h2>
          <div className="h-[1px] flex-1 bg-gradient-to-r from-white/10 to-transparent"></div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
          {GAME_MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => !mode.disabled && handleModeClick(mode as any)}
              disabled={mode.disabled}
              className={`group relative overflow-hidden bg-gradient-to-br ${mode.bg} backdrop-blur-xl border ${mode.border} ${mode.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-card/80 hover:-translate-y-1 cursor-pointer'} p-5 rounded-3xl transition-all duration-300 flex flex-col items-center justify-center text-center shadow-lg`}
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-inner bg-background/50 border border-white/5">
                {mode.icon}
              </div>
              <h3 className="text-lg font-bold text-white mb-1">{mode.name}</h3>
              <p className="text-[11px] text-muted-foreground font-medium leading-tight">{mode.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Sets Section */}
      <div className="mb-6 flex items-center gap-4 pb-4 border-b border-white/10">
        <button 
          onClick={() => setActiveTab('created')}
          className={`text-xl font-bold transition-all ${
            activeTab === 'created' 
              ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]' 
              : 'text-muted-foreground hover:text-white/80'
          }`}
        >
          Your Sets
        </button>
        <button 
          onClick={() => setActiveTab('saved')}
          className={`text-xl font-bold transition-all ${
            activeTab === 'saved' 
              ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]' 
              : 'text-muted-foreground hover:text-white/80'
          }`}
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
                className="cursor-pointer group relative rounded-3xl p-6 transition-all duration-300 flex flex-col w-full text-left h-[230px] bg-[#0a092d]/50 backdrop-blur-xl border border-white/5 hover:bg-[#0a092d]/80 hover:border-[#9fa6ff]/30 hover:shadow-[0_0_30px_rgba(159,166,255,0.15)]"
              >
                <div className="flex-1">
                  <div className="flex justify-between items-start gap-4 mb-4 w-full">
                    <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                      <h3 className="text-xl font-bold transition-colors line-clamp-2 leading-snug text-white group-hover:text-[#9fa6ff]">
                        {set.title}
                      </h3>
                      <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0 text-[#6b7bff] bg-[#4255ff]/10">
                        {set.cards?.[0]?.count || 0} terms
                      </span>
                    </div>
                    
                    {activeTab === 'saved' && (
                      <button 
                        onClick={(e) => handleToggleSave(e, set.id)}
                        disabled={isLoading === set.id}
                        className={`p-1.5 transition-all duration-300 rounded-lg hover:scale-110 shrink-0 ${
                          savedSetIds.has(set.id) 
                            ? 'text-[#ff92d0] hover:text-[#ff92d0]/80' 
                            : 'text-muted-foreground hover:text-white'
                        }`}
                        title={savedSetIds.has(set.id) ? "Unsave set" : "Save set"}
                      >
                        <Bookmark className={`w-5 h-5 ${savedSetIds.has(set.id) ? 'fill-current' : ''}`} />
                      </button>
                    )}
                  </div>

                  {set.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4 font-medium">
                      {set.description}
                    </p>
                  )}
                </div>

                {/* Card Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-white/5 text-xs text-muted-foreground mt-auto">
                  <div className="flex items-center gap-2">
                    {set.author?.avatar_url ? (
                      <Image 
                        src={set.author.avatar_url} 
                        alt="Author" 
                        width={20} 
                        height={20} 
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold">
                        {(set.author?.full_name || set.author?.email || 'U')[0].toUpperCase()}
                      </div>
                    )}
                    <span className="font-medium truncate max-w-[120px]">
                      {set.author?.full_name || set.author?.email?.split('@')[0] || 'User'}
                    </span>
                  </div>
                  
                  <span className="font-mono text-[11px]">
                    {formatDistanceToNow(new Date(set.created_at), { addSuffix: true })}
                  </span>
                </div>
              </DialogTrigger>

              {/* Mode Selector Dialog */}
              <DialogContent className="sm:max-w-md bg-[#0d0c22] border-white/10 text-white rounded-3xl p-6">
                <DialogHeader className="space-y-3">
                  <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                    Choose Mode
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground font-medium">
                    Select how you want to study <strong className="text-white">{set.title}</strong>
                  </p>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-3 my-4">
                  {GAME_MODES.map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => handleSetClickForMode(set.id)}
                      disabled={mode.disabled}
                      className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 flex flex-col items-center gap-2 text-center transition-all cursor-pointer group"
                    >
                      <div className="p-3 rounded-xl bg-white/5 group-hover:scale-110 transition-transform">
                        {mode.icon}
                      </div>
                      <span className="text-sm font-bold">{mode.name}</span>
                    </button>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-card/30 border border-white/5 rounded-3xl p-8">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-white mb-2">No sets found</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mb-6">
            {activeTab === 'created' ? "You haven't created any study sets yet." : "You haven't saved any study sets yet."}
          </p>
          {activeTab === 'created' && (
            <Link 
              href="/create-set"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#4255ff] hover:bg-[#5b6aff] text-white font-bold rounded-xl transition-all"
            >
              <Plus className="w-5 h-5" /> Create your first set
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
