import React from 'react';

export default function LeaderboardLoading() {
  return (
    <div className="w-full max-w-5xl mx-auto py-5 sm:py-10 px-4 sm:px-6 font-sans relative animate-pulse">
      
      {/* Header Skeleton */}
      <div className="flex flex-col items-center mb-8 sm:mb-12 text-center relative z-10">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/10 rounded-3xl mb-4 sm:mb-6 border border-white/5" />
        <div className="h-8 sm:h-10 w-64 sm:w-80 bg-white/10 rounded-xl mb-3" />
        <div className="h-4 w-72 sm:w-96 max-w-full bg-white/5 rounded-md" />
      </div>

      {/* Top 3 Podium Skeleton */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end max-w-2xl mx-auto pt-6 mb-8 sm:mb-12">
        {/* #2 Silver */}
        <div className="flex flex-col items-center p-3 sm:p-5 rounded-2xl bg-white/5 border border-white/5 space-y-2">
          <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-full bg-white/10" />
          <div className="h-4 w-16 bg-white/10 rounded" />
          <div className="h-3 w-10 bg-amber-400/20 rounded" />
        </div>
        {/* #1 Gold */}
        <div className="flex flex-col items-center p-4 sm:p-6 rounded-2xl bg-white/10 border border-white/10 space-y-2 -mt-4">
          <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-white/20" />
          <div className="h-5 w-20 bg-white/20 rounded" />
          <div className="h-3 w-12 bg-amber-400/30 rounded" />
        </div>
        {/* #3 Bronze */}
        <div className="flex flex-col items-center p-3 sm:p-5 rounded-2xl bg-white/5 border border-white/5 space-y-2">
          <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-full bg-white/10" />
          <div className="h-4 w-16 bg-white/10 rounded" />
          <div className="h-3 w-10 bg-amber-400/20 rounded" />
        </div>
      </div>

      {/* Ranks List Skeleton */}
      <div className="bg-[#0a092d]/50 border border-white/10 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl relative z-10 p-3 sm:p-0 space-y-2 sm:space-y-0">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="p-3.5 sm:px-6 sm:py-4 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-white/10 rounded-md shrink-0" />
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/10 shrink-0" />
              <div className="space-y-1.5">
                <div className="h-4 w-28 bg-white/15 rounded" />
                <div className="h-3 w-16 bg-white/5 rounded" />
              </div>
            </div>
            <div className="space-y-1 text-right">
              <div className="h-4 w-16 bg-amber-300/20 rounded ml-auto" />
              <div className="h-3 w-12 bg-white/5 rounded ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
