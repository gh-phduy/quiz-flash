'use client';

import { useRouter } from 'next/navigation';
import { 
  ChevronDown, 
  Layers, 
  FileText, 
  Copy, 
  Home, 
  Mic,
  Headphones
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type GameMode = 'Flashcards' | 'Test' | 'Match' | 'Speaking' | 'Listening';

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
      case 'Speaking': return <Mic className={`${className} text-rose-400`} />;
      case 'Listening': return <Headphones className={`${className} text-amber-400`} />;
    }
  };

  const getModeBg = (mode: GameMode) => {
    switch (mode) {
      case 'Flashcards': return 'bg-blue-500/20';
      case 'Test': return 'bg-indigo-500/20';
      case 'Match': return 'bg-cyan-500/20';
      case 'Speaking': return 'bg-rose-500/20';
      case 'Listening': return 'bg-amber-500/20';
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
          onClick={() => router.push(`/speaking/${setId}`)}
          className={`gap-3 py-3 px-3 cursor-pointer rounded-lg transition-colors text-foreground focus:!text-foreground focus:!bg-border hover:!text-foreground hover:!bg-border ${currentMode === 'Speaking' ? 'bg-white/5' : ''}`}
        >
          <Mic className="w-5 h-5 text-rose-400" />
          <span className="font-bold text-[15px]">Speaking</span>
        </DropdownMenuItem>

        <DropdownMenuItem 
          onClick={() => router.push(`/listening/${setId}`)}
          className={`gap-3 py-3 px-3 cursor-pointer rounded-lg transition-colors text-foreground focus:!text-foreground focus:!bg-border hover:!text-foreground hover:!bg-border ${currentMode === 'Listening' ? 'bg-white/5' : ''}`}
        >
          <Headphones className="w-5 h-5 text-amber-400" />
          <span className="font-bold text-[15px]">Listening</span>
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
