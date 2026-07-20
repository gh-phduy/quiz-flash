'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Flame, ArrowRight, X, Trophy, Check, HelpCircle, RefreshCcw, Home } from 'lucide-react';
import { recordCardReview } from '@/actions/review';
import { recordPoints } from '@/actions/study';
import Link from 'next/link';

interface ReviewCard {
  id: string; // card_review.id
  card_id: string;
  easiness_factor: number;
  repetitions: number;
  interval_days: number;
  next_review_date: string;
  card: {
    id: string;
    set_id: string;
    term: string;
    definition: string;
    phonetic?: string;
  };
}

interface ReviewGameProps {
  cards: ReviewCard[];
}

export default function ReviewGame({ cards }: ReviewGameProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);

  const currentCard = cards[currentIndex]?.card;

  useEffect(() => {
    if (inputRef.current && !feedback && !isFinished) {
      inputRef.current.focus();
    }
  }, [currentIndex, feedback, isFinished]);

  const handleNext = () => {
    setInputValue('');
    setFeedback(null);
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      finishReview();
    }
  };

  const checkAnswer = async (isDontKnow = false) => {
    if (!currentCard || feedback) return;
    setIsChecking(true);

    const userTerm = inputValue.trim().toLowerCase();
    const correctTerm = currentCard.term.trim().toLowerCase();
    
    // Check ignoring case and leading/trailing whitespace
    const isCorrect = !isDontKnow && userTerm === correctTerm;

    setFeedback(isCorrect ? 'correct' : 'incorrect');

    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
    } else {
      setIncorrectCount(prev => prev + 1);
    }

    // Record review: 4 if correct, 1 if incorrect
    await recordCardReview(currentCard.id, isCorrect ? 4 : 1).catch(err => {
      console.error('Failed to record card review:', err);
    });

    setIsChecking(false);

    if (isCorrect) {
      // Auto advance on correct after a short delay
      setTimeout(() => {
        handleNext();
      }, 1000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      checkAnswer();
    }
  };

  const finishReview = async () => {
    setIsFinished(true);
    // Award 10 points per correct answer, 2 per incorrect
    const earned = (correctCount * 10) + (incorrectCount * 2);
    setPointsEarned(earned);
    await recordPoints(earned);
    
    import('canvas-confetti').then(({ default: confetti }) => {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#b892ff', '#6d7bff', '#ff92d0', '#4255ff']
      });
    });
  };

  if (isFinished) {
    const accuracy = Math.round((correctCount / cards.length) * 100) || 0;
    
    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="w-24 h-24 bg-gradient-to-br from-[#b892ff] to-[#4255ff] rounded-[2rem] rotate-12 flex items-center justify-center mb-8 shadow-2xl shadow-[#b892ff]/30">
          <div className="w-full h-full bg-white/10 backdrop-blur-sm rounded-[2rem] flex items-center justify-center -rotate-12">
            <Trophy className="w-12 h-12 text-white drop-shadow-md" />
          </div>
        </div>

        <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#9fa6ff] via-[#b892ff] to-[#ff92d0] drop-shadow-sm mb-4">
          Review Complete!
        </h2>
        <p className="text-xl text-muted-foreground font-medium mb-10 max-w-md">
          You've successfully completed your daily review and reinforced your memory.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mb-10">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-5 flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <p className="text-sm text-muted-foreground font-bold uppercase tracking-wider mb-2">Accuracy</p>
            <p className="text-3xl font-black text-white">{accuracy}%</p>
          </div>
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-5 flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#ff92d0]/10 to-[#b892ff]/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <p className="text-sm text-muted-foreground font-bold uppercase tracking-wider mb-2">Points</p>
            <p className="text-3xl font-black text-[#ff92d0]">+{pointsEarned}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-5 flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <p className="text-sm text-muted-foreground font-bold uppercase tracking-wider mb-2">Correct</p>
            <p className="text-3xl font-black text-green-400">{correctCount}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-5 flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <p className="text-sm text-muted-foreground font-bold uppercase tracking-wider mb-2">Incorrect</p>
            <p className="text-3xl font-black text-red-400">{incorrectCount}</p>
          </div>
        </div>

        <Link
          href="/status"
          className="group relative px-8 py-4 bg-gradient-to-r from-[#4255ff] to-[#6d7bff] text-white rounded-2xl font-bold text-lg overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(66,85,255,0.4)] flex items-center gap-3 w-full sm:w-auto justify-center"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
          <span className="relative z-10 flex items-center gap-2">
            View My Stats <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </span>
        </Link>
      </div>
    );
  }

  if (!currentCard) return null;

  const progress = ((currentIndex) / cards.length) * 100;

  return (
    <div className="max-w-2xl mx-auto flex flex-col animate-in fade-in duration-500">
      {/* Header & Progress */}
      <div className="flex items-center justify-between mb-8">
        <Link href="/" className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors text-muted-foreground hover:text-white">
          <Home className="w-5 h-5" />
        </Link>
        <div className="flex-1 mx-6">
          <div className="flex justify-between text-sm font-bold text-muted-foreground mb-2">
            <span className="text-[#b892ff]">Reviewing</span>
            <span>{currentIndex + 1} / {cards.length}</span>
          </div>
          <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
            <div 
              className="h-full bg-gradient-to-r from-[#6d7bff] to-[#b892ff] transition-all duration-500 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Card Definition */}
      <div className="bg-card/40 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 min-h-[250px] flex flex-col items-center justify-center text-center mb-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#b892ff]/30 to-transparent"></div>
        <h3 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-4">{currentCard.definition}</h3>
      </div>

      {/* Input Section */}
      <div className="relative mb-6 group">
        <div className={`absolute -inset-0.5 bg-gradient-to-r ${feedback === 'correct' ? 'from-green-500 to-emerald-500' : feedback === 'incorrect' ? 'from-red-500 to-rose-500' : 'from-[#b892ff] to-[#4255ff]'} rounded-2xl blur opacity-30 group-focus-within:opacity-100 transition duration-500`}></div>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={feedback !== null || isChecking}
            placeholder="Type the exact term..."
            className="w-full bg-gray-900/90 border border-white/10 rounded-2xl px-6 py-5 text-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-0 transition-all disabled:opacity-80"
          />
          {feedback === 'correct' && (
            <div className="absolute right-5 top-1/2 -translate-y-1/2 w-8 h-8 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center animate-in zoom-in">
              <Check className="w-5 h-5" />
            </div>
          )}
          {feedback === 'incorrect' && (
            <div className="absolute right-5 top-1/2 -translate-y-1/2 w-8 h-8 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center animate-in zoom-in">
              <X className="w-5 h-5" />
            </div>
          )}
        </div>
      </div>

      {/* Controls & Feedback */}
      <div className="h-32">
        {!feedback ? (
          <div className="flex gap-4">
            <button
              onClick={() => checkAnswer(true)}
              disabled={isChecking}
              className="flex-1 py-4 px-6 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-colors border border-white/10 flex items-center justify-center gap-2"
            >
              <HelpCircle className="w-5 h-5" />
              Don't Know
            </button>
            <button
              onClick={() => checkAnswer(false)}
              disabled={!inputValue.trim() || isChecking}
              className="flex-[2] py-4 px-6 bg-gradient-to-r from-[#4255ff] to-[#6d7bff] hover:from-[#5b6aff] hover:to-[#8a94ff] text-white font-bold rounded-2xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Check Answer
            </button>
          </div>
        ) : (
          <div className={`p-6 rounded-2xl border ${feedback === 'correct' ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'} animate-in slide-in-from-bottom-4 flex flex-col items-center text-center`}>
            {feedback === 'incorrect' && (
              <div className="mb-4">
                <p className="text-red-300 font-medium mb-1">Correct answer:</p>
                <p className="text-2xl font-bold text-white">{currentCard.term}</p>
                {currentCard.phonetic && <p className="text-sm text-muted-foreground mt-1">{currentCard.phonetic}</p>}
              </div>
            )}
            
            {feedback === 'incorrect' && (
              <button
                onClick={handleNext}
                autoFocus
                className="w-full py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors"
              >
                Got it, next card
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
