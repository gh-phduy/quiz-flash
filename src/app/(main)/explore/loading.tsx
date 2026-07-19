export default function ExploreLoading() {
  return (
    <div className="w-full max-w-7xl mx-auto py-10 px-4 sm:px-6 font-sans">
      <div className="mb-8">
        <div className="h-10 w-48 bg-card rounded-xl animate-pulse mb-3"></div>
        <div className="h-5 w-64 bg-card rounded-md animate-pulse"></div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-card rounded-2xl p-6 h-[220px] flex flex-col justify-between border-2 border-transparent">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#3a466a] animate-pulse"></div>
                <div className="h-4 w-24 bg-[#3a466a] rounded-md animate-pulse"></div>
              </div>
              <div className="h-6 w-full bg-[#3a466a] rounded-md animate-pulse mb-2"></div>
              <div className="h-6 w-2/3 bg-[#3a466a] rounded-md animate-pulse"></div>
            </div>
            <div className="flex justify-between items-center mt-6">
              <div className="h-8 w-20 bg-[#3a466a] rounded-full animate-pulse"></div>
              <div className="h-5 w-24 bg-[#3a466a] rounded-md animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
