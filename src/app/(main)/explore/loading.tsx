export default function ExploreLoading() {
  return (
    <div className="w-full max-w-7xl mx-auto py-10 px-6 font-sans">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div>
          <div className="h-10 w-64 bg-card rounded-lg animate-pulse mb-3"></div>
          <div className="h-6 w-80 bg-card rounded-lg animate-pulse"></div>
        </div>

        <div className="w-full md:w-96">
          <div className="w-full h-12 bg-card rounded-2xl animate-pulse"></div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-card/40 border border-white/5 rounded-3xl p-6 flex flex-col w-full text-left animate-pulse h-[230px]">
            <div className="flex-1">
              {/* Top Row: Title + Terms on Left, Bookmark on Right */}
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
