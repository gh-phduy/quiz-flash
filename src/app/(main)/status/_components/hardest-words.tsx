import React from 'react';
import { AlertCircle, TrendingDown } from 'lucide-react';

interface HardestCard {
  easinessFactor: number;
  correctCount: number;
  incorrectCount: number;
  totalReviews: number;
  masteryLevel: string;
  term: string;
  definition: string;
  phonetic: string;
}

interface HardestWordsProps {
  cards: HardestCard[];
}

export default function HardestWords({ cards }: HardestWordsProps) {
  if (!cards || cards.length === 0) {
    return (
      <div className="w-full bg-[#0a092d]/50 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-3 mb-2">
          <AlertCircle className="w-6 h-6 text-[#b892ff]" />
          <h3 className="text-xl font-bold text-white">Top Hardest Words</h3>
        </div>
        <p className="text-xs text-muted-foreground font-semibold mb-8">Words you struggle with the most, based on the lowest Easiness Factor.</p>
        
        <div className="flex flex-col items-center justify-center py-10 opacity-50">
          <p className="text-sm font-semibold text-white">No difficulty data yet. Keep learning to analyze your weaknesses!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#0a092d]/50 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#4255ff]/5 rounded-full blur-3xl -z-10" />
      
      <div className="flex items-center gap-3 mb-2">
        <AlertCircle className="w-6 h-6 text-[#b892ff]" />
        <h3 className="text-xl font-bold text-white">Top Hardest Words</h3>
      </div>
      <p className="text-xs text-muted-foreground font-semibold mb-8">Words you struggle with the most, based on the lowest Easiness Factor.</p>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-muted-foreground">
              <th className="pb-4 font-bold pl-4">Term</th>
              <th className="pb-4 font-bold">Definition</th>
              <th className="pb-4 font-bold text-center">Correct / Total</th>
              <th className="pb-4 font-bold text-center">EF Score</th>
              <th className="pb-4 font-bold text-right pr-4">Trend</th>
            </tr>
          </thead>
          <tbody>
            {cards.map((card, index) => {
              const accuracy = card.totalReviews > 0 ? Math.round((card.correctCount / card.totalReviews) * 100) : 0;
              
              return (
                <tr 
                  key={index} 
                  className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                >
                  <td className="py-4 pl-4">
                    <div className="flex flex-col">
                      <span className="text-white font-bold text-lg group-hover:text-[#b892ff] transition-colors">{card.term}</span>
                      {card.phonetic && <span className="text-xs text-muted-foreground">{card.phonetic}</span>}
                    </div>
                  </td>
                  <td className="py-4 text-sm font-medium text-white/80 max-w-xs truncate pr-4">
                    {card.definition}
                  </td>
                  <td className="py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-[#9fa6ff] font-mono font-bold">{card.correctCount}</span>
                      <span className="text-white/30">/</span>
                      <span className="text-white font-mono font-bold">{card.totalReviews}</span>
                    </div>
                    <div className="w-20 h-1.5 bg-white/10 rounded-full mx-auto mt-2 overflow-hidden">
                      <div 
                        className="h-full bg-[#9fa6ff] rounded-full"
                        style={{ width: `${accuracy}%` }}
                      />
                    </div>
                  </td>
                  <td className="py-4 text-center">
                    <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-[#b892ff]/20 text-[#b892ff] font-mono text-xs font-bold border border-[#b892ff]/30">
                      {card.easinessFactor.toFixed(2)}
                    </span>
                  </td>
                  <td className="py-4 pr-4 text-right">
                    <div className="flex items-center justify-end text-[#b892ff]">
                      <TrendingDown className="w-5 h-5" />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
