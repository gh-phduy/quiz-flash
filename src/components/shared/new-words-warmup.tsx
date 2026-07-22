'use client';

import React, { useState, useEffect } from 'react';
import { Volume2, Sparkles, CheckCircle2, XCircle, ArrowRight, Zap, Play } from 'lucide-react';
import confetti from 'canvas-confetti';
import { playAudio } from '@/lib/speech';
import { VoiceSettingsSidebar, VoiceSettingsTriggerButton } from '@/components/shared/voice-settings-sidebar';

export interface WarmupCard {
  id: string;
  term: string;
  definition: string;
  phonetic?: string | null;
  part_of_speech?: string | null;
  audio_url?: string | null;
  image_url?: string | null;
}

interface NewWordsWarmupProps {
  newCards: WarmupCard[];
  allSetCards?: WarmupCard[];
  onComplete: () => void;
  onSkip?: () => void;
}

export function NewWordsWarmup({ newCards, allSetCards = [], onComplete, onSkip }: NewWordsWarmupProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<'preview' | 'quiz' | 'complete'>('preview');
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isWrong, setIsWrong] = useState(false);
  const [quizOptions, setQuizOptions] = useState<WarmupCard[]>([]);
  const [countdown, setCountdown] = useState(3);

  const currentCard = newCards[currentIndex];

  // Auto play audio when viewing preview card
  useEffect(() => {
    if (phase === 'preview' && currentCard) {
      playAudio(currentCard.audio_url, currentCard.term);
    }
  }, [phase, currentIndex, currentCard]);

  // Generate 4 options for quiz phase
  const generateQuizOptions = (targetCard: WarmupCard) => {
    const pool = (allSetCards.length >= 4 ? allSetCards : newCards).filter(c => c.id !== targetCard.id);
    const shuffledPool = [...pool].sort(() => 0.5 - Math.random()).slice(0, 3);
    const options = [targetCard, ...shuffledPool].sort(() => 0.5 - Math.random());
    return options;
  };

  const handleStartQuiz = () => {
    if (!currentCard) return;
    setQuizOptions(generateQuizOptions(currentCard));
    setSelectedOptionId(null);
    setIsWrong(false);
    setPhase('quiz');
  };

  const handleSelectOption = (option: WarmupCard) => {
    if (selectedOptionId === option.id && isWrong) return;

    setSelectedOptionId(option.id);

    if (option.id === currentCard.id) {
      // Correct!
      setIsWrong(false);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#34d399', '#10b981', '#059669']
      });

      setTimeout(() => {
        const nextIdx = currentIndex + 1;
        if (nextIdx < newCards.length) {
          setCurrentIndex(nextIdx);
          setPhase('preview');
          setSelectedOptionId(null);
        } else {
          // All new cards completed!
          setPhase('complete');
        }
      }, 1000);
    } else {
      // Incorrect! Force try again!
      setIsWrong(true);
    }
  };

  // Countdown timer on completion phase
  useEffect(() => {
    if (phase === 'complete') {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            onComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [phase, onComplete]);

  if (!currentCard && phase !== 'complete') {
    onComplete();
    return null;
  }

  // Completion Screen
  if (phase === 'complete') {
    return (
      <div className="fixed inset-0 bg-[#0d0c22]/90 backdrop-blur-2xl z-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(52,211,153,0.5)] animate-bounce">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-4xl font-black text-white mb-2">Warm-Up Complete!</h2>
        <p className="text-muted-foreground text-lg mb-8 max-w-md">
          You previewed <span className="text-emerald-400 font-bold">{newCards.length} new words</span>. Get ready to play!
        </p>

        <div className="flex items-center gap-3 px-8 py-4 bg-white/10 border border-white/20 rounded-2xl">
          <Zap className="w-6 h-6 text-amber-400 animate-pulse" />
          <span className="text-2xl font-black text-white font-mono">Starting game in {countdown}s</span>
        </div>

        <button
          onClick={onComplete}
          className="mt-6 px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition"
        >
          Skip Countdown & Play Now →
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#0a092d]/95 backdrop-blur-xl z-50 flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Header Bar */}
      <div className="w-full max-w-xl flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 px-3.5 py-1.5 bg-[#b892ff]/20 border border-[#b892ff]/40 rounded-full">
          <Sparkles className="w-4 h-4 text-[#b892ff]" />
          <span className="text-xs font-black uppercase tracking-wider text-[#b892ff]">
            New Words Warm-Up ({currentIndex + 1}/{newCards.length})
          </span>
        </div>

        <div className="flex items-center gap-3">
          <VoiceSettingsTriggerButton />
          {onSkip && (
            <button
              onClick={onSkip}
              className="text-xs font-bold text-white/50 hover:text-white transition"
            >
              Skip Warm-Up →
            </button>
          )}
        </div>
      </div>

      {/* Main Warm-Up Card Container */}
      <div className="w-full max-w-xl bg-card/60 border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md relative overflow-hidden">
        {/* Step Indicator */}
        <div className="flex items-center justify-between text-xs text-muted-foreground font-bold mb-6 pb-4 border-b border-white/10">
          <span>{phase === 'preview' ? 'STEP 1: PREVIEW & PRONOUNCE' : 'STEP 2: QUICK CHOICE CHECK'}</span>
          <span className="text-white/40">{phase === 'preview' ? 'Card Preview' : 'Select Correct Definition'}</span>
        </div>

        {/* Phase 1: Card Preview */}
        {phase === 'preview' && (
          <div className="space-y-6 flex flex-col items-center text-center">
            {currentCard.image_url && (
              <div className="w-32 h-32 relative rounded-2xl overflow-hidden border border-white/10 mb-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={currentCard.image_url} alt={currentCard.term} className="w-full h-full object-cover" />
              </div>
            )}

            <div>
              <div className="flex items-center justify-center gap-3 mb-1">
                <h3 className="text-3xl sm:text-4xl font-black text-white">{currentCard.term}</h3>
                <button
                  onClick={() => playAudio(currentCard.audio_url, currentCard.term)}
                  className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-[#b892ff] transition"
                  title="Play audio"
                >
                  <Volume2 className="w-6 h-6" />
                </button>
              </div>

              {(currentCard.phonetic || currentCard.part_of_speech) && (
                <div className="flex items-center justify-center gap-2 mb-4">
                  {currentCard.phonetic && (
                    <span className="text-sm font-mono text-muted-foreground">{currentCard.phonetic}</span>
                  )}
                  {currentCard.part_of_speech && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white/10 text-purple-300 italic">
                      {currentCard.part_of_speech}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 block mb-1">Meaning</span>
              <p className="text-lg font-bold text-white leading-relaxed">{currentCard.definition}</p>
            </div>

            <button
              onClick={handleStartQuiz}
              className="w-full py-4 bg-gradient-to-r from-[#4255ff] to-[#6b7bff] text-white font-black text-base rounded-2xl hover:opacity-95 transition shadow-[0_0_25px_rgba(66,85,255,0.4)] flex items-center justify-center gap-2 mt-4"
            >
              Got it! Test Me <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Phase 2: Forced-Choice Quiz */}
        {phase === 'quiz' && (
          <div className="space-y-6">
            <div className="text-center mb-4">
              <span className="text-xs font-bold text-[#b892ff] uppercase tracking-widest block mb-1">Question</span>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                What is the meaning of &quot;{currentCard.term}&quot;?
              </h3>
            </div>

            <div className="space-y-3">
              {quizOptions.map((opt, idx) => {
                const isSelected = selectedOptionId === opt.id;
                const isTarget = opt.id === currentCard.id;

                let optClass = "bg-white/5 hover:bg-white/10 border-white/10 text-white";
                if (isSelected) {
                  if (isTarget) {
                    optClass = "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold scale-[1.02]";
                  } else {
                    optClass = "bg-rose-500/20 border-rose-500 text-rose-300 animate-shake";
                  }
                }

                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectOption(opt)}
                    className={`w-full p-4 rounded-2xl border text-left text-sm font-semibold transition-all duration-200 flex items-center justify-between ${optClass}`}
                  >
                    <span>{opt.definition}</span>
                    {isSelected && isTarget && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 ml-2" />}
                    {isSelected && !isTarget && <XCircle className="w-5 h-5 text-rose-400 shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>

            {isWrong && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-center text-xs font-bold text-rose-400 animate-pulse">
                Incorrect answer! Choose the correct option to pass.
              </div>
            )}
          </div>
        )}
      </div>
      <VoiceSettingsSidebar />
    </div>
  );
}
