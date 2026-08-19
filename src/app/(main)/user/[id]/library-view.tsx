"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Search, Pencil, Folder, Bookmark, Layers, BookOpen } from 'lucide-react';
import { UserAvatar } from '@/components/shared/user-avatar';
import SetWordsModal from '@/components/shared/set-words-modal';

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

export function LibraryView({ 
  sets, 
  savedSetsData, 
  userId, 
  avatarUrl, 
  displayName 
}: { 
  sets: any[], 
  savedSetsData: any[],
  userId: string,
  avatarUrl: string,
  displayName: string
}) {
  const [filter, setFilter] = useState<'all' | 'created' | 'saved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectingSetId, setInspectingSetId] = useState<string | null>(null);
  const [inspectingSetInfo, setInspectingSetInfo] = useState<any | null>(null);

  // Lọc dữ liệu theo search query
  const filteredSets = sets.filter(set => 
    set.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredSavedSets = savedSetsData.filter(set => 
    set.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const showCreated = filter === 'all' || filter === 'created';
  const showSaved = filter === 'all' || filter === 'saved';

  return (
    <>
      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
        {/* Segmented Filter Pills */}
        <div className="inline-flex p-1 bg-card/80 backdrop-blur-md border border-white/10 rounded-2xl gap-1 w-full sm:w-auto">
          <button 
            onClick={() => setFilter('all')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              filter === 'all' 
                ? 'bg-gradient-to-r from-[#4255ff] to-[#6d7bff] text-white shadow-md' 
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            All ({sets.length + savedSetsData.length})
          </button>
          <button 
            onClick={() => setFilter('created')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              filter === 'created' 
                ? 'bg-gradient-to-r from-[#4255ff] to-[#6d7bff] text-white shadow-md' 
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            Created ({sets.length})
          </button>
          <button 
            onClick={() => setFilter('saved')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              filter === 'saved' 
                ? 'bg-gradient-to-r from-[#4255ff] to-[#6d7bff] text-white shadow-md' 
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            Saved ({savedSetsData.length})
          </button>
        </div>

        {/* Search Input */}
        <div className="w-full sm:max-w-xs relative">
          <input 
            type="text" 
            placeholder="Search flashcards..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card/70 backdrop-blur-md text-foreground placeholder-muted-foreground font-semibold px-4 py-2.5 pr-10 rounded-2xl outline-none focus:ring-2 focus:ring-[#4255ff] transition border border-white/10 text-xs sm:text-sm"
          />
          <Search className="w-4 h-4 text-muted-foreground absolute right-3.5 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Created Sets Section */}
      {showCreated && (
        <div className={showSaved ? "mb-8 sm:mb-12" : ""}>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">CREATED SETS</h2>
            <div className="h-px flex-1 bg-white/10"></div>
          </div>

          <div className="flex flex-col gap-3">
            {filteredSets.length > 0 ? (
              filteredSets.map((set: any) => {
                const cefrBadge = getCefrBadge(set.title, set.description);
                return (
                  <div 
                    key={set.id}
                    className="group flex items-center justify-between p-4 sm:p-5 bg-[#0a092d]/60 backdrop-blur-xl hover:bg-[#0a092d]/90 border border-white/5 hover:border-[#9fa6ff]/30 transition-all duration-300 rounded-2xl sm:rounded-3xl shadow-lg active:scale-[0.99]"
                  >
                    <Link href={`/flashcards/${set.id}`} title={set.title} className="flex-1 flex flex-col justify-center min-w-0 pr-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground mb-1.5 flex-wrap">
                        {cefrBadge && (
                          <span className={`px-2 py-0.5 text-[10px] sm:text-[11px] font-extrabold rounded-md border ${cefrBadge.bg} ${cefrBadge.text} ${cefrBadge.border} shrink-0`}>
                            {cefrBadge.label}
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setInspectingSetId(set.id);
                            setInspectingSetInfo(set);
                          }}
                          className="px-2 py-0.5 text-[10px] sm:text-[11px] font-extrabold rounded-md bg-[#4255ff]/15 hover:bg-[#4255ff]/30 text-[#9fa6ff] border border-[#4255ff]/30 hover:border-[#4255ff]/60 shrink-0 flex items-center gap-1 transition-all cursor-pointer"
                          title="Click to view word list"
                        >
                          <Layers className="w-3 h-3" />
                          {set.cards?.[0]?.count || 0} Terms
                        </button>
                        <div className="w-px h-3 bg-white/10 hidden sm:block"></div>
                        <div className="flex items-center gap-1.5 text-white/80 text-xs">
                          <UserAvatar 
                            src={avatarUrl}
                            alt="Avatar"
                            className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border border-border shrink-0 bg-gray-600"
                          />
                          <span className="font-semibold truncate max-w-[120px]">{displayName}</span>
                        </div>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-[#9fa6ff] transition-colors leading-snug line-clamp-2" title={set.title}>
                        {set.title}
                      </h3>
                      {set.description && (
                        <p className="text-xs text-slate-400 line-clamp-1 mt-0.5" title={set.description}>
                          {set.description}
                        </p>
                      )}
                    </Link>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setInspectingSetId(set.id);
                          setInspectingSetInfo(set);
                        }}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/5 hover:bg-[#4255ff]/20 text-muted-foreground hover:text-white flex items-center justify-center transition-all shrink-0 border border-white/5 active:scale-95 cursor-pointer"
                        title="View word list"
                      >
                        <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-[#9fa6ff]" />
                      </button>

                      <Link 
                        href={`/edit-set/${set.id}`} 
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/5 hover:bg-[#4255ff]/20 text-muted-foreground hover:text-white flex items-center justify-center transition-all shrink-0 border border-white/5 active:scale-95"
                        title="Edit this set"
                      >
                        <Pencil className="w-4 h-4 sm:w-5 sm:h-5" />
                      </Link>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-muted-foreground font-semibold py-8 px-4 text-center bg-card/40 border border-white/5 rounded-2xl text-xs sm:text-sm">
                {searchQuery ? "No created sets found matching your search." : "You don't have any created flashcard sets yet."}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Saved Sets Section */}
      {showSaved && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">SAVED SETS</h2>
            <div className="h-px flex-1 bg-white/10"></div>
          </div>

          <div className="flex flex-col gap-3">
            {filteredSavedSets.length > 0 ? (
              filteredSavedSets.map((set: any) => {
                const authorAvatar = set.author?.avatar_url || null;
                const authorName = set.author?.full_name || (set.author?.email ? set.author.email.split('@')[0] : (set.user_id ? 'Anonymous' : 'QuizFlash'));
                const cefrBadge = getCefrBadge(set.title, set.description);
                
                return (
                <div 
                  key={set.id}
                  className="group flex items-center justify-between p-4 sm:p-5 bg-[#0a092d]/60 backdrop-blur-xl hover:bg-[#0a092d]/90 border border-white/5 hover:border-[#9fa6ff]/30 transition-all duration-300 rounded-2xl sm:rounded-3xl shadow-lg active:scale-[0.99]"
                >
                  <Link href={`/flashcards/${set.id}`} title={set.title} className="flex-1 flex flex-col justify-center min-w-0 pr-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground mb-1.5 flex-wrap">
                      {cefrBadge && (
                        <span className={`px-2 py-0.5 text-[10px] sm:text-[11px] font-extrabold rounded-md border ${cefrBadge.bg} ${cefrBadge.text} ${cefrBadge.border} shrink-0`}>
                          {cefrBadge.label}
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setInspectingSetId(set.id);
                          setInspectingSetInfo(set);
                        }}
                        className="px-2 py-0.5 text-[10px] sm:text-[11px] font-extrabold rounded-md bg-[#ff92d0]/15 hover:bg-[#ff92d0]/30 text-[#ff92d0] border border-[#ff92d0]/30 hover:border-[#ff92d0]/60 shrink-0 flex items-center gap-1 transition-all cursor-pointer"
                        title="Click to view word list"
                      >
                        <Bookmark className="w-3 h-3 fill-current" />
                        {set.cards?.[0]?.count || 0} Terms
                      </button>
                      <div className="w-px h-3 bg-white/10 hidden sm:block"></div>
                      <div className="flex items-center gap-1.5 text-white/80 text-xs">
                        <UserAvatar 
                          src={authorAvatar}
                          alt="Avatar"
                          className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border border-border shrink-0 bg-gray-600"
                        />
                        <span className="font-semibold truncate max-w-[120px]">{authorName}</span>
                      </div>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-[#9fa6ff] transition-colors leading-snug line-clamp-2" title={set.title}>
                      {set.title}
                    </h3>
                    {set.description && (
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5" title={set.description}>
                        {set.description}
                      </p>
                    )}
                  </Link>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setInspectingSetId(set.id);
                        setInspectingSetInfo(set);
                      }}
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/5 hover:bg-[#4255ff]/20 text-muted-foreground hover:text-white flex items-center justify-center transition-all shrink-0 border border-white/5 active:scale-95 cursor-pointer"
                      title="View word list"
                    >
                      <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-[#9fa6ff]" />
                    </button>

                    <Link 
                      href={`/flashcards/${set.id}`} 
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/5 hover:bg-[#4255ff]/20 text-muted-foreground hover:text-white flex items-center justify-center transition-all shrink-0 border border-white/5 active:scale-95"
                      title="Study this set"
                    >
                      <Pencil className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Link>
                  </div>
                </div>
              )})
            ) : (
              <div className="text-muted-foreground font-semibold py-8 px-4 text-center bg-card/40 border border-white/5 rounded-2xl text-xs sm:text-sm">
                {searchQuery ? "No saved sets found matching your search." : "You haven't saved any public sets yet."}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Set Words Details Modal */}
      <SetWordsModal
        setId={inspectingSetId}
        initialSetInfo={inspectingSetInfo}
        onClose={() => {
          setInspectingSetId(null);
          setInspectingSetInfo(null);
        }}
      />
    </>
  );
}
