'use client';

import Link from 'next/link';
import { Home } from 'lucide-react';
import { VoiceSettingsTriggerButton } from '@/components/shared/voice-settings-sidebar';

interface ReviewHeaderProps {
  currentIndex: number;
  totalCards: number;
}

export function ReviewHeader({ currentIndex, totalCards }: ReviewHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8 gap-4">
      <Link
        href="/"
        className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors text-muted-foreground hover:text-white"
      >
        <Home className="w-5 h-5" />
      </Link>
      <div className="flex-1 mx-2 sm:mx-4">
        <div className="flex justify-between items-center text-sm font-bold tracking-wider uppercase text-white/50 mb-3 px-1">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
            Reviewing
          </span>
          <span>
            {currentIndex + 1} / {totalCards}
          </span>
        </div>
        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#9fa6ff] to-[#b892ff] transition-all duration-500 ease-out rounded-full relative"
            style={{ width: `${totalCards > 0 ? ((currentIndex + 1) / totalCards) * 100 : 0}%` }}
          >
            <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]"></div>
          </div>
        </div>
      </div>
      <VoiceSettingsTriggerButton />
    </div>
  );
}
