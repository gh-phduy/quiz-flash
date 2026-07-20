"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Search, ChevronDown, Pencil } from 'lucide-react';
import { UserAvatar } from '@/components/shared/user-avatar';

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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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
      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
        <div className="relative">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center justify-between w-32 gap-2 px-4 py-2 bg-card text-foreground hover:bg-[#3a466a] transition font-bold rounded-lg text-sm"
          >
            {filter === 'all' ? 'All' : filter === 'created' ? 'Created' : 'Saved'}
            <ChevronDown className="w-4 h-4" />
          </button>
          
          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-32 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-10">
              <button 
                onClick={() => { setFilter('all'); setIsDropdownOpen(false); }}
                className="w-full text-left px-4 py-2 text-sm font-semibold hover:bg-[#3a466a] transition-colors"
              >
                All
              </button>
              <button 
                onClick={() => { setFilter('created'); setIsDropdownOpen(false); }}
                className="w-full text-left px-4 py-2 text-sm font-semibold hover:bg-[#3a466a] transition-colors"
              >
                Created
              </button>
              <button 
                onClick={() => { setFilter('saved'); setIsDropdownOpen(false); }}
                className="w-full text-left px-4 py-2 text-sm font-semibold hover:bg-[#3a466a] transition-colors"
              >
                Saved
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 w-full sm:max-w-md relative">
          <input 
            type="text" 
            placeholder="Search flashcards" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card text-foreground placeholder-gray-400 font-semibold px-4 py-2.5 pr-10 rounded-lg outline-none focus:ring-2 focus:ring-[#4255ff] transition border border-transparent"
          />
          <Search className="w-5 h-5 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Set List */}
      {showCreated && (
        <div className={showSaved ? "mb-12" : ""}>
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">CREATED</h2>
          <div className="flex flex-col gap-3">
            {filteredSets.length > 0 ? (
              filteredSets.map((set: any) => (
                <div 
                  key={set.id}
                  className="group flex items-center justify-between px-6 py-4 bg-card hover:bg-[#3a466a] transition-colors rounded-lg border-b-2 border-transparent hover:border-[#b892ff]"
                >
                  <Link href={`/flashcards/${set.id}`} className="flex-1 flex flex-col justify-center">
                    <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground mb-1.5">
                      <span>{set.cards?.[0]?.count || 0} Terms</span>
                      <div className="w-px h-3 bg-border"></div>
                      <div className="flex items-center gap-1.5 text-foreground">
                        <UserAvatar 
                          src={avatarUrl}
                          alt="Avatar"
                          fallbackSeed={userId}
                          className="w-5 h-5 rounded-full border border-border shrink-0 bg-gray-600"
                        />
                        <span className="font-semibold">{displayName}</span>
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-foreground group-hover:text-foreground">{set.title}</h3>
                  </Link>
                  
                  <Link 
                    href={`/edit-set/${set.id}`} 
                    className="ml-4 p-2 text-muted-foreground hover:text-foreground hover:bg-[#4255ff]/20 rounded-full transition-all"
                    title="Edit this set"
                  >
                    <Pencil className="w-5 h-5" />
                  </Link>
                </div>
              ))
            ) : (
              <div className="text-muted-foreground font-semibold py-8 text-center bg-card/50 rounded-lg">
                {searchQuery ? "No created sets found matching your search." : "You don't have any flashcard sets yet."}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Saved Sets List */}
      {showSaved && (
        <div>
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">SAVED</h2>
          <div className="flex flex-col gap-3">
            {filteredSavedSets.length > 0 ? (
              filteredSavedSets.map((set: any) => {
                const authorAvatar = set.author?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${set.user_id}`;
                const authorName = set.author?.full_name || (set.author?.email ? set.author.email.split('@')[0] : 'Anonymous');
                
                return (
                <div 
                  key={set.id}
                  className="group flex items-center justify-between px-6 py-4 bg-card hover:bg-[#3a466a] transition-colors rounded-lg border-b-2 border-transparent hover:border-[#b892ff]"
                >
                  <Link href={`/flashcards/${set.id}`} className="flex-1 flex flex-col justify-center">
                    <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground mb-1.5">
                      <span>{set.cards?.[0]?.count || 0} Terms</span>
                      <div className="w-px h-3 bg-border"></div>
                      <div className="flex items-center gap-1.5 text-foreground">
                        <UserAvatar 
                          src={authorAvatar}
                          alt="Avatar"
                          fallbackSeed={set.user_id}
                          className="w-5 h-5 rounded-full border border-border shrink-0 bg-gray-600"
                        />
                        <span className="font-semibold">{authorName}</span>
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-foreground group-hover:text-foreground">{set.title}</h3>
                  </Link>
                  
                  <Link 
                    href={`/edit-set/${set.id}`} 
                    className="ml-4 p-2 text-muted-foreground hover:text-foreground hover:bg-[#4255ff]/20 rounded-full transition-all"
                    title="View/Edit this set"
                  >
                    <Pencil className="w-5 h-5" />
                  </Link>
                </div>
              )})
            ) : (
              <div className="text-muted-foreground font-semibold py-8 text-center bg-card/50 rounded-lg">
                {searchQuery ? "No saved sets found matching your search." : "You haven't saved any public sets yet."}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
