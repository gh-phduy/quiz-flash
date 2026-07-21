export default function EditSetLoading() {
  return (
    <div className="min-h-full bg-background text-foreground font-sans pb-24">
      <main className="mx-auto max-w-[1000px] px-4 py-8 lg:px-8">
        
        {/* Title Area Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div className="h-[34px] w-64 bg-card rounded-lg animate-pulse"></div>
          <div className="flex items-center gap-3">
            <div className="w-20 h-10 bg-card rounded-full animate-pulse"></div>
            <div className="w-36 h-10 bg-card rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Visibility Setting Skeleton */}
        <div className="mb-8">
          <div className="w-20 h-7 bg-card rounded-full animate-pulse"></div>
        </div>

        {/* Title & Description Inputs Skeleton */}
        <div className="flex flex-col gap-4 mb-10">
          <div className="w-full h-[62px] bg-card rounded-lg animate-pulse"></div>
          <div className="w-full h-[58px] bg-card rounded-lg animate-pulse"></div>
        </div>

        {/* Toolbar Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-[110px] h-9 bg-card rounded-full animate-pulse"></div>
            <div className="w-[160px] h-9 bg-card rounded-full animate-pulse"></div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-card rounded-full animate-pulse"></div>
            <div className="w-10 h-10 bg-card rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Flashcard List Skeleton */}
        <div className="flex flex-col gap-5 mb-10">
          {[1, 2].map((i) => (
            <div key={i} className="bg-card rounded-xl p-4 sm:p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
                <div className="w-4 h-5 bg-[#3a466a] rounded animate-pulse"></div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-[#3a466a] rounded animate-pulse"></div>
                  <div className="w-5 h-5 bg-[#3a466a] rounded animate-pulse"></div>
                </div>
              </div>
              
              {/* Content */}
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex-1 space-y-2">
                  <div className="w-full h-11 bg-background border-b-2 border-border rounded-t-md animate-pulse"></div>
                  <div className="flex justify-between mt-2">
                    <div className="w-10 h-3 bg-[#3a466a] rounded animate-pulse"></div>
                    <div className="w-24 h-6 bg-[#3a466a] rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="w-full h-11 bg-background border-b-2 border-border rounded-t-md animate-pulse"></div>
                  <div className="flex justify-between mt-2">
                    <div className="w-16 h-3 bg-[#3a466a] rounded animate-pulse"></div>
                  </div>
                </div>
                
                {/* Image Upload Area */}
                <div className="w-[84px] shrink-0">
                  <div className="w-full aspect-square bg-background border-2 border-dashed border-border rounded-lg animate-pulse flex flex-col items-center justify-center gap-2">
                    <div className="w-5 h-5 bg-[#3a466a] rounded animate-pulse"></div>
                    <div className="w-10 h-3 bg-[#3a466a] rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </main>

      {/* Floating Bottom Action Bar Skeleton */}
      <div className="fixed bottom-6 right-8 flex items-center gap-3 z-30">
        <div className="w-[100px] h-[44px] bg-card rounded-full shadow-lg animate-pulse"></div>
        <div className="w-[170px] h-[44px] bg-card rounded-full shadow-lg animate-pulse"></div>
      </div>
    </div>
  );
}
