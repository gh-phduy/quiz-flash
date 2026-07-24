'use client';

interface ReviewCardDisplayProps {
  definition: string;
  partOfSpeech?: string;
}

export function ReviewCardDisplay({ definition, partOfSpeech }: ReviewCardDisplayProps) {
  return (
    <div className="bg-card/40 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 min-h-[250px] flex flex-col items-center justify-center text-center mb-8 relative overflow-hidden shadow-2xl">
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#b892ff]/30 to-transparent"></div>
      <div className="flex flex-col items-center gap-3">
        <h3 className="text-3xl md:text-4xl font-bold text-white leading-tight">{definition}</h3>
        {partOfSpeech && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white/10 text-purple-300 italic w-fit">
            {partOfSpeech}
          </span>
        )}
      </div>
    </div>
  );
}
