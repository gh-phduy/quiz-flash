import React from 'react';

export default function OxfordLoading() {
  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="h-64 rounded-3xl bg-slate-900/60 border border-white/5 p-8 flex flex-col justify-between space-y-4">
        <div className="space-y-3">
          <div className="h-6 w-48 bg-slate-800 rounded-full" />
          <div className="h-10 w-3/4 max-w-lg bg-slate-800 rounded-xl" />
          <div className="h-4 w-full max-w-md bg-slate-800/60 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 bg-slate-800/80 rounded-2xl" />
          ))}
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="flex gap-2 pb-2 border-b border-white/10">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="h-10 w-28 bg-slate-900 rounded-xl shrink-0" />
        ))}
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="h-80 bg-slate-900/60 border border-white/5 rounded-3xl p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="h-5 w-16 bg-slate-800 rounded-full" />
                <div className="h-7 w-40 bg-slate-800 rounded-lg" />
              </div>
              <div className="h-6 w-14 bg-slate-800 rounded-lg" />
            </div>
            <div className="h-12 bg-slate-800/40 rounded-xl" />
            <div className="h-4 bg-slate-800 rounded-full" />
            <div className="h-10 bg-slate-800 rounded-xl mt-4" />
          </div>
        ))}
      </div>
    </div>
  );
}
