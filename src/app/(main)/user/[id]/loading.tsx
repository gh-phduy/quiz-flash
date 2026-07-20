export default function UserLoading() {
  return (
    <div className="w-full max-w-5xl mx-auto py-10 px-6 font-sans">
      {/* Filters */}
      <div className="flex items-center justify-between gap-4 mb-10">
        <div className="h-10 w-28 bg-card rounded-lg animate-pulse"></div>
        <div className="flex-1 max-w-md h-[46px] bg-card rounded-lg animate-pulse"></div>
      </div>

      {/* Set List (CREATED) */}
      <div>
        <div className="h-4 w-16 bg-muted-foreground/30 rounded mb-4 animate-pulse"></div>
        <div className="flex flex-col gap-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center justify-between px-6 py-4 bg-card rounded-lg border-b-2 border-transparent">
              <div className="flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-1.5">
                  <div className="h-3 w-16 bg-[#3a466a] rounded animate-pulse"></div>
                  <div className="w-px h-3 bg-border"></div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-[#3a466a] animate-pulse"></div>
                    <div className="h-3 w-20 bg-[#3a466a] rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="h-6 w-64 bg-[#3a466a] rounded mt-1 animate-pulse"></div>
              </div>
              <div className="w-9 h-9 rounded-full bg-[#3a466a] animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Saved Sets List (SAVED) */}
      <div className="mt-12">
        <div className="h-4 w-12 bg-muted-foreground/30 rounded mb-4 animate-pulse"></div>
        <div className="flex flex-col gap-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center justify-between px-6 py-4 bg-card rounded-lg border-b-2 border-transparent">
              <div className="flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-1.5">
                  <div className="h-3 w-16 bg-[#3a466a] rounded animate-pulse"></div>
                  <div className="w-px h-3 bg-border"></div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-[#3a466a] animate-pulse"></div>
                    <div className="h-3 w-20 bg-[#3a466a] rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="h-6 w-64 bg-[#3a466a] rounded mt-1 animate-pulse"></div>
              </div>
              <div className="w-9 h-9 rounded-full bg-[#3a466a] animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
