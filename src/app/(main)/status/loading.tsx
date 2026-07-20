import React from 'react';

export default function StatusLoading() {
  return (
    <div className="w-full max-w-7xl mx-auto py-10 px-4 md:px-8 font-sans space-y-10 animate-pulse">
      {/* Header section Skeleton */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-4 border-b border-white/5">
        <div className="flex items-center gap-5">
          <div className="w-24 h-24 rounded-full bg-white/10 shrink-0" />
          <div className="space-y-3">
            <div className="h-8 w-48 bg-white/10 rounded-md" />
            <div className="h-4 w-32 bg-white/10 rounded-md" />
          </div>
        </div>
        
        {/* Stats Badges Skeleton */}
        <div className="flex flex-wrap items-center gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3 bg-white/5 border border-white/10 rounded-2xl w-[120px] h-[68px]" />
          ))}
        </div>
      </div>

      {/* Heatmap Section Skeleton */}
      <div className="w-full h-[220px] bg-white/5 rounded-2xl border border-white/10" />

      {/* Primary Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-6 bg-white/5 border border-white/10 rounded-3xl h-[164px] flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <div className="h-3 w-20 bg-white/10 rounded-sm" />
              <div className="h-5 w-5 bg-white/10 rounded-full" />
            </div>
            <div>
              <div className="h-12 w-24 bg-white/10 rounded-md mb-3" />
              <div className="h-3 w-40 bg-white/10 rounded-sm" />
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Charts Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="lg:col-span-4 h-[350px] bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 flex flex-col">
            <div className="h-6 w-32 bg-white/10 rounded-md mb-3" />
            <div className="h-3 w-full bg-white/10 rounded-sm mb-8 opacity-50" />
            <div className="flex-1 w-full flex items-center justify-center">
              <div className="w-40 h-40 rounded-full border-[10px] border-white/10" />
            </div>
          </div>
        ))}
      </div>

      {/* Hardest Words List Skeleton */}
      <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-6 h-6 rounded-full bg-white/10" />
          <div className="h-6 w-48 bg-white/10 rounded-md" />
        </div>
        <div className="h-3 w-64 bg-white/10 rounded-sm mb-8" />
        
        <div className="space-y-4">
          {/* Table rows skeleton */}
          <div className="h-4 w-full bg-white/10 rounded-sm opacity-50" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex justify-between items-center py-4 border-b border-white/5">
              <div className="h-5 w-32 bg-white/10 rounded-md" />
              <div className="h-4 w-48 bg-white/10 rounded-md hidden md:block" />
              <div className="h-5 w-20 bg-white/10 rounded-md" />
              <div className="h-5 w-12 bg-white/10 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
