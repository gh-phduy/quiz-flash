'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Mode {
  name: string;
  icon: React.ReactNode;
  href: string; // e.g. "/flashcards"
}

interface SetData {
  id: string;
  title: string;
  cards: { count: number }[];
}

interface ModeSelectorProps {
  modes: Mode[];
  sets: SetData[];
}

export default function ModeSelector({ modes, sets }: ModeSelectorProps) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState<Mode | null>(null);

  const handleModeClick = (mode: Mode) => {
    setSelectedMode(mode);
    setIsDialogOpen(true);
  };

  const handleSetClick = (setId: string) => {
    if (!selectedMode) return;
    setIsDialogOpen(false);
    
    // Đường dẫn đặc biệt cho Learn
    if (selectedMode.href === '/learn') {
      router.push(`/flashcards/${setId}/learn`);
      return;
    }

    // Ensure we route properly (e.g. /flashcards/1234)
    const basePath = selectedMode.href.startsWith('/') ? selectedMode.href : `/${selectedMode.href}`;
    router.push(`${basePath}/${setId}`);
  };

  return (
    <div className="w-full max-w-4xl flex flex-col items-center">
      {/* Play live banner - like the one partially visible at top */}
      <div className="mb-8 w-full max-w-3xl">
        <button className="w-full py-4 rounded-2xl bg-card/50 hover:bg-card/80 text-muted-foreground font-semibold flex items-center justify-center gap-2 transition-colors">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
          </span>
          Play live with friends
        </button>
      </div>

      <div className="relative w-full max-w-3xl">
        {/* Container for the cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 relative z-10">
          {modes.map((mode, i) => (
            <button
              key={i}
              onClick={() => handleModeClick(mode)}
              className="group flex items-center justify-center gap-3 bg-card hover:bg-accent transition-all py-5 px-6 rounded-xl shadow-sm hover:shadow-md cursor-pointer border border-border"
            >
              {mode.icon}
              <span className="font-bold text-sm sm:text-base tracking-wide text-foreground group-hover:text-accent-foreground transition-colors">
                {mode.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Dialog Select Set */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-background text-foreground border-2 border-border sm:max-w-lg w-[90vw] rounded-xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center mb-4">
              Select a set to play {selectedMode?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {sets.length > 0 ? (
              sets.map((set) => (
                <button
                  key={set.id}
                  onClick={() => handleSetClick(set.id)}
                  className="flex items-center justify-between p-4 bg-card hover:bg-accent border-2 border-transparent hover:border-ring rounded-lg transition-colors text-left cursor-pointer"
                >
                  <span className="font-bold text-base truncate pr-4">{set.title}</span>
                  <span className="text-xs font-semibold text-muted-foreground shrink-0">
                    {set.cards?.[0]?.count || 0} Terms
                  </span>
                </button>
              ))
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <p className="mb-4">You don't have any flashcard sets yet.</p>
                <Link 
                  href="/create-set"
                  onClick={() => setIsDialogOpen(false)}
                  className="inline-block px-4 py-2 bg-[#4255ff] text-foreground font-bold rounded-lg hover:bg-[#5b6aff] transition"
                >
                  Create one now
                </Link>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
