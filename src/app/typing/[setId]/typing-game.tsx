'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Keyboard, 
  Volume2, 
  VolumeX,
  ArrowLeft, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Trophy, 
  ArrowRight,
  HelpCircle,
  Play,
  X,
  Home
} from 'lucide-react';
import { ModeSwitcher } from '@/components/shared/mode-switcher';
import { VoiceSettingsSidebar, VoiceSettingsTriggerButton } from '@/components/shared/voice-settings-sidebar';
import { NewWordsWarmup } from '@/components/shared/new-words-warmup';
import { recordCardReview } from '@/actions/review';
import { recordPoints, recordStudyActivity } from '@/actions/study';
import { generateGameSession, checkNewCardsForSession, logGameSession } from '@/actions/game';
import { playAudio } from '@/lib/speech';

interface TypingCard {
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

interface TypingGameProps {
  set: {
    id: string;
    title: string;
    description?: string | null;
  };
  cards: TypingCard[];
}

export default function TypingGame({ set, cards }: TypingGameProps) {
  const router = useRouter();

  // Setup state
  const [gameState, setGameState] = useState<'setup' | 'playing' | 'summary'>('setup');
  const [selectedLimit, setSelectedLimit] = useState<number>(Math.min(20, cards.length));
  const [isCustomLimit, setIsCustomLimit] = useState(false);
  const [customVal, setCustomVal] = useState(10);
  const [answerWith, setAnswerWith] = useState<'term' | 'definition'>('term');
  const [activeCards, setActiveCards] = useState<TypingCard[]>([]);

  // Warmup state for new cards
  const [showWarmup, setShowWarmup] = useState(false);
  const [newCardsForWarmup, setNewCardsForWarmup] = useState<TypingCard[]>([]);

  // Playing state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // Score state
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const currentCard = activeCards[currentIndex];

  const [isAutoPlay, setIsAutoPlay] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('autoplay_all');
      if (stored !== null) {
        setIsAutoPlay(stored === 'true');
      }
    }
  }, []);

  useEffect(() => {
    if (gameState === 'playing' && !showWarmup && currentCard && answerWith === 'definition' && isAutoPlay) {
      setTimeout(() => {
        playAudio(currentCard.audio_url || undefined, currentCard.term);
      }, 300);
    }
  }, [currentIndex, gameState, showWarmup, currentCard, answerWith, isAutoPlay]);

  useEffect(() => {
    if (gameState === 'playing' && !showWarmup && inputRef.current && !feedback) {
      inputRef.current.focus();
    }
  }, [currentIndex, feedback, gameState, showWarmup]);

  // Audio helper strictly for English Term
  const playCardAudio = (term: string, audioUrl?: string | null) => {
    setPlayingAudioId(term);
    playAudio(audioUrl || undefined, term);
    setTimeout(() => setPlayingAudioId(null), 1200);
  };

  const handleStartGame = async () => {
    setIsChecking(true);
    let newBatch: TypingCard[] = [];
    try {
      const res = await generateGameSession(set.id, selectedLimit, 'review');
      const rawCards = res?.cards || res?.data || (Array.isArray(res) ? res : []);
      if (rawCards && rawCards.length > 0) {
        newBatch = rawCards.map((c: any) => ({
          id: c.id,
          term: c.term,
          definition: c.definition,
          image_url: c.image_url,
          phonetic: c.phonetic,
          phonetic_uk: c.phonetic_uk,
          part_of_speech: c.part_of_speech,
          cefr_level: c.cefr_level,
          audio_url: c.audio_url,
        }));
      }
    } catch (err) {
      console.error('Error starting typing session:', err);
    }

    if (newBatch.length === 0) {
      newBatch = cards.slice(0, selectedLimit);
    }

    // Check for unreviewed new cards for Warmup
    try {
      const unreviewed = await checkNewCardsForSession(newBatch.map(c => c.id));
      if (unreviewed && unreviewed.length > 0) {
        const unreviewedMap = new Map(unreviewed.map((c: any) => [c.id, c]));
        const warmupList: TypingCard[] = newBatch.filter(c => unreviewedMap.has(c.id));
        setNewCardsForWarmup(warmupList);
        setShowWarmup(true);

        const unreviewedIdSet = new Set(warmupList.map(c => c.id));
        const remainingCards = newBatch.filter(c => !unreviewedIdSet.has(c.id));
        setActiveCards([...warmupList, ...remainingCards]);
      } else {
        setShowWarmup(false);
        setActiveCards(newBatch);
      }
    } catch {
      setShowWarmup(false);
      setActiveCards(newBatch);
    }

    setCurrentIndex(0);
    setCorrectCount(0);
    setIncorrectCount(0);
    setInputValue('');
    setFeedback(null);
    setGameState('playing');
    setIsChecking(false);
  };

  const handleCheckAnswer = async (isDontKnow = false) => {
    if (!currentCard || feedback || isChecking) return;
    setIsChecking(true);

    const userText = inputValue.trim().toLowerCase();
    const targetText = answerWith === 'term' 
      ? currentCard.term.trim().toLowerCase()
      : currentCard.definition.trim().toLowerCase();

    // Flexible string matching
    const isCorrect = !isDontKnow && (
      userText === targetText ||
      (answerWith === 'definition' && targetText.split(/[,;\/]/).some(part => part.trim() === userText))
    );

    const quality = isCorrect ? 4 : 1;
    setFeedback(isCorrect ? 'correct' : 'incorrect');

    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
    } else {
      setIncorrectCount(prev => prev + 1);
    }

    // Auto-play audio ONLY if English term is displayed or revealed
    if (answerWith === 'definition' || isCorrect) {
      playCardAudio(currentCard.term, currentCard.audio_url);
    }

    // Record review to backend with 'typing' mode (SM-2 exempt!)
    recordCardReview(currentCard.id, quality, 'typing').catch(console.error);

    setIsChecking(false);

    if (isCorrect) {
      setTimeout(() => {
        handleNextCard();
      }, 1100);
    }
  };

  const handleNextCard = () => {
    setInputValue('');
    setFeedback(null);
    if (currentIndex < activeCards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      finishGame();
    }
  };

  const finishGame = async () => {
    setGameState('summary');
    setIsSaving(true);
    const finalCorrect = correctCount + (feedback === 'correct' ? 1 : 0);
    const finalIncorrect = incorrectCount + (feedback === 'incorrect' ? 1 : 0);
    const earned = finalCorrect * 10 + finalIncorrect * 2;
    setPointsEarned(earned);

    const accuracy = activeCards.length > 0 ? Math.round((finalCorrect / activeCards.length) * 100) : 0;

    if (accuracy === 100) {
      import('canvas-confetti').then(({ default: confetti }) => {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#38bdf8', '#818cf8', '#c084fc', '#4f46e5'],
        });
      });
    }

    try {
      await Promise.all([
        recordPoints(earned),
        recordStudyActivity(set.id, earned, activeCards.length, 'typing'),
        logGameSession({
          setId: set.id,
          mode: 'typing',
          totalCards: activeCards.length,
          correctCount: finalCorrect,
          incorrectCount: finalIncorrect,
          durationSeconds: activeCards.length * 5,
          newCardsCount: 0,
          reviewCardsCount: activeCards.length,
          pointsEarned: earned,
        }),
      ]);
    } catch (err) {
      console.error('Error recording typing session:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // 1. SETUP SCREEN (Matches layout with listening/speaking games)
  if (gameState === 'setup') {
    const limits = [5, 10, 15, 20, cards.length].filter((val, index, self) => val <= cards.length && self.indexOf(val) === index);

    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-500/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Back navigation */}
        <div className="absolute top-4 left-4 z-20">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors cursor-pointer text-xs font-bold bg-slate-900/60 border border-white/10 px-3.5 py-2 rounded-xl"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Set</span>
          </button>
        </div>

        <div className="w-full max-w-xl bg-card/60 backdrop-blur-2xl border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 flex flex-col items-center">
          
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-400 to-sky-600 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(56,189,248,0.4)]">
            <Keyboard className="w-8 h-8 text-white" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white text-center mb-1">
            Typing Practice Setup
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-6 max-w-md font-semibold">
            Choose your practice mode and card batch limit to start typing.
          </p>

          {/* Practice Mode Selection */}
          <div className="w-full mb-6">
            <label className="text-xs font-black uppercase tracking-wider text-white/70 block mb-2.5">
              Practice Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAnswerWith('term')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-[100px] ${
                  answerWith === 'term'
                    ? 'bg-sky-500/20 border-sky-500 text-white shadow-lg'
                    : 'bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10'
                }`}
              >
                <span className="font-bold text-sm text-white flex items-center gap-1.5 mb-1">
                  Type Term (English)
                </span>
                <span className="text-[11px] leading-snug opacity-80">
                  Prompt shows Definition, type the English word
                </span>
              </button>

              <button
                type="button"
                onClick={() => setAnswerWith('definition')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-[100px] ${
                  answerWith === 'definition'
                    ? 'bg-sky-500/20 border-sky-500 text-white shadow-lg'
                    : 'bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10'
                }`}
              >
                <span className="font-bold text-sm text-white flex items-center gap-1.5 mb-1">
                  Type Def (VN)
                </span>
                <span className="text-[11px] leading-snug opacity-80">
                  Prompt shows English Term + Audio/Phonetics
                </span>
              </button>
            </div>
          </div>

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
                        ? 'bg-sky-500 text-white border-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.4)] scale-105'
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
                    ? 'bg-sky-500 text-white border-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.4)] scale-105'
                    : 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10'
                }`}
              >
                Custom
              </button>
            </div>

            {isCustomLimit && (
              <div className="p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between animate-in slide-in-from-top-2 duration-150">
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
                  className="w-24 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 text-center font-bold"
                />
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleStartGame}
            disabled={isChecking}
            className="w-full py-4 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white font-extrabold rounded-2xl transition shadow-[0_0_25px_rgba(56,189,248,0.4)] flex items-center justify-center gap-2 text-base cursor-pointer"
          >
            {isChecking ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Preparing Waterfall Cards...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Play className="w-5 h-5 fill-current" />
                Start Typing ({selectedLimit} Cards)
              </span>
            )}
          </button>

        </div>
      </div>
    );
  }

  // 1.5. WARMUP SCREEN FOR UNREVIEWED NEW WORDS (Matches exact setup and props layout)
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

  // 2. SUMMARY SCREEN (Matches results layouts)
  if (gameState === 'summary') {
    const accuracy = activeCards.length > 0 ? Math.round((correctCount / activeCards.length) * 100) : 0;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-6 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-sky-500/10 rounded-full blur-[120px] pointer-events-none" />

        {isSaving && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="w-12 h-12 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
          </div>
        )}

        <div className="w-full max-w-2xl bg-card/40 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl relative z-10 flex flex-col items-center">
          <div className="w-24 h-24 bg-gradient-to-br from-sky-400 to-sky-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-sky-500/20">
            <Trophy className="w-12 h-12 text-white" />
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/80 mb-2">
            Great Typing!
          </h1>
          <p className="text-lg text-muted-foreground mb-8 text-center max-w-md">
            You completed typing practice for {activeCards.length} cards!
          </p>

          <div className="grid grid-cols-3 gap-4 w-full mb-10 text-center">
            <div className="bg-background/50 border border-white/5 rounded-2xl p-5 flex flex-col items-center">
              <span className="text-muted-foreground font-bold text-xs uppercase mb-1">Accuracy</span>
              <span className="text-3xl font-black text-sky-400">{accuracy}%</span>
            </div>
            <div className="bg-background/50 border border-white/5 rounded-2xl p-5 flex flex-col items-center">
              <span className="text-muted-foreground font-bold text-xs uppercase mb-1">Correct</span>
              <span className="text-3xl font-black text-emerald-400">{correctCount}/{activeCards.length}</span>
            </div>
            <div className="bg-background/50 border border-white/5 rounded-2xl p-5 flex flex-col items-center">
              <span className="text-muted-foreground font-bold text-xs uppercase mb-1">Points</span>
              <span className="text-3xl font-black text-amber-400">+{pointsEarned}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <button
              onClick={() => handleStartGame()}
              className="flex-1 px-8 py-4 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(56,189,248,0.3)] hover:shadow-[0_0_30px_rgba(56,189,248,0.5)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" />
              Practice Again
            </button>
            <button
              onClick={() => setGameState('setup')}
              className="flex-1 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all border border-white/10 flex items-center justify-center gap-2 cursor-pointer"
            >
              Change Settings
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

  // 3. GAMEPLAY SCREEN
  const progressPercent = Math.round(((currentIndex + 1) / activeCards.length) * 100);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-sky-600/10 blur-[130px] rounded-full pointer-events-none" />

      {/* Header Bar */}
      <header className="px-4 sm:px-8 py-4 border-b border-white/10 flex items-center justify-between gap-4 relative z-10 bg-slate-950/60 backdrop-blur-md">
        <ModeSwitcher currentMode="Typing" setId={set.id} />

        {/* Progress Center Bar */}
        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center w-full max-w-[150px] sm:max-w-xs md:max-w-md space-y-1.5 pointer-events-none">
          <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold w-full">
            <span className="text-slate-400">Card {currentIndex + 1} of {activeCards.length}</span>
            <span className="text-sky-400">{progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-white/5">
            <div 
              className="bg-sky-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => {
              const newVal = !isAutoPlay;
              setIsAutoPlay(newVal);
              if (typeof window !== 'undefined') {
                localStorage.setItem('autoplay_all', String(newVal));
              }
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition cursor-pointer text-xs font-bold border ${
              isAutoPlay 
                ? 'bg-sky-500/20 text-sky-400 border-sky-500/30 shadow-[0_0_10px_rgba(56,189,248,0.15)]' 
                : 'bg-transparent text-muted-foreground border-white/10 hover:text-foreground hover:border-white/20'
            }`}
          >
            {isAutoPlay ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Auto-play</span>
          </button>

          <VoiceSettingsTriggerButton />
          
          <button 
            onClick={() => router.push('/')}
            className="p-2 rounded-xl bg-slate-900 border border-white/10 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Exit gameplay"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Gameplay Card */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 flex flex-col justify-center relative z-10 space-y-6">
        
        {/* Question Card Box */}
        <div className={`p-8 sm:p-10 bg-slate-900/90 border rounded-3xl shadow-2xl backdrop-blur-xl transition-all duration-200 space-y-6 ${
          feedback === 'correct' 
            ? 'border-emerald-500/50 shadow-emerald-500/10' 
            : feedback === 'incorrect'
            ? 'border-rose-500/50 shadow-rose-500/10'
            : 'border-white/10'
        }`}>
          {/* Top Label & Audio Button (If English Term is Prompt) */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 px-3 py-1 rounded-full bg-slate-950/60 border border-white/5">
              {answerWith === 'term' ? 'Prompt: Definition (VN)' : 'Prompt: English Term'}
            </span>

            {/* Phonetics & Audio ONLY displayed when Prompt is English Term */}
            {answerWith === 'definition' && currentCard && (
              <button
                type="button"
                onClick={() => playCardAudio(currentCard.term, currentCard.audio_url)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/30 transition-colors cursor-pointer text-xs font-semibold"
              >
                <Volume2 className={`w-4 h-4 ${playingAudioId === currentCard.term ? 'animate-bounce text-indigo-400' : ''}`} />
                <span>Listen</span>
              </button>
            )}
          </div>

          {/* Prompt Text */}
          <div className="space-y-2 text-center py-4">
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              {answerWith === 'term' ? currentCard?.definition : currentCard?.term}
            </h2>

            {/* Phonetic ONLY for English Term */}
            {answerWith === 'definition' && currentCard?.phonetic && (
              <p className="text-sm font-mono text-indigo-300">
                {currentCard.phonetic}
              </p>
            )}
          </div>

          {/* User Input Section */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (feedback) {
                handleNextCard();
              } else {
                handleCheckAnswer();
              }
            }}
            className="space-y-4"
          >
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                disabled={Boolean(feedback)}
                placeholder={
                  answerWith === 'term' 
                    ? "Type English vocabulary word..." 
                    : "Type Vietnamese definition..."
                }
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className={`w-full h-14 pl-5 pr-12 rounded-2xl bg-slate-950/90 border text-base sm:text-lg font-bold text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner ${
                  feedback === 'correct'
                    ? 'border-emerald-500 text-emerald-300 bg-emerald-950/20'
                    : feedback === 'incorrect'
                    ? 'border-rose-500 text-rose-300 bg-rose-950/20'
                    : 'border-white/15 focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/20'
                }`}
              />

              {feedback === 'correct' && (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 absolute right-4 top-1/2 -translate-y-1/2" />
              )}
              {feedback === 'incorrect' && (
                <XCircle className="w-6 h-6 text-rose-400 absolute right-4 top-1/2 -translate-y-1/2" />
              )}
            </div>

            {/* Action Buttons */}
            {!feedback ? (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleCheckAnswer(true)}
                  className="px-4 h-12 rounded-2xl bg-slate-950/60 border border-white/10 hover:bg-slate-800 text-slate-400 hover:text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>Don't Know</span>
                </button>

                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  className="flex-1 h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed font-extrabold text-white text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Answer</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Incorrect Answer Reveal Box */}
                {feedback === 'incorrect' && currentCard && (
                  <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/30 space-y-2 text-left">
                    <div className="text-xs uppercase font-extrabold text-rose-400">Correct Answer:</div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-lg font-bold text-white block">
                          {answerWith === 'term' ? currentCard.term : currentCard.definition}
                        </span>
                        {/* Audio & Phonetic for English Term when revealed */}
                        {answerWith === 'term' && currentCard.phonetic && (
                          <span className="text-xs font-mono text-indigo-300 block">{currentCard.phonetic}</span>
                        )}
                      </div>

                      {/* Audio Button for English Term */}
                      {answerWith === 'term' && (
                        <button
                          type="button"
                          onClick={() => playCardAudio(currentCard.term, currentCard.audio_url)}
                          className="p-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 transition-colors cursor-pointer"
                          title="Listen English pronunciation"
                        >
                          <Volume2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleNextCard}
                  className="w-full h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-500 font-extrabold text-white text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Next Word</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </form>
        </div>

      </main>
      <VoiceSettingsSidebar />
    </div>
  );
}
