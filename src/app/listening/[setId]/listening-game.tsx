'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Headphones, X, SkipForward, Home, RefreshCw, Trophy, CheckCircle2, XCircle, 
  Volume2, Play, SlidersHorizontal, Settings
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ModeSwitcher } from '@/components/shared/mode-switcher';
import { playAudio } from '@/lib/speech';
import { recordStudyActivity } from '@/actions/study';
import { recordBulkCardReviews } from '@/actions/review';
import { updateGameScores, logGameSession, checkNewCardsForSession, generateGameSession } from '@/actions/game';
import { NewWordsWarmup } from '@/components/shared/new-words-warmup';
import { VoiceSettingsSidebar, VoiceSettingsTriggerButton } from '@/components/shared/voice-settings-sidebar';

interface SetData {
  id: string;
  title: string;
}

interface CardData {
  id: string;
  term: string;
  definition: string;
  phonetic?: string | null;
  phonetic_uk?: string | null;
  part_of_speech?: string | null;
  cefr_level?: string | null;
  audio_url?: string | null;
}

interface ListeningGameProps {
  set: SetData;
  cards: CardData[];
}

function normalizeText(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export default function ListeningGame({ set, cards }: ListeningGameProps) {
  const router = useRouter();

  // Active session cards & setup state
  const [activeCards, setActiveCards] = useState<CardData[]>(() => cards.slice(0, Math.min(20, cards.length)));
  const [showSetup, setShowSetup] = useState<boolean>(true);
  const [selectedLimit, setSelectedLimit] = useState<number>(() => Math.min(20, cards.length));
  const [isCustomLimit, setIsCustomLimit] = useState<boolean>(false);
  const [customVal, setCustomVal] = useState<number>(() => Math.min(20, cards.length));
  const [selectedStrategy, setSelectedStrategy] = useState<'smart' | 'random' | 'sequential'>('smart');
  const [isPreparing, setIsPreparing] = useState<boolean>(false);

  // Game Progress State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);

  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [userInput, setUserInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const correctCardsRef = useRef<Set<string>>(new Set());
  const cardReviewsRef = useRef<{ cardId: string; quality: number }[]>([]);

  const [newCardsForWarmup, setNewCardsForWarmup] = useState<any[]>([]);
  const [showWarmup, setShowWarmup] = useState(false);

  const currentCard = activeCards[currentIndex];

  // Handler to start session with chosen quantity & strategy algorithm
  const handleStartSession = async (limitOverride?: number) => {
    const limit = limitOverride || selectedLimit;
    setIsPreparing(true);
    let newBatch: CardData[] = [];

    if (selectedStrategy === 'smart') {
      const res = await generateGameSession(set.id, limit);
      if (res.success && res.cards && res.cards.length > 0) {
        newBatch = res.cards as CardData[];
      }
    }

    if (newBatch.length === 0) {
      if (selectedStrategy === 'random') {
        newBatch = [...cards].sort(() => 0.5 - Math.random()).slice(0, limit);
      } else {
        newBatch = cards.slice(0, limit);
      }
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
    setScore(0);
    setIsFinished(false);
    setStatus('idle');
    setUserInput('');
    setStartTime(Date.now());
    correctCardsRef.current.clear();
    cardReviewsRef.current = [];
    setIsPreparing(false);
    setShowSetup(false);
  };

  // Play audio when stepping onto a card
  useEffect(() => {
    if (!isFinished && currentCard && !showWarmup && !showSetup) {
      playAudio(currentCard.audio_url, currentCard.term);
      setUserInput('');
      setStatus('idle');
      
      // Auto focus input
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  }, [currentIndex, isFinished, currentCard, showWarmup, showSetup]);

  // Save final results on session end
  useEffect(() => {
    if (!isFinished || activeCards.length === 0) return;

    (async () => {
      setIsSaving(true);
      try {
        const totalSecs = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;
        const xp = Math.round(score * 10);
        
        const reviews = cardReviewsRef.current.length > 0
          ? cardReviewsRef.current
          : activeCards.map(c => ({
              cardId: c.id,
              quality: correctCardsRef.current.has(c.id) ? 5 : 1
            }));

        const incorrectCardIds = activeCards
          .filter(c => !correctCardsRef.current.has(c.id))
          .map(c => c.id);

        await Promise.all([
          recordStudyActivity(set.id, xp, activeCards.length, 'listening'),
          recordBulkCardReviews(reviews, 'listening'),
          updateGameScores(Array.from(correctCardsRef.current), incorrectCardIds),
          logGameSession({
            setId: set.id,
            mode: 'listening',
            totalCards: activeCards.length,
            correctCount: score,
            incorrectCount: activeCards.length - score,
            durationSeconds: totalSecs,
            pointsEarned: xp
          })
        ]);
      } catch (e) {
        console.warn('Error saving listening results:', e);
      } finally {
        setIsSaving(false);
      }
    })();
  }, [isFinished, score, activeCards, set.id, startTime]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (status === 'correct') return;
    if (!userInput.trim()) return;

    const target = currentCard?.term || '';
    if (normalizeText(userInput) === normalizeText(target)) {
      setStatus('correct');
      if (currentCard) {
        correctCardsRef.current.add(currentCard.id);
        cardReviewsRef.current.push({ cardId: currentCard.id, quality: 5 });
      }
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#fbbf24', '#d97706'],
      });
      setScore(prev => prev + 1);

      setTimeout(() => {
        const nextIndex = currentIndex + 1;
        if (nextIndex < activeCards.length) {
          setCurrentIndex(nextIndex);
        } else {
          setIsFinished(true);
        }
      }, 1400);
    } else {
      setStatus('wrong');
      if (currentCard) {
        cardReviewsRef.current.push({ cardId: currentCard.id, quality: 1 });
      }
      if (inputRef.current) {
        inputRef.current.select();
      }
    }
  };

  const handleSkip = () => {
    if (currentCard) {
      cardReviewsRef.current.push({ cardId: currentCard.id, quality: 1 });
    }
    const nextIndex = currentIndex + 1;
    if (nextIndex < activeCards.length) {
      setCurrentIndex(nextIndex);
    } else {
      setIsFinished(true);
    }
  };

  const handleRestart = () => {
    handleStartSession();
  };

  // SETUP MODAL
  if (showSetup) {
    const limits = [5, 10, 15, 20, cards.length].filter((val, index, self) => val <= cards.length && self.indexOf(val) === index);

    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="w-full max-w-xl bg-card/60 backdrop-blur-2xl border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 flex flex-col items-center">
          
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(245,158,11,0.4)]">
            <Headphones className="w-8 h-8 text-white" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white text-center mb-1">
            Listening Practice Setup
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-6 max-w-md">
            Choose your card batch limit and study algorithm strategy to start listening.
          </p>

          {/* Card Limit Selection */}
          <div className="w-full mb-6">
            <label className="text-xs font-black uppercase tracking-wider text-white/70 block mb-2.5">
              Select Number of Cards
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
              {limits.map((limit) => {
                const isAll = limit === cards.length;
                const isSelected = !isCustomLimit && selectedLimit === limit;
                return (
                  <button
                    key={limit}
                    type="button"
                    onClick={() => {
                      setIsCustomLimit(false);
                      setSelectedLimit(limit);
                    }}
                    className={`py-3 px-2 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-amber-500 text-white border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)] scale-105'
                        : 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {isAll ? `All (${limit})` : `${limit} Cards`}
                  </button>
                );
              })}
              
              <button
                type="button"
                onClick={() => {
                  setIsCustomLimit(true);
                  setSelectedLimit(customVal);
                }}
                className={`py-3 px-2 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                  isCustomLimit
                    ? 'bg-amber-500 text-white border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)] scale-105'
                    : 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10'
                }`}
              >
                Custom
              </button>
            </div>

            {isCustomLimit && (
              <div className="p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white">Custom Cards Count</span>
                  <span className="text-[10px] text-muted-foreground">Between 1 and {cards.length}</span>
                </div>
                <input
                  type="number"
                  min={1}
                  max={cards.length}
                  value={customVal}
                  onChange={(e) => {
                    const val = Math.max(1, Math.min(cards.length, parseInt(e.target.value) || 1));
                    setCustomVal(val);
                    setSelectedLimit(val);
                  }}
                  className="w-24 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 text-center font-bold"
                />
              </div>
            )}
          </div>

          {/* Algorithm Strategy Selection */}
          <div className="w-full mb-8">
            <label className="text-xs font-black uppercase tracking-wider text-white/70 block mb-2.5">
              Algorithm Strategy
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedStrategy('smart')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  selectedStrategy === 'smart'
                    ? 'bg-amber-500/20 border-amber-500 text-white shadow-lg'
                    : 'bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10'
                }`}
              >
                <span className="font-bold text-sm text-white flex items-center gap-1.5 mb-1">
                  🧠 Smart Waterfall (SM-2)
                </span>
                <span className="text-[11px] leading-snug opacity-80">
                  Prioritizes due reviews, weak words & new cards
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStrategy('random')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  selectedStrategy === 'random'
                    ? 'bg-amber-500/20 border-amber-500 text-white shadow-lg'
                    : 'bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10'
                }`}
              >
                <span className="font-bold text-sm text-white flex items-center gap-1.5 mb-1">
                  🔀 Random Shuffle
                </span>
                <span className="text-[11px] leading-snug opacity-80">
                  Randomly selects words across the entire set
                </span>
              </button>
            </div>
          </div>

          <div className="flex gap-3 w-full">
            <button
              type="button"
              onClick={() => handleStartSession()}
              disabled={isPreparing}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-extrabold rounded-2xl transition shadow-[0_0_25px_rgba(245,158,11,0.4)] flex items-center justify-center gap-2 text-base cursor-pointer"
            >
              {isPreparing ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Preparing Waterfall Cards...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Play className="w-5 h-5 fill-current" />
                  Start Listening ({selectedLimit} Cards)
                </span>
              )}
            </button>
          </div>

        </div>
      </div>
    );
  }

  // WARMUP SCREEN
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

  // ===== RESULT SCREEN =====
  if (isFinished) {
    const accuracy = activeCards.length > 0 ? Math.round((score / activeCards.length) * 100) : 0;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

        {isSaving && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
          </div>
        )}

        <div className="w-full max-w-2xl bg-card/40 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl relative z-10 flex flex-col items-center">
          <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
            <Trophy className="w-12 h-12 text-white" />
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/80 mb-2">
            Great Listening!
          </h1>
          <p className="text-lg text-muted-foreground mb-8 text-center max-w-md">
            You completed listening practice for {activeCards.length} cards!
          </p>

          <div className="grid grid-cols-2 gap-4 w-full mb-10">
            <div className="bg-background/50 border border-white/5 rounded-2xl p-6 flex flex-col items-center">
              <span className="text-muted-foreground font-semibold mb-1">Accuracy</span>
              <span className="text-4xl font-black text-amber-400">{accuracy}%</span>
            </div>
            <div className="bg-background/50 border border-white/5 rounded-2xl p-6 flex flex-col items-center">
              <span className="text-muted-foreground font-semibold mb-1">Correct</span>
              <span className="text-4xl font-black text-emerald-400">{score}/{activeCards.length}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <button
              onClick={handleRestart}
              className="flex-1 px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-5 h-5" />
              Practice Again
            </button>
            <button
              onClick={() => setShowSetup(true)}
              className="flex-1 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all border border-white/10 flex items-center justify-center gap-2 cursor-pointer"
            >
              <SlidersHorizontal className="w-5 h-5" />
              Change Card Count
            </button>
            <button
              onClick={() => router.push('/')}
              className="flex-1 px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all border border-white/10 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Home className="w-5 h-5" />
              Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== MAIN LISTENING GAME SCREEN =====
  const bgClass =
    status === 'correct' ? 'bg-emerald-500/10' :
    status === 'wrong' ? 'bg-rose-500/10' :
    'bg-transparent';

  const replayAudioBtnClass =
    status === 'correct' ? 'bg-emerald-500 text-white shadow-[0_0_30px_rgba(16,185,129,0.5)]' :
    status === 'wrong' ? 'bg-rose-500 text-white shadow-[0_0_30px_rgba(244,63,94,0.5)]' :
    'bg-gradient-to-tr from-amber-400 to-amber-600 text-white hover:from-amber-300 hover:to-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.4)]';

  return (
    <div className={`min-h-screen text-foreground flex flex-col font-sans transition-colors duration-500 ${bgClass}`}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 relative z-10">
        <ModeSwitcher currentMode="Listening" setId={set.id} />

        <div className="flex items-center gap-2 font-mono text-sm font-bold bg-white/5 px-4 py-1.5 rounded-full border border-white/10">
          <span className="text-amber-400">{currentIndex + 1}</span>
          <span className="text-white/40">/</span>
          <span className="text-white/80">{activeCards.length}</span>
        </div>

        <div className="flex items-center gap-3">
          <VoiceSettingsTriggerButton />
          <button
            onClick={() => router.push('/')}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Main Game Container */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 max-w-2xl mx-auto w-full">
        {currentCard && (
          <div className="w-full flex flex-col items-center">
            
            {/* Audio Replay Button */}
            <div className="relative mb-8">
              <div className="absolute -inset-4 bg-amber-500/20 rounded-full blur-xl animate-pulse pointer-events-none" />
              <button
                onClick={() => playAudio(currentCard.audio_url, currentCard.term)}
                className={`relative w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer ${replayAudioBtnClass}`}
                title="Play Audio"
              >
                <Volume2 className="w-12 h-12" />
              </button>
            </div>

            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-6">
              Listen and type what you hear
            </p>

            {/* Form Input */}
            <form onSubmit={handleSubmit} className="w-full space-y-4">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={userInput}
                  onChange={(e) => {
                    setUserInput(e.target.value);
                    if (status === 'wrong') setStatus('idle');
                  }}
                  placeholder="Type the word or phrase..."
                  className={`w-full py-4 px-6 rounded-2xl bg-card/60 border text-center text-xl sm:text-2xl font-bold text-white placeholder:text-muted-foreground/50 focus:outline-none transition-all duration-300 ${
                    status === 'correct'
                      ? 'border-emerald-500 ring-4 ring-emerald-500/20 text-emerald-300'
                      : status === 'wrong'
                      ? 'border-rose-500 ring-4 ring-rose-500/20 text-rose-300'
                      : 'border-white/15 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/20'
                  }`}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                />

                {status === 'correct' && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                )}
                {status === 'wrong' && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-rose-400">
                    <XCircle className="w-7 h-7" />
                  </div>
                )}
              </div>

              {/* Reveal Correct Answer if Wrong */}
              {status === 'wrong' && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center animate-in fade-in zoom-in duration-200">
                  <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block mb-1">
                    Correct Answer:
                  </span>
                  <span className="text-2xl font-black text-white">{currentCard.term}</span>
                  {currentCard.definition && (
                    <span className="text-xs text-muted-foreground block mt-1">
                      ({currentCard.definition})
                    </span>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSkip}
                  className="px-6 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white font-bold transition border border-white/10 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <SkipForward className="w-5 h-5" /> Skip
                </button>

                <button
                  type="submit"
                  disabled={!userInput.trim() || status === 'correct'}
                  className="flex-1 py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-extrabold transition shadow-[0_0_25px_rgba(245,158,11,0.3)] hover:shadow-[0_0_35px_rgba(245,158,11,0.5)] text-base cursor-pointer"
                >
                  {status === 'wrong' ? 'Try Again' : 'Check Answer →'}
                </button>
              </div>
            </form>

          </div>
        )}
      </main>

      <VoiceSettingsSidebar />
    </div>
  );
}
