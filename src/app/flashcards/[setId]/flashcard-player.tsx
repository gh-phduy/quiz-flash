'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  X, Settings, Maximize, RotateCcw, 
  Lightbulb, Volume2, ChevronDown, Home
} from 'lucide-react';
import Image from 'next/image';
import { ModeSwitcher } from '@/components/shared/mode-switcher';
import { playAudio } from '@/lib/speech';
import { recordStudyActivity } from '@/actions/study';
import { recordBulkCardReviews } from '@/actions/review';
import { updateGameScores } from '@/actions/game';
import { getSmartEvaluation, EvaluationResult } from '@/utils/evaluation';

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
  phonetic?: string | null;
  audio_url?: string | null;
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
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | 'reset' | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [newRank, setNewRank] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const cardReviewsRef = useRef<{cardId: string, quality: number}[]>([]);

  const [dragOffset, setDragOffset] = useState(0);
  const dragStartX = useRef<number | null>(null);

  useEffect(() => {
    setStartTime(Date.now());
  }, []);

  const currentCard = cards[currentIndex];

  useEffect(() => {
    if (currentCard && !isFinished) {
      // Auto-play audio when card appears (wait for slide animation)
      const timer = setTimeout(() => {
        playAudio(currentCard.audio_url, currentCard.term);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, currentCard, isFinished]);

  const handleNext = useCallback((status: 'known' | 'learning') => {
    // Record review for SM-2
    cardReviewsRef.current.push({
      cardId: currentCard.id,
      quality: status === 'known' ? 4 : 1
    });

    // Start sliding out animation
    setSlideDirection(status === 'known' ? 'right' : 'left');

    if (status === 'known') {
      setKnownCount(prev => prev + 1);
    } else {
      setLearningCount(prev => prev + 1);
    }

    // Wait for the swipe out animation (300ms)
    setTimeout(async () => {
      setIsFlipped(false);
      
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(prev => prev + 1);
        
        // Instantly move the new card to a small invisible state at the center
        setSlideDirection('reset');
        
        // Wait for React to render the reset state, then animate it in
        setTimeout(() => {
          setSlideDirection(null);
        }, 50);
      } else {
        const endTime = Date.now();
        const durationSeconds = Math.max(1, Math.round((endTime - (startTime || endTime)) / 1000));
        setTimeSpent(durationSeconds);
        
        const finalKnown = status === 'known' ? knownCount + 1 : knownCount;
        const finalLearning = status === 'learning' ? learningCount + 1 : learningCount;
        
        setIsFinished(true);
        setIsSaving(true);
        
        // Calculate points: 10 per known card, 5 per learning card
        const earned = (finalKnown * 10) + (finalLearning * 5);
        setPointsEarned(earned);

        const correctCards = cardReviewsRef.current.filter(r => r.quality === 4).map(r => r.cardId);
        const incorrectCards = cardReviewsRef.current.filter(r => r.quality === 1).map(r => r.cardId);

        // Record activity
        const [res, bulkRes] = await Promise.all([
          recordStudyActivity(set.id, earned, cards.length, 'flashcards'),
          recordBulkCardReviews(cardReviewsRef.current),
          updateGameScores(correctCards, incorrectCards)
        ]);
        
        setIsSaving(false);
        
        if (res.success) {
          setNewRank(res.newRank || null);
          const evalResult = getSmartEvaluation(finalKnown, finalLearning, durationSeconds, res.currentStreak || 0);
          setEvaluation(evalResult);
          
          if (evalResult.performance === 'perfect') {
            import('canvas-confetti').then((mod) => {
              mod.default({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#b892ff', '#ff92d0', '#4255ff']
              });
            });
          }
        }
      }
    }, 300);
  }, [currentIndex, cards.length, knownCount, learningCount, startTime, set.id]);

  const handleFlip = useCallback(() => {
    setIsFlipped(prev => !prev);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return; // Ignore if clicking a button (like the speaker)

    dragStartX.current = e.clientX;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragStartX.current === null) return;
    setDragOffset(e.clientX - dragStartX.current);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragStartX.current === null) return;
    
    const isDrag = Math.abs(dragOffset) > 10;

    // Lowered threshold to 60px to make swiping easier
    if (dragOffset > 60) {
      handleNext('known');
    } else if (dragOffset < -60) {
      handleNext('learning');
    } else if (!isDrag) {
      handleFlip();
    }
    
    setDragOffset(0);
    dragStartX.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

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
    if (isSaving) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-6 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#4255ff]/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="relative z-10 flex flex-col items-center animate-in fade-in zoom-in duration-300">
            <div className="relative w-20 h-20 mb-8">
              <div className="absolute inset-0 border-4 border-[#4255ff]/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-transparent border-t-[#4255ff] rounded-full animate-spin shadow-[0_0_30px_rgba(66,85,255,0.5)]"></div>
            </div>
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 animate-pulse mb-3">
              Calculating results...
            </h2>
            <p className="text-muted-foreground font-medium">Analyzing performance & updating XP</p>
          </div>
        </div>
      );
    }

    const accuracy = Math.round((knownCount / (knownCount + learningCount || 1)) * 100);
    const colorClasses = {
      emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-400',
      amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-400',
      rose: 'from-rose-500/20 to-rose-500/5 border-rose-500/30 text-rose-400',
      blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/30 text-blue-400',
      purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/30 text-purple-400',
    };
    
    const themeColor = evaluation ? colorClasses[evaluation.color] : colorClasses.blue;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-6 relative overflow-hidden">
        {/* Background ambient light */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#4255ff]/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="w-full max-w-2xl bg-card/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl relative z-10 flex flex-col items-center animate-in fade-in zoom-in duration-500">
          
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-br from-white to-white/70">
              {evaluation?.title || "Great job!"}
            </h1>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              {evaluation?.message || "You've reviewed all cards."}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mb-8">
            <div className="bg-white/5 rounded-2xl p-4 flex flex-col items-center justify-center border border-white/5">
              <span className="text-sm font-bold text-muted-foreground mb-1">Accuracy</span>
              <span className="text-3xl font-black text-white">{accuracy}%</span>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 flex flex-col items-center justify-center border border-white/5">
              <span className="text-sm font-bold text-emerald-400 mb-1">Known</span>
              <span className="text-3xl font-black text-emerald-400">{knownCount}</span>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 flex flex-col items-center justify-center border border-white/5">
              <span className="text-sm font-bold text-orange-400 mb-1">Learning</span>
              <span className="text-3xl font-black text-orange-400">{learningCount}</span>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 flex flex-col items-center justify-center border border-white/5 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="text-sm font-bold text-amber-400 mb-1">XP Earned</span>
              <span className="text-3xl font-black text-amber-400">+{pointsEarned}</span>
              {newRank && <span className="text-[10px] text-muted-foreground absolute bottom-2">{newRank}</span>}
            </div>
          </div>

          {/* Smart Advice */}
          {evaluation && (
            <div className={`w-full p-5 rounded-2xl bg-gradient-to-br ${themeColor} border backdrop-blur-sm mb-10 flex gap-4 items-start`}>
              <Lightbulb className="w-6 h-6 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold mb-1">Smart Tip</h3>
                <p className="text-sm opacity-90 leading-relaxed">{evaluation.advice}</p>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <button 
              onClick={() => {
                setCurrentIndex(0);
                setIsFinished(false);
                setKnownCount(0);
                setLearningCount(0);
                setIsFlipped(false);
                setStartTime(Date.now());
                setEvaluation(null);
                setSlideDirection(null);
                cardReviewsRef.current = [];
              }}
              className="px-8 py-3.5 bg-[#4255ff] text-white font-bold rounded-xl hover:bg-[#5b6aff] transition shadow-[0_0_20px_rgba(66,85,255,0.3)] hover:shadow-[0_0_30px_rgba(66,85,255,0.5)] hover:-translate-y-0.5 flex items-center justify-center gap-2 w-full flex-1"
            >
              <RotateCcw className="w-5 h-5" />
              Study Again
            </button>
            <button 
              onClick={() => router.push('/')}
              className="px-8 py-3.5 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 transition border border-white/10 flex items-center justify-center gap-2 w-full flex-1"
            >
              <Home className="w-5 h-5" />
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }
  const dragStyle = dragStartX.current !== null ? {
    transform: `translateX(${dragOffset}px) rotate(${dragOffset * 0.05}deg)`,
    transition: 'none',
  } : undefined;

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
          key="flashcard-container"
          className={`relative w-full max-w-[800px] aspect-[5/3] md:aspect-[2/1] perspective-[1000px] cursor-pointer transition-all duration-300 ease-in-out touch-none ${
            slideDirection === 'left' ? '-translate-x-[150%] -rotate-12 opacity-0' :
            slideDirection === 'right' ? 'translate-x-[150%] rotate-12 opacity-0' :
            slideDirection === 'reset' ? 'scale-90 opacity-0 duration-0 transition-none' :
            'translate-x-0 rotate-0 opacity-100 scale-100'
          }`}
          style={dragStyle}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {/* Stamps for Tinder-like effect - Placed OUTSIDE the flip container so they never mirror */}
          <div 
            className="absolute top-8 right-8 border-4 border-emerald-400 text-emerald-400 rounded-2xl px-6 py-2 text-4xl font-black uppercase tracking-widest z-50 pointer-events-none"
            style={{ opacity: dragOffset > 20 ? Math.min((dragOffset - 20) / 40, 1) : 0, transform: 'rotate(15deg)' }}
          >
            KNOW
          </div>
          <div 
            className="absolute top-8 left-8 border-4 border-orange-500 text-orange-500 rounded-2xl px-6 py-2 text-4xl font-black uppercase tracking-widest z-50 pointer-events-none"
            style={{ opacity: dragOffset < -20 ? Math.min((Math.abs(dragOffset) - 20) / 40, 1) : 0, transform: 'rotate(-15deg)' }}
          >
            LEARNING
          </div>

          {/* Card Inner */}
          <div 
            className={`w-full h-full relative transition-transform duration-500 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateX(180deg)]' : ''}`}
          >
            {/* Front Side */}
            <div className="absolute inset-0 w-full h-full bg-card rounded-2xl shadow-xl flex flex-col [backface-visibility:hidden] select-none">
              <div className="flex justify-between items-center p-6 text-muted-foreground">
                <button className="flex items-center gap-2 hover:text-foreground transition">
                  <Lightbulb className="w-5 h-5" />
                  <span className="text-sm font-bold">Get a hint</span>
                </button>
                <button 
                  className="hover:bg-white/10 p-2 rounded-full transition z-10 relative cursor-pointer text-[#9fa6ff] hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    playAudio(currentCard.audio_url, currentCard.term);
                  }}
                >
                  <Volume2 className="w-8 h-8" />
                </button>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center p-8 gap-2 min-h-0 overflow-y-auto">
                <h2 className="text-4xl md:text-5xl font-medium text-foreground text-center break-words">
                  {currentCard.term}
                </h2>
                {currentCard.phonetic && (
                  <span className="text-muted-foreground text-lg">{currentCard.phonetic}</span>
                )}
              </div>
              
              {/* Footer Front */}
              <div className="min-h-[3.5rem] py-2 w-full bg-[#b892ff]/90 rounded-b-2xl flex flex-wrap items-center justify-center gap-2 md:gap-3 text-[#0a092d] font-semibold text-xs md:text-sm px-4">
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
            <div className="absolute inset-0 w-full h-full bg-card rounded-2xl shadow-xl flex flex-col [transform:rotateX(180deg)] [backface-visibility:hidden] select-none">
              <div className="flex justify-between items-center p-6 text-muted-foreground">
                <div />
                <button 
                  className="hover:bg-white/10 p-2 rounded-full transition z-10 relative cursor-pointer text-[#9fa6ff] hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    playAudio(null, currentCard.definition); // We usually don't have audio_url for definition, so use TTS
                  }}
                >
                  <Volume2 className="w-8 h-8" />
                </button>
              </div>
              
              <div className="flex-1 flex flex-col md:flex-row items-center justify-evenly gap-8 p-6 md:p-12 w-full min-h-0 overflow-y-auto">
                <h2 className="text-3xl md:text-4xl font-medium text-foreground text-center break-words max-w-full md:max-w-[45%]">
                  {currentCard.definition}
                </h2>
                {currentCard.image_url && (
                  <div className="w-32 h-32 md:w-48 md:h-48 relative rounded-xl overflow-hidden shadow-lg flex-shrink-0">
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
              <div className="min-h-[3.5rem] py-2 w-full bg-[#b892ff]/90 rounded-b-2xl flex flex-wrap items-center justify-center gap-2 md:gap-3 text-[#0a092d] font-semibold text-xs md:text-sm px-4">
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
