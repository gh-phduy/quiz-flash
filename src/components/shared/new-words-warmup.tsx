'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Sparkles, CheckCircle2, XCircle, ArrowRight, Zap, Play } from 'lucide-react';
import Image from 'next/image';
import confetti from 'canvas-confetti';
import { playAudio } from '@/lib/speech';
import { VoiceSettingsSidebar, VoiceSettingsTriggerButton } from '@/components/shared/voice-settings-sidebar';
import { useVoiceStore } from '@/store/useVoiceStore';

export interface WarmupCard {
  id: string;
  term: string;
  definition: string;
  phonetic?: string | null;
  phonetic_uk?: string | null;
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
  const { preferredAccent } = useVoiceStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<'preview' | 'quiz' | 'complete'>('preview');
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isWrong, setIsWrong] = useState(false);
  const [quizOptions, setQuizOptions] = useState<WarmupCard[]>([]);
  const [countdown, setCountdown] = useState(3);

  const currentCard = newCards[currentIndex];
  const displayPhonetic = preferredAccent === 'UK'
    ? (currentCard?.phonetic_uk || currentCard?.phonetic)
    : (currentCard?.phonetic || currentCard?.phonetic_uk);

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

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Countdown timer on completion phase
  useEffect(() => {
    if (phase === 'complete') {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            onCompleteRef.current();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [phase]);

  useEffect(() => {
    if (!currentCard && phase !== 'complete') {
      onCompleteRef.current();
    }
  }, [currentCard, phase]);

  if (!currentCard && phase !== 'complete') {
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
  }  return (
    <div className="fixed inset-0 bg-[#07061d]/95 backdrop-blur-2xl z-50 flex flex-col font-sans overflow-hidden">
      {/* Fixed Top Navbar */}
      <header className="w-full px-3.5 sm:px-6 py-3 border-b border-white/10 bg-[#0c0d28]/90 backdrop-blur-md flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#b892ff]/20 border border-[#b892ff]/40 rounded-full">
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#b892ff]" />
          <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-[#b892ff]">
            Warm-Up ({currentIndex + 1}/{newCards.length})
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <VoiceSettingsTriggerButton />
          {onSkip && (
            <button
              onClick={onSkip}
              className="text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10"
            >
              Skip →
            </button>
          )}
        </div>
      </header>

      {/* Main Warm-Up Card Area Centered */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto w-full max-w-lg mx-auto relative z-10">
        {/* Main Warm-Up Card Container */}
        <div className="w-full bg-[#0c0d28]/95 border border-[#b892ff]/30 rounded-3xl p-5 sm:p-8 shadow-[0_0_50px_rgba(66,85,255,0.2)] backdrop-blur-2xl relative overflow-hidden text-white my-auto">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-[#b892ff]/10 rounded-full blur-3xl pointer-events-none" />

          {/* Step Indicator */}
          <div className="flex items-center justify-between text-xs font-bold mb-6 pb-4 border-b border-white/10 relative z-10">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#b892ff] animate-pulse" />
              <span className="text-[#b892ff] font-mono uppercase tracking-wider text-[11px] sm:text-xs">
                {phase === 'preview' ? 'STEP 1: PREVIEW & PRONOUNCE' : 'STEP 2: QUICK CHECK'}
              </span>
            </div>
            <span className="text-slate-400 text-[11px] sm:text-xs">
              {phase === 'preview' ? `Card ${currentIndex + 1} of ${newCards.length}` : 'Select Correct Definition'}
            </span>
          </div>

          {/* Phase 1: Card Preview */}
          {phase === 'preview' && (
            <div className="space-y-5 flex flex-col items-center text-center relative z-10">
              {currentCard.image_url && (
                <div className="w-28 h-28 sm:w-36 sm:h-36 relative rounded-2xl overflow-hidden border border-white/15 shadow-xl mb-1">
                  <Image src={currentCard.image_url} alt={currentCard.term} fill sizes="(max-width: 768px) 112px, 144px" className="object-cover" />
                </div>
              )}

              <div className="w-full flex flex-col items-center">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <h3 className="text-3xl sm:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-[#b892ff]">
                    {currentCard.term}
                  </h3>
                  <button
                    onClick={() => playAudio(currentCard.audio_url, currentCard.term)}
                    className="p-3 rounded-2xl bg-gradient-to-br from-[#4255ff] to-[#6d7bff] hover:opacity-90 text-white shadow-[0_0_20px_rgba(66,85,255,0.4)] transition-all cursor-pointer shrink-0"
                    title="Play audio"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>

                {(displayPhonetic || currentCard.part_of_speech) && (
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {displayPhonetic && (
                      <span className="text-xs font-mono text-cyan-300 bg-cyan-500/10 px-3 py-1 rounded-xl border border-cyan-500/25 flex items-center gap-1.5 font-bold">
                        <span>{preferredAccent === 'UK' ? '🇬🇧' : '🇺🇸'}</span>
                        <span>{displayPhonetic}</span>
                      </span>
                    )}
                    {currentCard.part_of_speech && (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 italic">
                        {currentCard.part_of_speech}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="w-full p-4 sm:p-5 rounded-2xl bg-[#07061d]/80 border border-white/10 text-left backdrop-blur-md">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#b892ff] block mb-1">Meaning (Nghĩa)</span>
                <p className="text-base sm:text-lg font-extrabold text-white leading-relaxed">{currentCard.definition}</p>
              </div>

              <button
                onClick={handleStartQuiz}
                className="w-full py-4 bg-gradient-to-r from-[#4255ff] via-[#5a6aff] to-[#6d7bff] text-white font-extrabold text-sm sm:text-base rounded-2xl hover:opacity-95 transition-all shadow-[0_0_25px_rgba(66,85,255,0.45)] hover:shadow-[0_0_35px_rgba(66,85,255,0.6)] flex items-center justify-center gap-2 mt-2 cursor-pointer"
              >
                Got it! Test Me <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Phase 2: Forced-Choice Quiz */}
          {phase === 'quiz' && (
            <div className="space-y-5 relative z-10">
              <div className="text-center mb-2">
                <span className="text-[10px] font-black text-[#b892ff] uppercase tracking-widest block mb-1">Quick Check</span>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  What is the meaning of &quot;<span className="text-[#b892ff]">{currentCard.term}</span>&quot;?
                </h3>
              </div>

              <div className="space-y-2.5">
                {quizOptions.map((opt) => {
                  const isSelected = selectedOptionId === opt.id;
                  const isTarget = opt.id === currentCard.id;

                  let optClass = "bg-slate-900/80 hover:bg-[#4255ff]/15 border-white/10 hover:border-[#b892ff]/40 text-slate-100";
                  if (isSelected) {
                    if (isTarget) {
                      optClass = "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-extrabold shadow-[0_0_20px_rgba(16,185,129,0.3)] scale-[1.01]";
                    } else {
                      optClass = "bg-rose-500/20 border-rose-500 text-rose-300 font-bold animate-shake shadow-[0_0_20px_rgba(244,63,94,0.3)]";
                    }
                  }

                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectOption(opt)}
                      className={`w-full p-3.5 sm:p-4 rounded-2xl border text-left text-xs sm:text-sm font-bold transition-all duration-200 flex items-center justify-between cursor-pointer ${optClass}`}
                    >
                      <span className="leading-snug">{opt.definition}</span>
                      {isSelected && isTarget && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 ml-2" />}
                      {isSelected && !isTarget && <XCircle className="w-5 h-5 text-rose-400 shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>

              {isWrong && (
                <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-center text-xs font-bold text-rose-300 animate-pulse">
                  Incorrect answer! Choose the correct option to pass.
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <VoiceSettingsSidebar />
    </div>
  );
}
