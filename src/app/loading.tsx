import { Loader2 } from "lucide-react";

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="flex flex-col items-center gap-4 p-8 rounded-3xl bg-card border border-white/5 shadow-2xl">
        <div className="relative">
          <div className="absolute inset-0 bg-[#4255ff] rounded-full blur-xl opacity-50 animate-pulse"></div>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#4255ff] to-[#b892ff] flex items-center justify-center relative shadow-lg">
            <Loader2 className="w-8 h-8 text-white animate-spin" strokeWidth={3} />
          </div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            Loading...
          </h3>
          <p className="text-sm font-medium text-muted-foreground animate-pulse">
            Getting things ready
          </p>
        </div>
      </div>
    </div>
  );
}
