'use client';

import { RefObject, useRef, useEffect } from 'react';
import { HelpCircle, Check, X, Volume2 } from 'lucide-react';
import { playAudio } from '@/lib/speech';
import { ReviewCard } from '../types';

interface ReviewInputFormProps {
  inputRef: RefObject<HTMLInputElement | null>;
  inputValue: string;
  setInputValue: (val: string) => void;
  isChecking: boolean;
  feedback: 'correct' | 'incorrect' | null;
  currentCard: ReviewCard['card'];
  onCheckAnswer: (isDontKnow?: boolean) => void;
  onNext: () => void;
}

export function ReviewInputForm({
  inputRef,
  inputValue,
  setInputValue,
  isChecking,
  feedback,
  currentCard,
  onCheckAnswer,
  onNext,
}: ReviewInputFormProps) {
  const submitTimeRef = useRef<number>(0);

  useEffect(() => {
    if (feedback !== null) {
      submitTimeRef.current = Date.now();
    }
  }, [feedback]);

  useEffect(() => {
    if (feedback !== 'incorrect') return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (Date.now() - submitTimeRef.current < 400) {
          return;
        }
        e.preventDefault();
        onNext();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [feedback, onNext]);

  const handleNextClick = () => {
    if (Date.now() - submitTimeRef.current < 300) {
      return;
    }
    onNext();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim() && !feedback && !isChecking) {
      submitTimeRef.current = Date.now();
      onCheckAnswer(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (inputValue.trim() && !isChecking && !feedback) {
          submitTimeRef.current = Date.now();
          onCheckAnswer(false);
        }
      }}
      className="w-full flex flex-col"
    >
      {/* Input Field */}
      <div className="relative mb-6 group">
        <div
          className={`pointer-events-none absolute -inset-0.5 bg-gradient-to-r ${
            feedback === 'correct'
              ? 'from-green-500 to-emerald-500'
              : feedback === 'incorrect'
              ? 'from-red-500 to-rose-500'
              : 'from-[#b892ff] to-[#4255ff]'
          } rounded-2xl blur opacity-30 group-focus-within:opacity-100 transition duration-500`}
        ></div>
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
            <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-2 animate-in zoom-in">
              <button
                type="button"
                onClick={() => playAudio(undefined, currentCard.term)}
                className="w-8 h-8 bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/40 rounded-full flex items-center justify-center transition cursor-pointer"
                title="Play pronunciation"
              >
                <Volume2 className="w-4 h-4" />
              </button>
              <div className="w-8 h-8 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center">
                <Check className="w-5 h-5" />
              </div>
            </div>
          )}
          {feedback === 'incorrect' && (
            <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-2 animate-in zoom-in">
              <button
                type="button"
                onClick={() => playAudio(undefined, currentCard.term)}
                className="w-8 h-8 bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/40 rounded-full flex items-center justify-center transition cursor-pointer"
                title="Play pronunciation"
              >
                <Volume2 className="w-4 h-4" />
              </button>
              <div className="w-8 h-8 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center">
                <X className="w-5 h-5" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls & Feedback */}
      <div className="min-h-[8rem]">
        {!feedback ? (
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => {
                submitTimeRef.current = Date.now();
                onCheckAnswer(true);
              }}
              disabled={isChecking}
              className="flex-1 py-4 px-6 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-colors border border-white/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <HelpCircle className="w-5 h-5" />
              Don't Know
            </button>
            <button
              type="submit"
              disabled={!inputValue.trim() || isChecking}
              className="flex-[2] py-4 px-6 bg-gradient-to-r from-[#4255ff] to-[#6d7bff] hover:from-[#5b6aff] hover:to-[#8a94ff] text-white font-bold rounded-2xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              Check Answer
            </button>
          </div>
        ) : (
          <div
            className={`p-6 rounded-2xl border ${
              feedback === 'correct' ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'
            } animate-in slide-in-from-bottom-4 flex flex-col items-center text-center`}
          >
            {feedback === 'correct' && (
              <div className="flex items-center gap-2 text-green-400 font-bold text-lg py-2">
                <Check className="w-6 h-6" /> Correct! Excellent job!
              </div>
            )}

            {feedback === 'incorrect' && (
              <div className="mb-4 flex flex-col items-center">
                <p className="text-red-300 font-medium mb-1">Correct answer:</p>
                <div className="flex items-center justify-center gap-2">
                  <p className="text-2xl font-bold text-white">{currentCard.term}</p>
                  <button
                    type="button"
                    onClick={() => playAudio(undefined, currentCard.term)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-cyan-300 transition cursor-pointer"
                    title="Play pronunciation"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>
                {(currentCard.phonetic || currentCard.part_of_speech) && (
                  <div className="flex items-center justify-center gap-2 mt-1">
                    {currentCard.phonetic && <span className="text-sm text-muted-foreground">{currentCard.phonetic}</span>}
                    {currentCard.part_of_speech && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white/10 text-purple-300 italic">
                        {currentCard.part_of_speech}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {feedback === 'incorrect' && (
              <button
                type="button"
                onClick={handleNextClick}
                className="w-full py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors cursor-pointer"
              >
                Got it, next card (Press Enter or Click)
              </button>
            )}
          </div>
        )}
      </div>
    </form>
  );
}

