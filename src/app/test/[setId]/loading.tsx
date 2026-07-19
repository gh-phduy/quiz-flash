import { Loader2 } from "lucide-react";

export default function TestLoading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          <div className="absolute inset-0 bg-emerald-500 rounded-full blur-2xl opacity-40 animate-pulse scale-150"></div>
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-[#4255ff] flex items-center justify-center relative shadow-lg shadow-emerald-500/30">
            <Loader2 className="w-8 h-8 text-white animate-spin" strokeWidth={2.5} />
          </div>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <h3 className="text-lg font-bold text-foreground">Generating your test...</h3>
          <p className="text-sm text-muted-foreground animate-pulse">Building questions</p>
        </div>
      </div>
    </div>
  );
}
