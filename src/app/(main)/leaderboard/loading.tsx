import React from 'react';

export default function LeaderboardLoading() {
  return (
    <div className="w-full max-w-5xl mx-auto py-10 px-6 font-sans relative animate-pulse">
      
      {/* Header Skeleton */}
      <div className="flex flex-col items-center mb-12 relative z-10">
        <div className="w-24 h-24 bg-white/10 rounded-2xl mb-6 border border-white/5" />
        <div className="h-10 w-72 bg-white/10 rounded-lg mb-4" />
        <div className="h-4 w-96 max-w-full bg-white/5 rounded-md" />
      </div>

      {/* Leaderboard Table Skeleton */}
      <div className="bg-[#0a092d]/50 border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl relative z-10">
        
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-5 bg-white/5 border-b border-white/10">
          <div className="col-span-1 flex justify-center"><div className="w-10 h-4 bg-white/10 rounded-sm" /></div>
          <div className="col-span-5 md:col-span-4"><div className="w-16 h-4 bg-white/10 rounded-sm" /></div>
          <div className="col-span-3 md:col-span-3 hidden md:flex"><div className="w-12 h-4 bg-white/10 rounded-sm" /></div>
          <div className="col-span-3 md:col-span-2 flex justify-end"><div className="w-14 h-4 bg-white/10 rounded-sm" /></div>
          <div className="col-span-3 md:col-span-2 flex justify-end"><div className="w-14 h-4 bg-white/10 rounded-sm" /></div>
        </div>

        {/* Players List Skeleton */}
        <div className="flex flex-col">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <div key={i} className="grid grid-cols-12 gap-4 px-6 py-4.5 items-center border-b border-white/5">
              
              {/* Rank */}
              <div className="col-span-1 flex justify-center">
                <div className="w-6 h-6 bg-white/10 rounded-md" />
              </div>
              
              {/* Player Avatar + Name */}
              <div className="col-span-5 md:col-span-4 flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-white/10 shrink-0" />
                <div className="flex flex-col gap-2">
                  <div className="h-4 w-32 bg-white/10 rounded-sm" />
                </div>
              </div>
              
              {/* Tier */}
              <div className="col-span-3 md:col-span-3 hidden md:flex items-center">
                <div className="w-16 h-6 bg-white/10 rounded-md" />
              </div>
              
              {/* Points */}
              <div className="col-span-3 md:col-span-2 flex justify-end">
                <div className="h-5 w-12 bg-white/10 rounded-sm" />
              </div>
              
              {/* Words */}
              <div className="col-span-3 md:col-span-2 flex justify-end">
                <div className="h-5 w-10 bg-white/10 rounded-sm" />
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
