'use client';

import React, { useState, useMemo } from 'react';
import { 
  GraduationCap, 
  Search, 
  BookOpen,
  Folder
} from 'lucide-react';
import SetAnalyticsModal from '@/components/shared/set-analytics-modal';

interface SetAnalyticsDashboardProps {
  isLoggedIn: boolean;
  userId?: string;
  createdSets: any[];
  savedSets: any[];
}

export default function SetAnalyticsDashboard({ isLoggedIn, userId, createdSets, savedSets }: SetAnalyticsDashboardProps) {
  const [activeTab, setActiveTab] = useState<'created' | 'saved'>('created');
  const [globalSearch, setGlobalSearch] = useState('');
  
  // State for inspecting set details in reusable modal
  const [inspectingSetId, setInspectingSetId] = useState<string | null>(null);

  const displayedSets = activeTab === 'created' ? createdSets : savedSets;

  // Filter set list on main page
  const filteredSets = useMemo(() => {
    return displayedSets.filter(s => {
      if (globalSearch) {
        const query = globalSearch.toLowerCase();
        const titleMatch = s.title?.toLowerCase().includes(query);
        const descMatch = s.description?.toLowerCase().includes(query);
        return titleMatch || descMatch;
      }
      return true;
    });
  }, [displayedSets, globalSearch]);

  const totalWords = useMemo(() => {
    return filteredSets.reduce((acc, s) => acc + (s.cards?.[0]?.count || 0), 0);
  }, [filteredSets]);

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-8 font-sans text-slate-100">
      
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#020617] border border-indigo-500/20 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold tracking-wider uppercase">
              <GraduationCap className="w-4 h-4 text-indigo-400" />
              Progress & Mastery
            </div>
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-indigo-300">
            Set Analytics
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-4xl leading-relaxed">
            Track your vocabulary mastery, spaced repetition metrics, accuracy rates, and weak words across all your created and bookmarked sets.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs">
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900/60 border border-white/5 backdrop-blur-md text-slate-300 font-semibold">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>{filteredSets.length} Sets</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900/60 border border-white/5 backdrop-blur-md text-slate-300 font-semibold">
              <GraduationCap className="w-4 h-4 text-emerald-400" />
              <span>{totalWords.toLocaleString()} Words</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Controls & Tabs Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
          <button
            onClick={() => setActiveTab('created')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
              activeTab === 'created'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Folder className="w-4 h-4" />
            Your Sets ({createdSets.length})
          </button>
          
          {savedSets.length > 0 && (
            <button
              onClick={() => setActiveTab('saved')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
                activeTab === 'saved'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Saved Sets ({savedSets.length})
            </button>
          )}
        </div>

        <div className="relative group w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search sets..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-white/10 rounded-xl leading-5 bg-slate-900/50 text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-slate-900 transition-all sm:text-sm"
          />
        </div>
      </div>

      {/* 3. Sets Grid */}
      {filteredSets.length === 0 ? (
        <div className="py-24 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-8 h-8 text-indigo-400/50" />
          </div>
          <h3 className="text-xl font-bold text-slate-300">No Sets Found</h3>
          <p className="text-slate-500 max-w-sm mx-auto">
            {globalSearch ? 'No sets match your search query.' : (activeTab === 'created' ? 'You haven\'t created any sets yet.' : 'You haven\'t saved any sets yet.')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {filteredSets.map((s) => {
            const wordCount = s.cards?.[0]?.count || 0;
            
            return (
              <div 
                key={s.id}
                className="group relative flex flex-col justify-between bg-slate-900/50 border border-white/5 rounded-3xl p-6 overflow-hidden hover:bg-slate-900/80 hover:border-indigo-500/30 transition-all duration-300"
              >
                <div className="relative z-10 flex flex-col flex-1 h-full">
                  <div className="flex justify-between items-start mb-3 gap-3">
                    <div className="flex-1">
                      <h3 className="text-lg sm:text-xl font-bold text-slate-100 group-hover:text-indigo-300 transition-colors line-clamp-2 leading-tight">
                        {s.title}
                      </h3>
                    </div>
                    <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] font-bold">
                      {wordCount} words
                    </div>
                  </div>
                  
                  {s.description && (
                    <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed mb-6">
                      {s.description}
                    </p>
                  )}

                  <div className="mt-auto pt-4 flex gap-3">
                    <button
                      onClick={() => setInspectingSetId(s.id)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 text-sm font-bold transition-all duration-300 shadow-lg shadow-transparent hover:shadow-indigo-500/20"
                    >
                      Inspect Analytics
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. The Shared Inspector Modal */}
      {inspectingSetId && (
        <SetAnalyticsModal 
          setId={inspectingSetId} 
          targetUserId={userId} 
          onClose={() => setInspectingSetId(null)} 
        />
      )}
    </div>
  );
}
