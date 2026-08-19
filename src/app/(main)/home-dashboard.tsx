'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import {
  Search, Layers, BookOpen, FileText, Copy, Bookmark,
  Plus, Users, Flame, Mic, Headphones, Keyboard, Clock
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
import { RankBadge, getRankFromPoints } from '@/components/shared/rank-badge';

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

  // Ref for dialog header initial focus
  const headerRef = useRef<HTMLDivElement>(null);

  const GAME_MODES: { id: string; name: string; desc: string; icon: any; href: string; bg: string; border: string; disabled?: boolean }[] = [
    { id: 'flashcards', name: 'Flashcards', desc: 'Review terms & definitions', icon: <Layers className="w-8 h-8 text-blue-400 group-hover:scale-110 transition-transform" />, href: '/flashcards', bg: 'from-blue-500/10 to-blue-600/5', border: 'border-blue-500/20 hover:border-blue-500/40' },
    { id: 'typing', name: 'Typing', desc: 'Master spelling & typing', icon: <Keyboard className="w-8 h-8 text-sky-400 group-hover:scale-110 transition-transform" />, href: '/typing', bg: 'from-sky-500/10 to-sky-600/5', border: 'border-sky-500/20 hover:border-sky-500/40' },
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
    <div className="w-full max-w-7xl mx-auto py-5 sm:py-8 md:py-10 px-4 sm:px-6 font-sans relative">
      {/* Welcome Header - Gamer Esports Vibe */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 sm:mb-12 gap-6 p-6 sm:p-8 rounded-3xl sm:rounded-[2.5rem] bg-gradient-to-r from-[#0c0d28]/95 via-[#0d0c2b]/85 to-[#130f3a]/90 backdrop-blur-2xl border border-[#b892ff]/30 shadow-[0_0_50px_rgba(66,85,255,0.18)] relative overflow-hidden group">
        
        {/* Background Cyberpunk Ambient Glows */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-[#4255ff]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#b892ff]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Left: Player Info & Status */}
        <div className="relative z-10 space-y-2 min-w-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-wider">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Season 2026 Active
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white drop-shadow-lg leading-tight">
            Welcome back, <span className="inline-block py-1 text-transparent bg-clip-text bg-gradient-to-r from-[#9fa6ff] via-[#b892ff] to-[#ff92d0]">{displayName}</span>! 👋
          </h1>
          <p className="font-semibold text-sm sm:text-base text-slate-300 max-w-lg leading-relaxed">
            Ready to conquer your next learning milestone & climb the division ranks?
          </p>
        </div>

        {/* Right: Esports Gamer Rank Showcase Card */}
        {(() => {
          const currentPoints = profile?.points || 0;
          const config = getRankFromPoints(currentPoints);
          const IconComponent = config.icon;
          const range = config.maxPoints - config.minPoints;
          const prog = currentPoints - config.minPoints;
          const pct = config.maxPoints < 9999999 ? Math.min(100, Math.max(0, Math.round((prog / range) * 100))) : 100;
          const ptsNeeded = (config.maxPoints + 1) - currentPoints;

          return (
            <div className="relative z-10 shrink-0 w-full lg:w-auto lg:min-w-[320px] bg-[#07061d]/80 backdrop-blur-xl border border-white/15 p-5 rounded-2xl sm:rounded-3xl shadow-2xl space-y-4 hover:border-[#b892ff]/50 transition-all duration-300">
              {/* Header Row: Rank Emblem & Title */}
              <div className="flex items-center gap-3.5">
                {/* Gamer Rank Crest Circle */}
                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br ${config.gradient} p-0.5 shadow-lg shrink-0 ${config.glow}`}>
                  <div className="w-full h-full bg-[#0a092d] rounded-[0.85rem] flex items-center justify-center relative overflow-hidden">
                    <IconComponent className={`w-7 h-7 sm:w-8 sm:h-8 ${config.textColor} drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]`} />
                  </div>
                </div>

                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Current Division
                  </span>
                  <span className={`text-xl sm:text-2xl font-black uppercase tracking-tight ${config.textColor} drop-shadow-md`}>
                    {config.name}
                  </span>
                  <span className="text-[11px] font-bold text-slate-300 font-mono">
                    {config.tier} Tier
                  </span>
                </div>
              </div>

              {/* Progress & LP Gauge */}
              {config.maxPoints < 9999999 && (
                <div className="space-y-1.5 pt-2 border-t border-white/10">
                  <div className="flex justify-between items-center text-xs font-mono font-black">
                    <span className="text-white">{currentPoints.toLocaleString()} <span className="text-slate-400 font-normal">LP</span></span>
                    <span className={config.textColor}>{pct}% LP</span>
                  </div>

                  {/* Gamer Glowing Progress Bar */}
                  <div className="w-full h-3 bg-slate-950/90 rounded-full overflow-hidden p-0.5 border border-white/15 shadow-inner relative">
                    <div 
                      className={`h-full rounded-full bg-gradient-to-r ${config.gradient} transition-all duration-500 shadow-[0_0_12px_rgba(255,255,255,0.5)]`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {ptsNeeded > 0 && (
                    <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-400 pt-0.5">
                      <span>Division Target</span>
                      <span className="text-emerald-400 flex items-center gap-1">
                        +{ptsNeeded.toLocaleString()} LP needed
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}
      </div>
      
      {/* Daily Review Banner */}
      {dueCount > 0 && (
        <div className="mb-6 sm:mb-8 relative overflow-hidden rounded-3xl sm:rounded-[2.5rem] bg-gradient-to-r from-[#9fa6ff]/20 via-[#b892ff]/20 to-[#ff92d0]/15 border border-[#b892ff]/30 p-5 sm:p-8 md:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 sm:gap-8 group shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-[#9fa6ff]/10 to-[#b892ff]/10 mix-blend-overlay group-hover:opacity-70 transition-opacity"></div>
          <div className="relative z-10">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white mb-1.5 sm:mb-2 flex items-center gap-2.5">
              <div className="p-1.5 sm:p-2 rounded-xl bg-[#ff92d0]/20 border border-[#ff92d0]/30 shrink-0">
                <Flame className="w-5 h-5 sm:w-7 sm:h-7 text-[#ff92d0] animate-pulse" />
              </div>
              Time to review!
            </h2>
            <p className="text-xs sm:text-lg text-white/80 font-medium leading-relaxed">
              You have <strong className="text-[#ff92d0] text-sm sm:text-xl mx-1 font-bold">{dueCount}</strong> cards due for review today to maintain your memory.
            </p>
          </div>
          <Link 
            href="/review"
            className="relative z-10 w-full sm:w-auto text-center shrink-0 px-6 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-[#ff92d0] to-[#b892ff] text-white rounded-2xl font-bold text-sm sm:text-lg hover:scale-[1.03] active:scale-[0.98] hover:shadow-[0_0_30px_rgba(255,146,208,0.5)] transition-all shadow-lg border border-white/20"
          >
            Review Now
          </Link>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-8 sm:mb-12">
        <Link 
          href="/create-set"
          className="group relative overflow-hidden p-4 sm:p-6 rounded-2xl sm:rounded-3xl transition-all duration-300 flex items-center justify-between shadow-lg bg-gradient-to-br from-[#4255ff] to-[#6d7bff] hover:from-[#5b6aff] hover:to-[#8a94ff] shadow-[0_0_30px_rgba(66,85,255,0.3)] hover:shadow-[0_0_40px_rgba(66,85,255,0.5)] active:scale-[0.99]"
        >
          <div className="relative z-10">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-0.5 sm:mb-1">
              Create new set
            </h3>
            <p className="text-white/80 font-medium text-xs sm:text-sm">
              Build your own custom flashcards
            </p>
          </div>
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl sm:rounded-full flex items-center justify-center shrink-0 backdrop-blur-md relative z-10 group-hover:scale-110 transition-transform bg-white/20 text-white border border-white/20">
            <Plus className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
        </Link>
        
        <button 
          className="group relative overflow-hidden backdrop-blur-xl border p-4 sm:p-6 rounded-2xl sm:rounded-3xl transition-all duration-300 flex items-center justify-between bg-card/60 border-white/10 hover:bg-card/80 hover:border-[#b892ff]/50 active:scale-[0.99] text-left cursor-pointer"
        >
          <div className="relative z-10">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-0.5 sm:mb-1 transition-colors group-hover:text-[#b892ff]">
              Play Live
            </h3>
            <p className="text-muted-foreground font-medium text-xs sm:text-sm">
              Compete with friends in real-time
            </p>
          </div>
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl sm:rounded-full flex items-center justify-center shrink-0 relative z-10 transition-colors bg-[#b892ff]/10 text-[#b892ff] border border-[#b892ff]/20">
            <Users className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
        </button>
      </div>

      {/* Ways to Play & Learn */}
      <div className="mb-10 sm:mb-14">
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
            Ways to Play & Learn
          </h2>
          <div className="h-[1px] flex-1 bg-gradient-to-r from-white/10 to-transparent"></div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {GAME_MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => !mode.disabled && handleModeClick(mode as any)}
              disabled={mode.disabled}
              className={`group relative overflow-hidden bg-gradient-to-br ${mode.bg} backdrop-blur-xl border ${mode.border} ${mode.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-card/80 active:scale-[0.97] cursor-pointer'} p-4 sm:p-5 rounded-2xl sm:rounded-3xl transition-all duration-300 flex flex-col items-center justify-center text-center shadow-md`}
            >
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-2.5 sm:mb-4 shadow-inner bg-background/50 border border-white/5 group-hover:scale-105 transition-transform">
                {mode.icon}
              </div>
              <h3 className="text-sm sm:text-lg font-bold text-white mb-0.5">{mode.name}</h3>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium leading-snug line-clamp-2">{mode.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Sets Section - Segmented Control */}
      <div className="mb-6 flex items-center justify-between pb-2 border-b border-white/10">
        <div className="inline-flex p-1 bg-card/60 backdrop-blur-md border border-white/10 rounded-2xl gap-1">
          <button 
            onClick={() => setActiveTab('created')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'created' 
                ? 'bg-gradient-to-r from-[#4255ff] to-[#6d7bff] text-white shadow-md' 
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            Your Sets ({sets.length})
          </button>
          <button 
            onClick={() => setActiveTab('saved')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'saved' 
                ? 'bg-gradient-to-r from-[#4255ff] to-[#6d7bff] text-white shadow-md' 
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            Saved Sets ({currentSavedSets.length})
          </button>
        </div>
      </div>

      {/* Sets Grid */}
      {displayedSets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {displayedSets.map((set) => {
            const cefrBadge = getCefrBadge(set.title, set.description);
            const authorName = set.author?.full_name || (set.author?.email ? set.author.email.split('@')[0] : (set.user_id ? 'User' : 'QuizFlash'));

            return (
              <Dialog key={set.id}>
                <DialogTrigger 
                  render={<div />}
                  nativeButton={false}
                  title={`Click to study: ${set.title}`}
                  className="cursor-pointer group relative rounded-2xl sm:rounded-3xl p-5 sm:p-6 transition-all duration-300 flex flex-col w-full text-left min-h-[190px] sm:h-[230px] bg-[#0a092d]/50 backdrop-blur-xl border border-white/5 hover:bg-[#0a092d]/80 hover:border-[#9fa6ff]/30 hover:shadow-[0_0_30px_rgba(159,166,255,0.15)] active:scale-[0.99] justify-between overflow-hidden"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-3 mb-2 w-full">
                      <h3 
                        className="text-base sm:text-lg font-bold transition-colors line-clamp-2 leading-snug text-white group-hover:text-[#9fa6ff]"
                        title={set.title}
                      >
                        {set.title}
                      </h3>
                      
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

                    {/* Terms Count Tag + CEFR Level Tag */}
                    <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                      {cefrBadge && (
                        <span className={`text-[10px] sm:text-xs font-bold uppercase px-2 py-0.5 rounded-lg border ${cefrBadge.bg} ${cefrBadge.text} ${cefrBadge.border} shadow-sm shrink-0`}>
                          {cefrBadge.label}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-md shrink-0 text-[#9fa6ff] bg-[#4255ff]/15 border border-[#4255ff]/30">
                        <Layers className="w-3 h-3" />
                        {set.cards?.[0]?.count || 0} terms
                      </span>
                    </div>

                    {set.description && (
                      <p 
                        className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-3 font-medium"
                        title={set.description}
                      >
                        {set.description}
                      </p>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-white/5 text-[11px] sm:text-xs text-muted-foreground mt-auto">
                    <div className="flex items-center gap-2 min-w-0">
                      {set.author?.avatar_url ? (
                        <Image 
                          src={set.author.avatar_url} 
                          alt="Author" 
                          width={20} 
                          height={20} 
                          className="rounded-full object-cover shrink-0"
                        />
                       ) : (
                        <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold shrink-0">
                          {authorName[0].toUpperCase()}
                        </div>
                      )}
                      <span className="font-medium truncate max-w-[100px] sm:max-w-[120px]">
                        {authorName}
                      </span>
                    </div>
                    
                    <span className="font-mono text-[10px] sm:text-[11px] shrink-0">
                      {formatDistanceToNow(new Date(set.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </DialogTrigger>

                {/* Mode Selector Dialog with Full Set Information */}
                <DialogContent className="w-[95vw] sm:max-w-lg md:max-w-xl bg-gradient-to-b from-[#0c0d28] via-[#0b0a26] to-[#07061d] border border-[#b892ff]/40 text-white rounded-3xl p-5 sm:p-6 shadow-[0_0_50px_rgba(66,85,255,0.25)] backdrop-blur-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                  <DialogHeader className="mb-3 text-left">
                    <DialogTitle className="text-lg sm:text-xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#9fa6ff] via-[#b892ff] to-[#ff92d0] flex items-center gap-2">
                      🎮 Choose Practice Mode
                    </DialogTitle>
                  </DialogHeader>

                  {/* Full Set Information Preview Banner */}
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 via-white/5 to-transparent border border-white/15 p-4 sm:p-5 mb-4 shadow-inner">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#4255ff]/15 rounded-full blur-2xl pointer-events-none" />

                    {/* Badges Row */}
                    <div className="flex items-center gap-2 flex-wrap mb-2.5">
                      {cefrBadge && (
                        <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black uppercase border ${cefrBadge.bg} ${cefrBadge.text} ${cefrBadge.border} shadow-sm`}>
                          {cefrBadge.label}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs font-mono font-bold text-[#9fa6ff] bg-[#4255ff]/20 border border-[#4255ff]/40 px-2.5 py-0.5 rounded-lg">
                        <Layers className="w-3.5 h-3.5" />
                        {set.cards?.[0]?.count || 0} terms
                      </span>
                      {set.user_id === user?.id && (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] uppercase font-bold tracking-wider text-[#b892ff] bg-[#b892ff]/10 border border-[#b892ff]/20">
                          Yours
                        </span>
                      )}
                    </div>

                    {/* Full Set Title (Uncut) */}
                    <h2 className="text-base sm:text-xl font-black text-white leading-snug tracking-tight mb-2">
                      {set.title}
                    </h2>

                    {/* Full Description (Uncut) */}
                    {set.description && (
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium bg-black/30 p-3 rounded-xl border border-white/10 mb-3 whitespace-pre-wrap">
                        {set.description}
                      </p>
                    )}

                    {/* Author & Time Info */}
                    <div className="flex items-center justify-between pt-2.5 border-t border-white/10 text-xs text-slate-400">
                      <div className="flex items-center gap-2 min-w-0">
                        {set.author?.avatar_url ? (
                          <div className="w-5 h-5 rounded-full overflow-hidden relative border border-[#b892ff]/40 shrink-0">
                            <Image src={set.author.avatar_url} alt="Avatar" fill className="object-cover" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                            {authorName[0].toUpperCase()}
                          </div>
                        )}
                        <span className="font-semibold text-slate-200 truncate max-w-[140px] sm:max-w-[200px]">
                          By {authorName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-mono shrink-0 text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>{formatDistanceToNow(new Date(set.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Mode Selection Subtitle */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Select Game Mode</span>
                    <div className="h-px flex-1 bg-white/10" />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                    {GAME_MODES.map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => handleSetClickForMode(set.id)}
                        disabled={mode.disabled}
                        className={`group relative overflow-hidden bg-gradient-to-br ${mode.bg} backdrop-blur-xl border ${mode.border} ${mode.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-card/80 hover:-translate-y-1 hover:shadow-lg cursor-pointer active:scale-[0.98]'} p-3.5 sm:p-4 rounded-2xl transition-all duration-300 flex flex-col items-center justify-center text-center`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-slate-950/70 border border-white/10 flex items-center justify-center mb-2 shadow-inner group-hover:scale-110 transition-transform">
                          <div className="scale-80">
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
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 sm:py-16 bg-card/30 border border-white/5 rounded-3xl p-6 sm:p-8">
          <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg sm:text-xl font-bold text-white mb-2">No sets found</h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto mb-6">
            {activeTab === 'created' ? "You haven't created any study sets yet." : "You haven't saved any study sets yet."}
          </p>
          {activeTab === 'created' && (
            <Link 
              href="/create-set"
              className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 bg-[#4255ff] hover:bg-[#5b6aff] text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-lg active:scale-95"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" /> Create your first set
            </Link>
          )}
        </div>
      )}

      {/* Mode Selection Dialog */}
      <Dialog open={isModeDialogOpen} onOpenChange={setIsModeDialogOpen}>
        <DialogContent initialFocus={headerRef} className="bg-background text-foreground border border-white/10 sm:max-w-xl w-[92vw] rounded-2xl shadow-2xl">
          {/* Hidden focus trap to prevent auto-focusing the search input on open */}
          <div ref={headerRef} tabIndex={-1} className="sr-only" aria-hidden="true" />
          <DialogHeader className="outline-none">
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
              filteredDialogSets.map((set) => {
                const cefrBadge = getCefrBadge(set.title, set.description);
                return (
                  <button
                    key={set.id}
                    title={set.title}
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
                    <div className="flex flex-col overflow-hidden pr-4 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-bold text-white text-base truncate group-hover:text-[#b892ff] transition-colors" title={set.title}>
                          {set.title}
                        </span>
                        {cefrBadge && (
                          <span className={`text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded border ${cefrBadge.bg} ${cefrBadge.text} ${cefrBadge.border} shrink-0`}>
                            {cefrBadge.level}
                          </span>
                        )}
                        {set.user_id === user?.id ? (
                          <span className="text-[10px] uppercase font-bold tracking-wider text-[#b892ff] bg-[#b892ff]/10 border border-[#b892ff]/20 px-2 py-0.5 rounded-full shrink-0">Yours</span>
                        ) : (
                          <span className="text-[10px] uppercase font-bold tracking-wider text-[#b892ff] bg-[#b892ff]/10 border border-[#b892ff]/20 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                            <Bookmark className="w-3 h-3" /> Saved
                          </span>
                        )}
                      </div>
                      {set.description && <span className="text-sm text-muted-foreground truncate" title={set.description}>{set.description}</span>}
                    </div>
                    <span className="text-xs font-bold text-[#b892ff] bg-[#b892ff]/10 px-3 py-1 rounded-full shrink-0">
                      {set.cards?.[0]?.count || 0} Terms
                    </span>
                  </button>
                );
              })
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
                    {filteredSuggestedSets.map((set) => {
                      const cefrBadge = getCefrBadge(set.title, set.description);
                      return (
                        <button
                          key={set.id}
                          title={set.title}
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
                          <div className="flex flex-col overflow-hidden pr-4 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                              <span className="font-bold text-white text-base truncate group-hover:text-[#b892ff] transition-colors" title={set.title}>{set.title}</span>
                              {cefrBadge && (
                                <span className={`text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded border ${cefrBadge.bg} ${cefrBadge.text} ${cefrBadge.border} shrink-0`}>
                                  {cefrBadge.level}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground truncate">
                              By {set.author?.full_name || set.author?.email?.split('@')[0] || 'Community'}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-white/40 bg-white/5 px-3 py-1 rounded-full shrink-0 group-hover:bg-[#b892ff]/10 group-hover:text-[#b892ff] transition-colors">
                            {set.cards?.[0]?.count || 0} Terms
                          </span>
                        </button>
                      );
                    })}
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
