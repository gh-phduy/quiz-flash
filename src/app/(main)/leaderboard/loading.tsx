export default function LeaderboardLoading() {
  return (
    <div className="w-full max-w-5xl mx-auto py-10 px-6 font-sans">
      <div className="flex items-center justify-between mb-10">
        <div className="h-10 w-64 bg-card rounded-xl animate-pulse"></div>
        <div className="h-10 w-32 bg-card rounded-xl animate-pulse"></div>
      </div>
      
      <div className="bg-card rounded-2xl overflow-hidden border border-white/5">
        <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-muted/20 border-b border-white/5">
          <div className="col-span-1 h-4 w-8 bg-[#3a466a] rounded animate-pulse"></div>
          <div className="col-span-6 md:col-span-4 h-4 w-24 bg-[#3a466a] rounded animate-pulse"></div>
          <div className="col-span-3 hidden md:flex h-4 w-16 bg-[#3a466a] rounded animate-pulse"></div>
          <div className="col-span-2 hidden md:flex h-4 w-16 bg-[#3a466a] rounded animate-pulse"></div>
          <div className="col-span-5 md:col-span-2 flex justify-end h-4 w-16 bg-[#3a466a] rounded animate-pulse"></div>
        </div>
        
        <div className="flex flex-col">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="grid grid-cols-12 gap-4 px-6 py-4 items-center border-b border-white/5 last:border-0">
              <div className="col-span-1 h-6 w-6 bg-[#3a466a] rounded-full animate-pulse"></div>
              <div className="col-span-6 md:col-span-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#3a466a] animate-pulse"></div>
                <div className="h-5 w-32 bg-[#3a466a] rounded animate-pulse"></div>
              </div>
              <div className="col-span-3 hidden md:flex">
                <div className="h-6 w-20 bg-[#3a466a] rounded-full animate-pulse"></div>
              </div>
              <div className="col-span-2 hidden md:flex">
                <div className="h-5 w-16 bg-[#3a466a] rounded animate-pulse"></div>
              </div>
              <div className="col-span-5 md:col-span-2 flex justify-end">
                <div className="h-6 w-16 bg-[#3a466a] rounded-lg animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
