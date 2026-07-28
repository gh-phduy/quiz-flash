'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  X, Settings, Maximize, RotateCcw, 
  Lightbulb, Volume2, VolumeX, ChevronDown, Home,
  Sparkles, SlidersHorizontal, Play
} from 'lucide-react';
import Image from 'next/image';
import { ModeSwitcher } from '@/components/shared/mode-switcher';
import { playAudio } from '@/lib/speech';
import { recordStudyActivity } from '@/actions/study';
import { recordCardReview } from '@/actions/review';
import { updateGameScores, logGameSession, checkNewCardsForSession, generateGameSession } from '@/actions/game';
import { NewWordsWarmup } from '@/components/shared/new-words-warmup';
import { getSmartEvaluation, EvaluationResult } from '@/utils/evaluation';
import { VoiceSettingsSidebar, VoiceSettingsTriggerButton } from '@/components/shared/voice-settings-sidebar';

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
  phonetic_uk?: string | null;
  part_of_speech?: string | null;
  cefr_level?: string | null;
  audio_url?: string | null;
}

interface FlashcardPlayerProps {
  set: SetData;
  cards: CardData[];
}

export default function FlashcardPlayer({ set, cards }: FlashcardPlayerProps) {
  const router = useRouter();
  const [activeCards, setActiveCards] = useState<CardData[]>(() => cards.slice(0, Math.min(10, cards.length)));
  const [showSetup, setShowSetup] = useState<boolean>(() => cards.length > 10);
  const [selectedLimit, setSelectedLimit] = useState<number>(() => Math.min(10, cards.length));
  const [isCustomLimit, setIsCustomLimit] = useState<boolean>(false);
  const [customVal, setCustomVal] = useState<number>(() => Math.min(10, cards.length));

  const [isPreparing, setIsPreparing] = useState<boolean>(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [learningCount, setLearningCount] = useState(0);
  const [knownCount, setKnownCount] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [showProgress, setShowProgress] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | 'reset' | null>(null);
   const [startTime, setStartTime] = useState<number | null>(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [newRank, setNewRank] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [dragOffset, setDragOffset] = useState(0);
  const dragStartX = useRef<number | null>(null);
  const cardReviewsRef = useRef<Array<{ cardId: string; quality: number }>>([]);

  const [newCardsForWarmup, setNewCardsForWarmup] = useState<any[]>([]);
  const [showWarmup, setShowWarmup] = useState(false);

  const handleStartSession = async (limitOverride?: number) => {
    hasInitializedRef.current = true;
    const limit = limitOverride || selectedLimit;
    setIsPreparing(true);
    let newBatch: CardData[] = [];
    const res = await generateGameSession(set.id, limit, 'flashcards');
    if (res.success && res.cards && res.cards.length > 0) {
      newBatch = res.cards as CardData[];
    }

    if (newBatch.length === 0) {
      newBatch = cards.slice(0, limit);
    }

    // Check for unreviewed new cards in this active batch
    const unreviewed = await checkNewCardsForSession(newBatch.map(c => c.id));
    if (unreviewed && unreviewed.length > 0) {
      setNewCardsForWarmup(unreviewed);
      setShowWarmup(true);

      // Re-order activeCards: put warmup new cards first, followed by the rest
      const unreviewedIdSet = new Set(unreviewed.map((c: any) => c.id));
      const remainingCards = newBatch.filter(c => !unreviewedIdSet.has(c.id));
      setActiveCards([...unreviewed, ...remainingCards]);
    } else {
      setShowWarmup(false);
      setActiveCards(newBatch);
    }

     setCurrentIndex(0);
    setIsFinished(false);
    setKnownCount(0);
    setLearningCount(0);
    setIsFlipped(false);
    setStartTime(Date.now());
    setEvaluation(null);
    setSlideDirection(null);
    cardReviewsRef.current = [];
    setIsPreparing(false);
    setShowSetup(false);
  };

  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (hasInitializedRef.current) return;
    if (cards && cards.length > 0 && !showSetup) {
      hasInitializedRef.current = true;
      const initialBatch = cards.slice(0, Math.min(10, cards.length));
      checkNewCardsForSession(initialBatch.map(c => c.id)).then(unreviewed => {
        if (unreviewed && unreviewed.length > 0) {
          setNewCardsForWarmup(unreviewed);
          setShowWarmup(true);
        }
      });
    }
  }, [cards, showSetup]);

  useEffect(() => {
    setStartTime(Date.now());
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('autoplay_all');
      if (stored !== null) {
        setIsAutoPlay(stored === 'true');
      }
    }
  }, []);

  const currentCard = activeCards[currentIndex] || cards[currentIndex];

  useEffect(() => {
    if (isAutoPlay && activeCards.length > 0 && !isFinished && !showSetup) {
      setTimeout(() => {
        if (activeCards[currentIndex]) {
          playAudio(activeCards[currentIndex].audio_url, activeCards[currentIndex].term);
        }
      }, 400); // Small delay to let the slide animation finish
    }
  }, [currentIndex, activeCards, isFinished, isAutoPlay, showSetup]);

  const handleNext = useCallback((status: 'known' | 'learning') => {
    // Record review for SM-2
    const quality = status === 'known' ? 4 : 1;
    cardReviewsRef.current.push({
      cardId: currentCard.id,
      quality
    });
    recordCardReview(currentCard.id, quality, 'flashcards').catch(console.error);

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
      
      if (currentIndex < activeCards.length - 1) {
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

        const correctCards = finalKnown > 0 ? activeCards.filter(c => c).map(c => c.id) : [];
        const incorrectCards = finalLearning > 0 ? activeCards.filter(c => c).map(c => c.id) : [];

        // Record activity
        const [res, bulkRes] = await Promise.all([
          recordStudyActivity(set.id, earned, activeCards.length, 'flashcards'),
          updateGameScores(correctCards, incorrectCards),
          logGameSession({
            setId: set.id,
            mode: 'flashcards',
            totalCards: activeCards.length,
            correctCount: finalKnown,
            incorrectCount: finalLearning,
            durationSeconds,
            pointsEarned: earned
          })
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
  }, [currentIndex, activeCards, knownCount, learningCount, startTime, set.id]);

  const handleFlip = useCallback(() => {
    setIsFlipped(prev => !prev);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return; // Ignore if clicking a button (like the speaker)

    dragStartX.current = e.clientX;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragStartX.current === null) return;
    setDragOffset(e.clientX - dragStartX.current);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragStartX.current === null) return;
    
    const isDrag = Math.abs(dragOffset) > 10;

    if (dragOffset > 40) {
      handleNext('known');
    } else if (dragOffset < -40) {
      handleNext('learning');
    } else if (!isDrag) {
      handleFlip();
    }
    
    setDragOffset(0);
    dragStartX.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    dragStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragStartX.current === null) return;
    setDragOffset(e.touches[0].clientX - dragStartX.current);
  };

  const handleTouchEnd = () => {
    if (dragStartX.current === null) return;
    const isDrag = Math.abs(dragOffset) > 10;
    if (dragOffset > 40) {
      handleNext('known');
    } else if (dragOffset < -40) {
      handleNext('learning');
    } else if (!isDrag) {
      handleFlip();
    }
    setDragOffset(0);
    dragStartX.current = null;
  };

  // Xử lý phím tắt bàn phím
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFinished || showWarmup) return;
      
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
  }, [handleFlip, handleNext, isFinished, isFlipped, showWarmup]);

  if (showSetup) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#4255ff]/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="w-full max-w-lg bg-card/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10 flex flex-col items-center animate-in fade-in zoom-in duration-300">
          <div className="w-14 h-14 rounded-2xl bg-[#4255ff]/20 text-[#9fa6ff] border border-[#4255ff]/30 flex items-center justify-center mb-5 shadow-lg">
            <Sparkles className="w-7 h-7" />
          </div>

          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 text-center mb-1">
            Study Session Setup
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-8 font-medium">
            {set.title} • {cards.length} cards total
          </p>

          {/* Quantity Presets */}
          <div className="w-full mb-6">
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-black uppercase tracking-wider text-white/70">
                Cards Per Session
              </label>
              <span className="text-xs font-bold text-[#9fa6ff]">{selectedLimit} cards</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[10, 20, 30].map((qty) => (
                <button
                  key={qty}
                  type="button"
                  onClick={() => {
                    setSelectedLimit(Math.min(qty, cards.length));
                    setIsCustomLimit(false);
                  }}
                  className={`py-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    selectedLimit === Math.min(qty, cards.length) && !isCustomLimit
                      ? 'bg-[#4255ff] text-white shadow-[0_0_15px_rgba(66,85,255,0.4)] border border-white/20'
                      : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white border border-white/5'
                  }`}
                >
                  {qty}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setIsCustomLimit(true);
                  setSelectedLimit(customVal);
                }}
                className={`py-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  isCustomLimit
                    ? 'bg-[#4255ff] text-white shadow-[0_0_15px_rgba(66,85,255,0.4)] border border-white/20'
                    : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white border border-white/5'
                }`}
              >
                Custom
              </button>

            </div>

            {isCustomLimit && (
              <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white">Custom Count</span>
                  <span className="text-[10px] text-muted-foreground">Enter between 1 and {cards.length}</span>
                </div>
                <input
                  type="number"
                  min={1}
                  max={Math.min(30, cards.length)}
                  value={customVal}
                  onChange={(e) => {
                    const val = Math.max(1, Math.min(Math.min(30, cards.length), parseInt(e.target.value) || 1));
                    setCustomVal(val);
                    setSelectedLimit(val);
                  }}
                  className="w-24 bg-slate-900/90 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#4255ff] text-center font-bold"
                />
              </div>
            )}
          </div>


          <div className="flex gap-3 w-full">
            {cards.length <= 20 && (
              <button
                type="button"
                onClick={() => setShowSetup(false)}
                className="px-6 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl border border-white/10 transition cursor-pointer"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={() => handleStartSession()}
              disabled={isPreparing}
              className="flex-1 py-4 bg-[#4255ff] hover:bg-[#5b6aff] text-white font-bold rounded-2xl transition shadow-[0_0_25px_rgba(66,85,255,0.4)] flex items-center justify-center gap-2 text-base cursor-pointer"
            >
              {isPreparing ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Preparing Waterfall...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Play className="w-5 h-5 fill-current" />
                  Start Session ({selectedLimit} Cards)
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showWarmup && newCardsForWarmup.length > 0) {
    return (
      <NewWordsWarmup
        newCards={newCardsForWarmup}
        allSetCards={cards}
        onComplete={() => setShowWarmup(false)}
        onSkip={() => setShowWarmup(false)}
      />
    );
  }

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

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button 
              onClick={() => handleStartSession()}
              className="px-6 py-3.5 bg-[#4255ff] text-white font-bold rounded-xl hover:bg-[#5b6aff] transition shadow-[0_0_20px_rgba(66,85,255,0.3)] hover:shadow-[0_0_30px_rgba(66,85,255,0.5)] hover:-translate-y-0.5 flex items-center justify-center gap-2 w-full flex-1 cursor-pointer"
            >
              <Sparkles className="w-5 h-5" />
              Next Batch ({selectedLimit} Words)
            </button>
            <button 
              onClick={() => setShowSetup(true)}
              className="px-6 py-3.5 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition border border-white/10 flex items-center justify-center gap-2 w-full flex-1 cursor-pointer"
            >
              <SlidersHorizontal className="w-5 h-5" />
              Change Size ({selectedLimit})
            </button>
            <button 
              onClick={() => router.push('/')}
              className="px-6 py-3.5 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 transition border border-white/10 flex items-center justify-center gap-2 w-full shrink-0 sm:w-auto cursor-pointer"
            >
              <Home className="w-5 h-5" />
              Home
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
    <div className="h-screen w-screen bg-[#07061d] text-foreground flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-4 shrink-0 z-20 relative border-b border-white/10 bg-[#0c0d28]/80 backdrop-blur-md">
        <div className="flex items-center gap-2 flex-1">
          <ModeSwitcher currentMode="Flashcards" setId={set.id} />
        </div>

        <div className="flex flex-col items-center justify-center shrink-0 px-2 sm:px-4">
          <span className="text-sm sm:text-base font-black font-mono text-white">
            {currentIndex + 1} / {activeCards.length}
          </span>
          <span className="text-[11px] font-bold text-slate-400 hidden sm:block truncate max-w-[200px]">
            {set.title}
          </span>
        </div>

        <div className="flex items-center justify-end gap-1.5 sm:gap-3 flex-1">
          <button 
            onClick={() => {
              const newVal = !isAutoPlay;
              setIsAutoPlay(newVal);
              if (typeof window !== 'undefined') {
                localStorage.setItem('autoplay_all', String(newVal));
              }
            }}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl transition cursor-pointer text-xs font-bold border ${
              isAutoPlay 
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' 
                : 'bg-slate-900 text-slate-400 border-white/10 hover:text-white'
            }`}
            title={isAutoPlay ? "Auto-play enabled" : "Auto-play disabled"}
          >
            {isAutoPlay ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden md:inline">Auto-play</span>
          </button>

          <VoiceSettingsTriggerButton />
          <button 
            onClick={() => router.push('/')}
            className="p-1.5 text-slate-400 hover:text-white transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6 max-w-5xl mx-auto w-full relative overflow-hidden my-auto">
        
        {/* Dynamic ambient glow based on flipped state */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] sm:w-[600px] h-[350px] sm:h-[400px] rounded-full blur-[140px] pointer-events-none transition-all duration-700 ease-in-out ${
          isFlipped 
            ? 'bg-[#b892ff]/15 scale-110' 
            : 'bg-[#4255ff]/15 scale-100'
        }`} />

        {/* Progress Stats */}
        {showProgress && (
          <div className="w-full max-w-[800px] flex justify-between items-center mb-3 sm:mb-4 relative z-10 shrink-0">
            <div className="flex items-center gap-2 text-orange-400 font-extrabold text-xs sm:text-sm bg-orange-500/10 px-3 py-1.5 rounded-full border border-orange-500/25">
              <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center font-black text-xs text-orange-300">
                {learningCount}
              </span>
              Still learning
            </div>
            <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-xs sm:text-sm bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/25">
              Know
              <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-black text-xs text-emerald-300">
                {knownCount}
              </span>
            </div>
          </div>
        )}

        <div className="w-full max-w-[800px] flex flex-col items-center justify-center relative z-10 gap-3 sm:gap-6 my-auto">
          {/* Flashcard Container (3D perspective) */}
          <div 
            key="flashcard-container"
            className={`relative w-full aspect-[4/3] sm:aspect-[2/1] perspective-[1000px] cursor-pointer transition-all duration-300 ease-in-out touch-none relative z-10 ${
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
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
          >
            {/* Stamps for Tinder-like effect */}
            <div 
              className="absolute top-6 right-6 border-4 border-emerald-400 text-emerald-400 rounded-2xl px-5 py-1.5 text-2xl sm:text-4xl font-black uppercase tracking-widest z-50 pointer-events-none"
              style={{ opacity: dragOffset > 20 ? Math.min((dragOffset - 20) / 40, 1) : 0, transform: 'rotate(15deg)' }}
            >
              KNOW
            </div>
            <div 
              className="absolute top-6 left-6 border-4 border-orange-500 text-orange-500 rounded-2xl px-5 py-1.5 text-2xl sm:text-4xl font-black uppercase tracking-widest z-50 pointer-events-none"
              style={{ opacity: dragOffset < -20 ? Math.min((Math.abs(dragOffset) - 20) / 40, 1) : 0, transform: 'rotate(-15deg)' }}
            >
              LEARNING
            </div>

            {/* Card Inner */}
            <div 
              className={`w-full h-full relative transition-transform duration-500 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateX(180deg)]' : ''}`}
            >
              {/* Front Side */}
              <div className="absolute inset-0 w-full h-full bg-[#0c0d28]/95 backdrop-blur-2xl border border-[#b892ff]/30 rounded-3xl shadow-[0_0_40px_rgba(66,85,255,0.2)] flex flex-col [backface-visibility:hidden] select-none hover:border-[#b892ff]/50 transition-all duration-300 overflow-hidden">
                <div className="flex justify-between items-center p-3.5 sm:p-6 text-muted-foreground flex-wrap gap-2">
                  <div className="flex items-center gap-2 z-10">
                    {currentCard.cefr_level && (
                      <span className="text-[10px] sm:text-xs font-black px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider shadow-sm">
                        {currentCard.cefr_level}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2 z-10">
                    {/* US Audio Button & Phonetic */}
                    <button
                      className="hover:bg-purple-500/20 hover:border-purple-400/40 px-2.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 text-xs font-mono text-white/90 bg-white/5 border border-white/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        playAudio(currentCard.audio_url, currentCard.term, undefined, 'US');
                      }}
                      title="US Pronunciation"
                    >
                      <span className="font-bold text-purple-300">US</span>
                      {currentCard.phonetic && (
                        <span className="text-slate-300 font-bold">{currentCard.phonetic}</span>
                      )}
                      <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-300" />
                    </button>

                    {/* UK Audio Button & Phonetic */}
                    <button
                      className="hover:bg-sky-500/20 hover:border-sky-400/40 px-2.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 text-xs font-mono text-white/90 bg-white/5 border border-white/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        playAudio(currentCard.audio_url, currentCard.term, undefined, 'UK');
                      }}
                      title="UK Pronunciation"
                    >
                      <span className="font-bold text-sky-300">UK</span>
                      {currentCard.phonetic_uk && (
                        <span className="text-slate-300 font-bold">{currentCard.phonetic_uk}</span>
                      )}
                      <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-300" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 gap-2 min-h-0 overflow-y-auto">
                  <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-[#b892ff] text-center break-words leading-tight">
                    {currentCard.term}
                  </h2>
                  
                  {(currentCard.phonetic || currentCard.phonetic_uk || currentCard.part_of_speech) && (
                    <div className="flex items-center justify-center gap-2 mt-1 sm:mt-2">
                      {(currentCard.phonetic || currentCard.phonetic_uk) && (
                        <span className="text-xs font-mono text-cyan-300 bg-cyan-500/10 px-3 py-1 rounded-xl border border-cyan-500/25 flex items-center gap-1 font-bold">
                          <span>{currentCard.phonetic || currentCard.phonetic_uk}</span>
                        </span>
                      )}
                      {currentCard.part_of_speech && (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-purple-500/20 text-purple-300 italic border border-purple-500/30">
                          {currentCard.part_of_speech}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Footer Front (Hidden on Mobile as requested) */}
                <div className="hidden sm:flex min-h-[3.2rem] py-2 w-full bg-[#4255ff]/90 rounded-b-3xl items-center justify-center gap-2 md:gap-3 text-white font-semibold text-xs md:text-sm px-4 shadow-[0_-5px_15px_rgba(66,85,255,0.15)]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold border border-white/20 px-1.5 py-0.5 rounded shadow-sm bg-black/20">⌨</span>
                    Shortcut
                  </div>
                  <span>Press</span>
                  <span className="bg-white px-2 py-0.5 rounded shadow-sm text-xs font-bold text-slate-900">Space</span>
                  <span>or click on the card to flip</span>
                </div>
              </div>

              {/* Back Side */}
              <div className="absolute inset-0 w-full h-full bg-[#0c0d28]/98 backdrop-blur-2xl border border-[#b892ff]/40 rounded-3xl shadow-[0_0_40px_rgba(184,146,255,0.25)] flex flex-col justify-center items-center [transform:rotateX(180deg)] [backface-visibility:hidden] select-none hover:border-[#b892ff]/60 transition-all duration-300 overflow-hidden">
                <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-4 sm:gap-8 p-6 sm:p-10 w-full h-full min-h-0 overflow-y-auto text-center my-auto">
                  <h2 className="text-2xl sm:text-4xl font-extrabold text-white text-center break-words max-w-full md:max-w-[70%] tracking-tight leading-tight my-auto">
                    {currentCard.definition}
                  </h2>
                  {currentCard.image_url && (
                    <div className="w-28 h-28 sm:w-40 sm:h-40 md:w-48 md:h-48 relative rounded-2xl overflow-hidden shadow-xl flex-shrink-0 pointer-events-none select-none border border-white/15 my-auto">
                      <Image 
                        src={currentCard.image_url} 
                        alt={currentCard.term}
                        fill
                        className="object-cover"
                        draggable={false}
                      />
                    </div>
                  )}
                </div>
                
                {/* Footer Back (Hidden on Mobile as requested) */}
                <div className="hidden sm:flex min-h-[3.2rem] py-2 w-full bg-[#b892ff]/90 rounded-b-3xl items-center justify-center gap-2 md:gap-3 text-[#0a092d] font-bold text-xs md:text-sm px-4 shadow-[0_-5px_15px_rgba(184,146,255,0.15)] shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold border border-[#0a092d]/20 px-1.5 py-0.5 rounded shadow-sm bg-black/10">⌨</span>
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

          {/* Bottom Controls (Positioned directly under flashcard) */}
          <div className="w-full flex items-center justify-center gap-6 sm:gap-10 shrink-0">
            <button 
              onClick={() => handleNext('learning')}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border border-rose-500/40 bg-rose-500/15 backdrop-blur-md flex items-center justify-center hover:bg-rose-500/25 transition group cursor-pointer shadow-[0_0_20px_rgba(244,63,94,0.25)] active:scale-95"
              title="Still learning (Left Swipe / Left Arrow)"
            >
              <X className="w-7 h-7 text-rose-400 group-hover:scale-110 transition-transform" />
            </button>
            <button 
              onClick={() => handleNext('known')}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border border-emerald-500/40 bg-emerald-500/15 backdrop-blur-md flex items-center justify-center hover:bg-emerald-500/25 transition group cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.25)] active:scale-95"
              title="Know (Right Swipe / Right Arrow)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400 group-hover:scale-110 transition-transform"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </button>
          </div>
        </div>
      </main>
      <VoiceSettingsSidebar />
    </div>
  );
}
