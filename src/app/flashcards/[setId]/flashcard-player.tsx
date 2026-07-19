'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  X, Settings, Maximize, RotateCcw, 
  Lightbulb, Volume2, ChevronDown, Home
} from 'lucide-react';
import Image from 'next/image';
import { ModeSwitcher } from '@/components/shared/mode-switcher';

interface SetData {
  id: string;
  title: string;
  description?: string;
}

interface CardData {
  id: string;
  term: string;
  definition: string;
  image_url?: string | null;
}

interface FlashcardPlayerProps {
  set: SetData;
  cards: CardData[];
}

export default function FlashcardPlayer({ set, cards }: FlashcardPlayerProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [learningCount, setLearningCount] = useState(0);
  const [knownCount, setKnownCount] = useState(0);
  const [showProgress, setShowProgress] = useState(true);
  const [isFinished, setIsFinished] = useState(false);

  const currentCard = cards[currentIndex];

  const handleNext = useCallback((status: 'known' | 'learning') => {
    if (status === 'known') {
      setKnownCount(prev => prev + 1);
    } else {
      setLearningCount(prev => prev + 1);
    }

    setIsFlipped(false);
    
    // Đợi hiệu ứng lật thẻ xong thì đổi data
    setTimeout(() => {
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setIsFinished(true);
      }
    }, 150);
  }, [currentIndex, cards.length]);

  const handleFlip = useCallback(() => {
    setIsFlipped(prev => !prev);
  }, []);

  // Xử lý phím tắt bàn phím
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFinished) return;
      
      switch(e.code) {
        case 'Space':
        case 'ArrowUp':
        case 'ArrowDown':
          e.preventDefault();
          handleFlip();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (isFlipped) handleNext('learning');
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (isFlipped) handleNext('known');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFlip, handleNext, isFinished, isFlipped]);

  if (isFinished) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <h1 className="text-4xl font-bold mb-4">Great job!</h1>
        <p className="text-xl text-muted-foreground mb-8">You've reviewed all cards.</p>
        <div className="flex gap-8 mb-12">
          <div className="flex flex-col items-center">
            <span className="text-4xl font-bold text-green-500">{knownCount}</span>
            <span className="text-muted-foreground">Known</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-4xl font-bold text-orange-500">{learningCount}</span>
            <span className="text-muted-foreground">Still learning</span>
          </div>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => {
              setCurrentIndex(0);
              setIsFinished(false);
              setKnownCount(0);
              setLearningCount(0);
              setIsFlipped(false);
            }}
            className="px-8 py-3 bg-[#4255ff] text-foreground font-bold rounded-lg hover:bg-[#5b6aff] transition cursor-pointer flex items-center gap-2 shadow-lg"
          >
            <RotateCcw className="w-5 h-5" />
            Restart Flashcards
          </button>
          <button 
            onClick={() => router.push('/')}
            className="px-8 py-3 bg-card text-foreground font-bold rounded-lg hover:bg-[#3a466a] transition border-2 border-transparent hover:border-border cursor-pointer flex items-center gap-2"
          >
            <Home className="w-5 h-5" />
            Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <ModeSwitcher currentMode="Flashcards" setId={set.id} />

        <div className="flex flex-col items-center absolute left-1/2 -translate-x-1/2">
          <span className="text-sm font-bold text-foreground mb-1">
            {currentIndex + 1} / {cards.length}
          </span>
          <span className="text-sm font-bold text-muted-foreground">{set.title}</span>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push(`/match/${set.id}`)}
            className="hidden md:flex px-4 py-2 bg-[#4255ff] text-foreground text-sm font-bold rounded-full hover:bg-[#5b6aff] transition shadow-lg cursor-pointer"
          >
            Play Match Game
          </button>
          <button className="hidden md:flex px-4 py-2 bg-card text-foreground text-sm font-bold rounded-full hover:bg-[#3a466a] transition cursor-pointer">
            Turn these into questions
          </button>
          <button className="text-muted-foreground hover:text-foreground transition cursor-pointer">
            <Settings className="w-5 h-5" />
          </button>
          <button 
            onClick={() => router.push('/')}
            className="text-muted-foreground hover:text-foreground transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 max-w-5xl mx-auto w-full relative">
        
        {/* Progress Stats */}
        {showProgress && (
          <div className="w-full max-w-[800px] flex justify-between items-center mb-6">
            <div className="flex items-center gap-3 text-orange-500 font-bold text-sm">
              <span className="w-7 h-7 rounded-full border-2 border-orange-500 flex items-center justify-center">
                {learningCount}
              </span>
              Still learning
            </div>
            <div className="flex items-center gap-3 text-emerald-400 font-bold text-sm">
              Know
              <span className="w-7 h-7 rounded-full border-2 border-emerald-400 flex items-center justify-center">
                {knownCount}
              </span>
            </div>
          </div>
        )}

        {/* Flashcard Container (3D perspective) */}
        <div 
          className="w-full max-w-[800px] aspect-[5/3] md:aspect-[2/1] perspective-[1000px] cursor-pointer"
          onClick={handleFlip}
        >
          {/* Card Inner */}
          <div 
            className={`w-full h-full relative transition-transform duration-500 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateX(180deg)]' : ''}`}
          >
            {/* Front Side */}
            <div className="absolute inset-0 w-full h-full bg-card rounded-2xl shadow-xl flex flex-col [backface-visibility:hidden]">
              <div className="flex justify-between items-center p-6 text-muted-foreground">
                <button className="flex items-center gap-2 hover:text-foreground transition">
                  <Lightbulb className="w-5 h-5" />
                  <span className="text-sm font-bold">Get a hint</span>
                </button>
                <button className="hover:text-foreground transition">
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 flex items-center justify-center p-8">
                <h2 className="text-4xl md:text-5xl font-medium text-foreground text-center break-words">
                  {currentCard.term}
                </h2>
              </div>
              
              {/* Footer Front */}
              <div className="h-14 bg-[#b892ff]/90 rounded-b-2xl flex items-center justify-center gap-3 text-[#0a092d] font-semibold text-sm">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold border border-[#0a092d]/20 px-1.5 py-0.5 rounded shadow-sm bg-border">⌨</span>
                  Shortcut
                </div>
                <span>Press</span>
                <span className="bg-white px-2 py-0.5 rounded shadow-sm text-xs font-bold">Space</span>
                <span>or click on the card to flip</span>
              </div>
            </div>

            {/* Back Side */}
            <div className="absolute inset-0 w-full h-full bg-card rounded-2xl shadow-xl flex flex-col [transform:rotateX(180deg)] [backface-visibility:hidden]">
              <div className="flex justify-between items-center p-6 text-muted-foreground">
                <div />
                <button className="hover:text-foreground transition">
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-8 p-8">
                <h2 className="text-3xl md:text-4xl font-medium text-foreground text-center flex-1 break-words">
                  {currentCard.definition}
                </h2>
                {currentCard.image_url && (
                  <div className="w-48 h-48 md:w-64 md:h-64 relative rounded-xl overflow-hidden shadow-lg flex-shrink-0">
                    <Image 
                      src={currentCard.image_url} 
                      alt={currentCard.term}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </div>
              
              {/* Footer Back */}
              <div className="h-14 bg-[#b892ff]/90 rounded-b-2xl flex items-center justify-center gap-3 text-[#0a092d] font-semibold text-sm">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold border border-[#0a092d]/20 px-1.5 py-0.5 rounded shadow-sm bg-border">⌨</span>
                  Shortcut
                </div>
                <span>Press</span>
                <span className="bg-white px-2 py-0.5 rounded shadow-sm text-xs font-bold font-mono">←</span>
                <span>to study again or</span>
                <span className="bg-white px-2 py-0.5 rounded shadow-sm text-xs font-bold font-mono">→</span>
                <span>if you know the answer</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="w-full max-w-[800px] mt-10 flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm font-bold text-foreground">
            Track progress
            <button 
              onClick={() => setShowProgress(!showProgress)}
              className={`w-10 h-6 rounded-full flex items-center p-1 transition-colors ${showProgress ? 'bg-[#4255ff]' : 'bg-card'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${showProgress ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => handleNext('learning')}
              className="w-14 h-14 rounded-full border-2 border-border flex items-center justify-center hover:bg-card/50 transition group"
            >
              <X className="w-6 h-6 text-orange-500 group-hover:scale-110 transition-transform" />
            </button>
            <button 
              onClick={() => handleNext('known')}
              className="w-14 h-14 rounded-full border-2 border-border bg-card flex items-center justify-center hover:bg-[#3a466a] transition shadow-lg group"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400 group-hover:scale-110 transition-transform"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </button>
          </div>

          <div className="flex items-center gap-4 text-muted-foreground">
            <button className="hover:text-foreground transition">
              <RotateCcw className="w-5 h-5" />
            </button>
            <button className="hover:text-foreground transition">
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
