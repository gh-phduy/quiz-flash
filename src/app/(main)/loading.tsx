export default function MainLoading() {
  return (
    <div className="w-full max-w-7xl mx-auto py-10 px-6 font-sans">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <div className="h-10 w-64 md:w-96 bg-card rounded-xl animate-pulse mb-3"></div>
          <div className="h-5 w-48 md:w-72 bg-card rounded-md animate-pulse"></div>
        </div>
        
        {/* Rank Skeleton */}
        <div className="flex flex-col items-start md:items-end justify-end gap-2">
          <div className="h-4 w-24 bg-card rounded animate-pulse"></div>
          <div className="h-10 w-40 bg-card rounded-lg animate-pulse"></div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
        <div className="h-28 bg-card rounded-3xl animate-pulse"></div>
        <div className="h-28 bg-card rounded-3xl animate-pulse"></div>
      </div>

      {/* Ways to Play Skeleton */}
      <div className="mb-14">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-48 bg-card rounded animate-pulse"></div>
          <div className="h-[1px] flex-1 bg-white/5"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-40 bg-card rounded-3xl animate-pulse flex flex-col items-center justify-center p-5">
              <div className="w-16 h-16 rounded-full bg-[#3a466a] mb-4"></div>
              <div className="h-5 w-20 bg-[#3a466a] rounded mb-2"></div>
              <div className="h-3 w-16 bg-[#3a466a] rounded"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Sets Section Tabs */}
      <div className="mb-6 flex items-center gap-4 border-b border-white/10 pb-4">
        <div className="h-7 w-24 bg-card rounded animate-pulse"></div>
        <div className="h-7 w-24 bg-card rounded animate-pulse"></div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-card/40 border border-white/5 rounded-3xl p-6 flex flex-col w-full text-left animate-pulse h-[230px]">
            <div className="flex-1">
              {/* Top Row: Title + Terms on Left */}
              <div className="flex justify-between items-start gap-4 mb-4 w-full">
                <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                  <div className="h-7 w-48 bg-[#3a466a] rounded-lg"></div>
                  <div className="h-5 w-16 bg-[#4255ff]/20 rounded-md"></div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-[#3a466a] shrink-0"></div>
              </div>
              
              {/* Description */}
              <div className="space-y-2 mb-6">
                <div className="h-4 w-full bg-[#3a466a] rounded-md"></div>
                <div className="h-4 w-3/4 bg-[#3a466a] rounded-md"></div>
              </div>
            </div>

            {/* Bottom Row: Author + Time + Play Button */}
            <div className="mt-5 pt-5 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#3a466a] shrink-0"></div>
                <div className="flex flex-col justify-center gap-1.5">
                  <div className="h-4 w-24 bg-[#3a466a] rounded-md"></div>
                  <div className="h-3 w-16 bg-[#3a466a] rounded-md"></div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-[#3a466a]"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
