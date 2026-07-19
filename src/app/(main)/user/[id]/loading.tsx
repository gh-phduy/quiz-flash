export default function UserLoading() {
  return (
    <div className="w-full max-w-5xl mx-auto py-10 px-6 font-sans">
      {/* Header Profile */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-card animate-pulse shrink-0"></div>
          <div>
            <div className="h-8 w-48 bg-card rounded-md animate-pulse mb-2"></div>
            <div className="h-5 w-32 bg-card rounded-md animate-pulse"></div>
          </div>
        </div>
        
        {/* Stats Badges */}
        <div className="flex flex-wrap items-center gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-2 px-4 py-2 bg-card rounded-xl animate-pulse">
              <div className="w-5 h-5 rounded-full bg-[#3a466a]"></div>
              <div>
                <div className="h-3 w-10 bg-[#3a466a] rounded-sm mb-1"></div>
                <div className="h-4 w-12 bg-[#3a466a] rounded-sm"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Graph */}
      <div className="mb-10 w-full h-48 bg-card rounded-2xl animate-pulse"></div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <div className="h-10 w-32 bg-card rounded-full animate-pulse"></div>
        <div className="h-10 w-24 bg-card rounded-full animate-pulse"></div>
        <div className="h-10 w-32 bg-card rounded-full animate-pulse"></div>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between gap-4 mb-10">
        <div className="h-10 w-28 bg-card rounded-lg animate-pulse"></div>
        <div className="flex-1 max-w-md h-10 bg-card rounded-lg animate-pulse"></div>
      </div>

      {/* Set List */}
      <div>
        <div className="h-4 w-20 bg-card rounded mb-4 animate-pulse"></div>
        <div className="flex flex-col gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center justify-between px-6 py-4 bg-card rounded-lg border-b-2 border-transparent">
              <div className="flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-3 w-16 bg-[#3a466a] rounded animate-pulse"></div>
                  <div className="w-px h-3 bg-border"></div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-[#3a466a] animate-pulse"></div>
                    <div className="h-3 w-20 bg-[#3a466a] rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="h-6 w-64 bg-[#3a466a] rounded animate-pulse"></div>
              </div>
              <div className="w-9 h-9 rounded-full bg-[#3a466a] animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
