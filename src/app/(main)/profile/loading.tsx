import React from 'react';

export default function ProfileLoading() {
  return (
    <div className="w-full max-w-7xl mx-auto py-5 sm:py-10 px-4 md:px-8 font-sans space-y-6 sm:space-y-8 animate-pulse">
      {/* Hero Skeleton */}
      <div className="h-44 sm:h-52 w-full bg-white/5 rounded-3xl border border-white/5" />

      {/* Metrics Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="h-28 w-full bg-white/5 rounded-2xl border border-white/5" />
        <div className="h-28 w-full bg-white/5 rounded-2xl border border-white/5" />
        <div className="h-28 w-full bg-white/5 rounded-2xl border border-white/5" />
      </div>

      {/* Daily Goal Skeleton */}
      <div className="h-64 w-full bg-white/5 rounded-3xl border border-white/5" />
    </div>
  );
}
