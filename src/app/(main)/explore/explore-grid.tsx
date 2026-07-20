'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search, Layers, User, Play, Clock, BookOpen, FileText, Copy, Bookmark } from 'lucide-react';
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
  const [savedSets, setSavedSets] = useState<Set<string>>(new Set(initialSavedSetIds));
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const router = useRouter();

  const filteredSets = sets.filter(set => 
    set.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (set.description && set.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
    <div className="w-full max-w-7xl mx-auto py-10 px-6 font-sans">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#9fa6ff] to-[#b892ff] mb-2">
            Explore Public Sets
          </h1>
          <p className="text-muted-foreground font-medium text-lg">
            Discover {sets.length} flashcard sets created by the community.
          </p>
        </div>

        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <input
            type="text"
            placeholder="Search by title or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-card/50 backdrop-blur-md border border-white/10 rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#4255ff]/50 focus:border-[#4255ff]/50 transition-all shadow-lg"
          />
        </div>
      </div>

      {/* Grid */}
      {filteredSets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredSets.map((set) => (
            <Dialog key={set.id}>
              <DialogTrigger 
                render={<div />}
                nativeButton={false}
                className="cursor-pointer group relative bg-[#0a092d]/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 transition-all duration-300 hover:bg-[#0a092d]/80 hover:border-[#9fa6ff]/30 hover:shadow-[0_0_30px_rgba(159,166,255,0.15)] flex flex-col w-full text-left"
              >
                <div className="flex-1">
                    {/* Top Row: Title + Terms on Left, Flat Bookmark on Right */}
                    <div className="flex justify-between items-start gap-4 mb-4 w-full">
                      <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                        <h3 className="text-xl font-bold text-white group-hover:text-[#9fa6ff] transition-colors line-clamp-2 leading-snug">
                          {set.title}
                        </h3>
                        <span className="flex items-center gap-1 text-[11px] font-bold text-[#6b7bff] bg-[#4255ff]/10 px-2 py-0.5 rounded-md shrink-0">
                          {set.cards?.[0]?.count || 0} terms
                        </span>
                      </div>
                      
                      <button 
                        onClick={(e) => handleToggleSave(e, set.id)}
                        disabled={isLoading === set.id}
                        className={`p-1.5 transition-all duration-300 rounded-lg hover:scale-110 shrink-0 ${
                          savedSets.has(set.id) 
                            ? 'text-[#4255ff]' 
                            : 'text-muted-foreground hover:text-[#9fa6ff]'
                        }`}
                        title={savedSets.has(set.id) ? "Unsave set" : "Save set"}
                      >
                        <Bookmark className={`w-5 h-5 ${savedSets.has(set.id) ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                    
                    {set.description && (
                      <p className="text-muted-foreground text-sm line-clamp-2 mb-6">
                        {set.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-5 pt-5 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {set.author?.avatar_url ? (
                        <div className="w-9 h-9 rounded-full overflow-hidden relative shadow-sm border border-white/10 shrink-0">
                          <Image 
                            src={set.author.avatar_url} 
                            alt="Avatar" 
                            fill 
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center border border-white/10 shadow-sm shrink-0">
                          <span className="text-white text-sm font-bold uppercase">
                            {((set.author?.full_name || set.author?.email || 'A')[0])}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex flex-col justify-center">
                        <span className="text-sm text-white font-medium truncate max-w-[150px] leading-tight">
                          {set.author?.full_name || (set.author?.email ? set.author.email.split('@')[0] : 'Anonymous')}
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
                
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => router.push(`/flashcards/${set.id}`)}
                    className="flex flex-col items-center justify-center gap-3 p-6 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-2xl transition-all hover:scale-105 group"
                  >
                    <Layers className="w-8 h-8 text-blue-400 group-hover:animate-bounce" />
                    <span className="font-bold text-white">Flashcards</span>
                  </button>

                  <button 
                    onClick={() => router.push(`/flashcards/${set.id}/learn`)}
                    className="flex flex-col items-center justify-center gap-3 p-6 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-2xl transition-all hover:scale-105 group"
                  >
                    <BookOpen className="w-8 h-8 text-purple-400 group-hover:animate-bounce" />
                    <span className="font-bold text-white">Learn</span>
                  </button>

                  <button 
                    onClick={() => router.push(`/test/${set.id}`)}
                    className="flex flex-col items-center justify-center gap-3 p-6 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-2xl transition-all hover:scale-105 group"
                  >
                    <FileText className="w-8 h-8 text-indigo-400 group-hover:animate-bounce" />
                    <span className="font-bold text-white">Test</span>
                  </button>

                  <button 
                    onClick={() => router.push(`/match/${set.id}`)}
                    className="flex flex-col items-center justify-center gap-3 p-6 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-2xl transition-all hover:scale-105 group"
                  >
                    <Copy className="w-8 h-8 text-cyan-400 group-hover:animate-bounce" />
                    <span className="font-bold text-white">Match</span>
                  </button>
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>
      ) : (
        <div className="w-full py-20 flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 bg-card/50 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <Search className="w-10 h-10 text-muted-foreground opacity-50" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">No sets found</h2>
          <p className="text-muted-foreground">We couldn't find any public sets matching "{searchQuery}"</p>
          <button 
            onClick={() => setSearchQuery('')}
            className="mt-6 px-6 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-semibold transition"
          >
            Clear Search
          </button>
        </div>
      )}
    </div>
  );
}
