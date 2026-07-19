export default function MainLoading() {
  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-8 min-h-[calc(100vh-64px)] w-full">
      <div className="w-full max-w-4xl mx-auto flex flex-col gap-8">
        
        {/* Skeleton cho thanh chọn mode (Carousel) */}
        <div>
          <div className="h-6 w-32 bg-card rounded animate-pulse mb-4"></div>
          <div className="flex gap-4 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-32 h-32 bg-card rounded-2xl animate-pulse flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#3a466a]"></div>
                <div className="h-4 w-16 bg-[#3a466a] rounded"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Skeleton cho danh sách thẻ (Recent sets) */}
        <div className="mt-8">
          <div className="h-6 w-40 bg-card rounded animate-pulse mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card rounded-2xl p-6 h-[180px] flex flex-col justify-between animate-pulse">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-3 w-12 bg-[#3a466a] rounded"></div>
                    <div className="w-1 h-1 rounded-full bg-border"></div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-[#3a466a]"></div>
                      <div className="h-3 w-16 bg-[#3a466a] rounded"></div>
                    </div>
                  </div>
                  <div className="h-6 w-3/4 bg-[#3a466a] rounded mb-2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
