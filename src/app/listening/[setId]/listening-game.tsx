'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Headphones, X, SkipForward, Home, RefreshCw, Trophy, CheckCircle2, XCircle, Volume2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ModeSwitcher } from '@/components/shared/mode-switcher';
import { recordStudyActivity } from '@/actions/study';
import { recordBulkCardReviews } from '@/actions/review';
import { logGameSession, checkNewCardsForSession } from '@/actions/game';
import { NewWordsWarmup } from '@/components/shared/new-words-warmup';
import { VoiceSettingsSidebar, VoiceSettingsTriggerButton } from '@/components/shared/voice-settings-sidebar';

import { playAudio } from '@/lib/speech';

interface SetData {
  id: string;
  title: string;
}

interface CardData {
  id: string;
  term: string;
  definition: string;
  phonetic?: string | null;
  part_of_speech?: string | null;
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

  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [userInput, setUserInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const correctCardsRef = useRef<Set<string>>(new Set());
  const currentCard = cards[currentIndex];

  const [newCardsForWarmup, setNewCardsForWarmup] = useState<any[]>([]);
  const [showWarmup, setShowWarmup] = useState(false);

  useEffect(() => {
    if (cards && cards.length > 0) {
      checkNewCardsForSession(cards.map(c => c.id)).then(unreviewed => {
        if (unreviewed && unreviewed.length > 0) {
          setNewCardsForWarmup(unreviewed);
          setShowWarmup(true);
        }
      });
    }
  }, [cards]);

  useEffect(() => {
    if (!isFinished && currentCard && !showWarmup) {
      playAudio(currentCard.audio_url, currentCard.term);
      setUserInput('');
      setStatus('idle');
      // Focus input automatically
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  }, [currentIndex, isFinished, currentCard, showWarmup]);

  // Save results
  useEffect(() => {
    if (!isFinished) return;
    (async () => {
      setIsSaving(true);
      try {
        const accuracy = Math.round((score / cards.length) * 100);
        const xp = Math.round(score * 10);
        
        const reviews = cards.map(c => ({
          cardId: c.id,
          quality: correctCardsRef.current.has(c.id) ? 4 : 1
        }));

        await Promise.all([
          recordStudyActivity(set.id, xp, cards.length, 'listening'),
          recordBulkCardReviews(reviews, 'listening'),
          logGameSession({
            setId: set.id,
            mode: 'listening',
            totalCards: cards.length,
            correctCount: score,
            incorrectCount: cards.length - score,
            pointsEarned: xp
          })
        ]);
      } catch (e) {
        console.warn('Error saving results:', e);
      } finally {
        setIsSaving(false);
      }
    })();
  }, [isFinished, score, cards.length, set.id, cards]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (status === 'correct') return;
    if (!userInput.trim()) return;

    const target = currentCard?.term || '';
    if (normalizeText(userInput) === normalizeText(target)) {
      setStatus('correct');
      if (currentCard) {
        correctCardsRef.current.add(currentCard.id);
      }
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#4ade80', '#22c55e', '#16a34a'],
      });
      setScore(prev => prev + 1);

      setTimeout(() => {
        const nextIndex = currentIndex + 1;
        if (nextIndex < cards.length) {
          setCurrentIndex(nextIndex);
        } else {
          setIsFinished(true);
        }
      }, 1500);
    } else {
      setStatus('wrong');
      if (inputRef.current) {
         inputRef.current.select();
      }
    }
  };

  const handleSkip = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < cards.length) {
      setCurrentIndex(nextIndex);
    } else {
      setIsFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setScore(0);
    setIsFinished(false);
    setIsSaving(false);
    setStatus('idle');
    setUserInput('');
  };

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
    const accuracy = cards.length > 0 ? Math.round((score / cards.length) * 100) : 0;

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
            You completed the listening practice!
          </p>

          <div className="grid grid-cols-2 gap-4 w-full mb-10">
            <div className="bg-background/50 border border-white/5 rounded-2xl p-6 flex flex-col items-center">
              <span className="text-muted-foreground font-semibold mb-1">Accuracy</span>
              <span className="text-4xl font-black text-amber-400">{accuracy}%</span>
            </div>
            <div className="bg-background/50 border border-white/5 rounded-2xl p-6 flex flex-col items-center">
              <span className="text-muted-foreground font-semibold mb-1">Correct</span>
              <span className="text-4xl font-black text-emerald-400">{score}/{cards.length}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <button
              onClick={handleRestart}
              className="flex-1 px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Practice Again
            </button>
            <button
              onClick={() => router.push('/')}
              className="flex-1 px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all border border-white/10 flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== MAIN GAME SCREEN =====
  const bgClass =
    status === 'correct' ? 'bg-emerald-500/10' :
    status === 'wrong' ? 'bg-rose-500/10' :
    'bg-transparent';

  const replayAudioBtnClass =
    status === 'correct'
      ? 'bg-emerald-500/20 text-emerald-400'
      : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30';

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans overflow-hidden relative">
      <div className={`absolute inset-0 transition-colors duration-700 ${bgClass}`} />

      <header className="flex items-center justify-between px-6 py-4 relative z-10">
        <ModeSwitcher currentMode="Listening" setId={set.id} />

        <div className="flex flex-col items-center absolute left-1/2 -translate-x-1/2">
          <span className="text-sm font-bold text-foreground mb-1">
            {currentIndex + 1} / {cards.length}
          </span>
          <span className="text-sm font-bold text-muted-foreground">{set.title}</span>
        </div>

        <div className="flex items-center gap-3">
          <VoiceSettingsTriggerButton />
          <button
            onClick={() => router.push('/')}
            className="text-muted-foreground hover:text-foreground transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 max-w-3xl mx-auto w-full relative z-10">
        <div className="w-full bg-card/60 backdrop-blur-xl border border-white/10 rounded-3xl p-10 md:p-16 flex flex-col items-center justify-center shadow-2xl relative min-h-[420px]">
          
          <button 
            onClick={() => playAudio(currentCard.audio_url, currentCard.term)}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 mb-6 shadow-lg cursor-pointer hover:scale-105 ${replayAudioBtnClass}`}
            title="Play Audio"
          >
            <Volume2 className="w-10 h-10" />
          </button>

          {/* Definition Hint */}
          <div className="text-center max-w-md mb-6">
            <p className="text-muted-foreground text-sm leading-relaxed">
              {currentCard.definition}
              {currentCard.part_of_speech && (
                <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded bg-white/10 text-purple-300 italic">
                  {currentCard.part_of_speech}
                </span>
              )}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col items-center gap-6">
             <input
                ref={inputRef}
                type="text"
                placeholder="Type what you hear..."
                className={`w-full px-6 py-4 text-xl md:text-2xl text-center font-bold bg-background/50 border-2 rounded-2xl outline-none transition-all focus:border-amber-500/50 placeholder:text-muted-foreground/50
                  ${status === 'correct' ? 'border-emerald-500/50 text-emerald-400' : status === 'wrong' ? 'border-rose-500/50 text-rose-400' : 'border-white/10 text-white'}
                `}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                disabled={status === 'correct'}
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck="false"
             />

             {/* Feedback area */}
             <div className="min-h-[40px] flex flex-col items-center justify-center w-full">
                {status === 'correct' && (
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-lg animate-in zoom-in duration-300">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Correct! 🎉</span>
                  </div>
                )}

                {status === 'wrong' && (
                  <div className="flex flex-col items-center text-center gap-2 animate-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center gap-2 text-rose-400 font-bold">
                      <XCircle className="w-5 h-5" />
                      <span>Not quite right. Try again!</span>
                    </div>
                  </div>
                )}
             </div>

             <button 
                type="submit"
                disabled={status === 'correct' || !userInput.trim()}
                className="w-full py-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)]"
             >
                Check Answer
             </button>
          </form>
        </div>

        <button
          onClick={handleSkip}
          className="mt-8 flex items-center gap-2 text-muted-foreground hover:text-white transition-colors py-2 px-4 rounded-full hover:bg-white/5 font-semibold cursor-pointer"
        >
          Skip <SkipForward className="w-4 h-4" />
        </button>
      </main>
      <VoiceSettingsSidebar />
    </div>
  );
}
