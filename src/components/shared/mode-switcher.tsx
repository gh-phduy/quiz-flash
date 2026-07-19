'use client';

import { useRouter } from 'next/navigation';
import { 
  ChevronDown, 
  Layers, 
  FileText, 
  Copy, 
  Home, 
  Search,
  BookOpen
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type GameMode = 'Flashcards' | 'Test' | 'Match' | 'Learn';

interface ModeSwitcherProps {
  currentMode: GameMode;
  setId: string;
}

export function ModeSwitcher({ currentMode, setId }: ModeSwitcherProps) {
  const router = useRouter();

  const getModeIcon = (mode: GameMode, className: string = "w-4 h-4") => {
    switch (mode) {
      case 'Flashcards': return <Layers className={`${className} text-blue-400`} />;
      case 'Test': return <FileText className={`${className} text-indigo-400`} />;
      case 'Match': return <Copy className={`${className} text-cyan-400`} />;
      case 'Learn': return <BookOpen className={`${className} text-purple-400`} />;
    }
  };

  const getModeBg = (mode: GameMode) => {
    switch (mode) {
      case 'Flashcards': return 'bg-blue-500/20';
      case 'Test': return 'bg-indigo-500/20';
      case 'Match': return 'bg-cyan-500/20';
      case 'Learn': return 'bg-purple-500/20';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 group outline-none rounded-lg p-1.5 hover:bg-accent transition-colors cursor-pointer">
        <div className={`w-7 h-7 rounded flex items-center justify-center ${getModeBg(currentMode)}`}>
          {getModeIcon(currentMode, "w-4 h-4")}
        </div>
        <span className="font-bold text-lg text-foreground group-hover:text-foreground">{currentMode}</span>
        <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="start" 
        className="w-56 bg-background border border-border text-foreground rounded-xl shadow-2xl overflow-hidden p-1"
      >
        <DropdownMenuItem 
          onClick={() => router.push(`/flashcards/${setId}`)}
          className={`gap-3 py-3 px-3 cursor-pointer rounded-lg transition-colors text-foreground focus:!text-foreground focus:!bg-border hover:!text-foreground hover:!bg-border ${currentMode === 'Flashcards' ? 'bg-white/5' : ''}`}
        >
          <Layers className="w-5 h-5 text-blue-400" />
          <span className="font-bold text-[15px]">Flashcards</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => router.push(`/test/${setId}`)}
          className={`gap-3 py-3 px-3 cursor-pointer rounded-lg transition-colors text-foreground focus:!text-foreground focus:!bg-border hover:!text-foreground hover:!bg-border ${currentMode === 'Test' ? 'bg-white/5' : ''}`}
        >
          <FileText className="w-5 h-5 text-indigo-400" />
          <span className="font-bold text-[15px]">Test</span>
        </DropdownMenuItem>

        <DropdownMenuItem 
          onClick={() => router.push(`/match/${setId}`)}
          className={`gap-3 py-3 px-3 cursor-pointer rounded-lg transition-colors text-foreground focus:!text-foreground focus:!bg-border hover:!text-foreground hover:!bg-border ${currentMode === 'Match' ? 'bg-white/5' : ''}`}
        >
          <Copy className="w-5 h-5 text-cyan-400" />
          <span className="font-bold text-[15px]">Match</span>
        </DropdownMenuItem>

        <DropdownMenuItem 
          onClick={() => router.push(`/flashcards/${setId}/learn`)}
          className={`gap-3 py-3 px-3 cursor-pointer rounded-lg transition-colors text-foreground focus:!text-foreground focus:!bg-border hover:!text-foreground hover:!bg-border ${currentMode === 'Learn' ? 'bg-white/5' : ''}`}
        >
          <BookOpen className="w-5 h-5 text-purple-400" />
          <span className="font-bold text-[15px]">Learn</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-border my-2" />

        <DropdownMenuItem 
          onClick={() => router.push(`/`)}
          className="gap-3 py-3 px-3 cursor-pointer rounded-lg transition-colors text-muted-foreground focus:!text-foreground focus:!bg-border hover:!text-foreground hover:!bg-border"
        >
          <Home className="w-5 h-5" />
          <span className="font-bold text-[15px]">Home</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
