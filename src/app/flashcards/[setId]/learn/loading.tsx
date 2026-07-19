import { Loader2 } from "lucide-react";

export default function LearnLoading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          <div className="absolute inset-0 bg-purple-500 rounded-full blur-2xl opacity-40 animate-pulse scale-150"></div>
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-[#b892ff] flex items-center justify-center relative shadow-lg shadow-purple-500/30">
            <Loader2 className="w-8 h-8 text-white animate-spin" strokeWidth={2.5} />
          </div>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <h3 className="text-lg font-bold text-foreground">Preparing lesson...</h3>
          <p className="text-sm text-muted-foreground animate-pulse">Loading study material</p>
        </div>
      </div>
    </div>
  );
}
