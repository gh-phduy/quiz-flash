'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { recordCardReview } from '@/actions/review';
import { recordPoints, recordStudyActivity } from '@/actions/study';
import { logGameSession } from '@/actions/game';
import { playAudio } from '@/lib/speech';
import { VoiceSettingsSidebar } from '@/components/shared/voice-settings-sidebar';

import { ReviewCard, ReviewGameProps } from './types';
import { ReviewHeader } from './components/review-header';
import { ReviewCardDisplay } from './components/review-card-display';
import { ReviewInputForm } from './components/review-input-form';
import { ReviewSummary } from './components/review-summary';

export default function ReviewGame({ cards }: ReviewGameProps) {
  const router = useRouter();
  const [queue, setQueue] = useState<ReviewCard[]>(cards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);

  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [debugError, setDebugError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const currentCard = queue[currentIndex]?.card;

  useEffect(() => {
    if (inputRef.current && !feedback && !isFinished) {
      inputRef.current.focus();
    }
  }, [currentIndex, feedback, isFinished]);

  const handleNext = (overrideCorrect?: number, overrideIncorrect?: number) => {
    setInputValue('');
    setFeedback(null);
    if (currentIndex < queue.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      finishReview(
        overrideCorrect !== undefined ? overrideCorrect : correctCount,
        overrideIncorrect !== undefined ? overrideIncorrect : incorrectCount
      );
    }
  };

  const checkAnswer = async (isDontKnow = false) => {
    if (!currentCard || feedback) return;
    setIsChecking(true);
    setDebugError(null);

    try {
      const userTerm = inputValue.trim().toLowerCase();
      const correctTerm = (currentCard.term || '').trim().toLowerCase();

      const isCorrect = !isDontKnow && userTerm === correctTerm;
      const quality = isCorrect ? 4 : 1;

      setFeedback(isCorrect ? 'correct' : 'incorrect');

      const nextCorrect = isCorrect ? correctCount + 1 : correctCount;
      const nextIncorrect = !isCorrect ? incorrectCount + 1 : incorrectCount;

      if (isCorrect) {
        setCorrectCount((prev) => prev + 1);
      } else {
        setIncorrectCount((prev) => prev + 1);
        setQueue((prev) => [...prev, queue[currentIndex]]);
      }

      try {
        playAudio(undefined, currentCard.term);
      } catch (audioErr: any) {
        console.error('Audio play failed:', audioErr);
      }

      if (currentCard.id) {
        recordCardReview(currentCard.id, quality, 'review').catch((err) => {
          console.error('Failed to record card review:', err);
        });
      }

      setIsChecking(false);

      if (isCorrect) {
        setTimeout(() => {
          handleNext(nextCorrect, nextIncorrect);
        }, 1200);
      }
    } catch (err: any) {
      console.error('Crash in checkAnswer:', err);
      setDebugError(err.message || String(err));
      setIsChecking(false);
    }
  };

  const finishReview = async (finalCorrect: number, finalIncorrect: number) => {
    setIsFinished(true);
    const earned = finalCorrect * 10 + finalIncorrect * 2;
    setPointsEarned(earned);

    const accuracy = queue.length > 0 ? Math.round((finalCorrect / queue.length) * 100) : 0;

    if (accuracy === 100) {
      import('canvas-confetti').then(({ default: confetti }) => {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#b892ff', '#6d7bff', '#ff92d0', '#4255ff'],
        });
      });
    }

    const setId = cards[0]?.card?.set_id || '';

    try {
      await Promise.all([
        recordPoints(earned),
        recordStudyActivity(setId, earned, cards.length, 'review'),
        logGameSession({
          setId,
          mode: 'review',
          totalCards: queue.length,
          correctCount: finalCorrect,
          incorrectCount: finalIncorrect,
          durationSeconds: queue.length * 6,
          newCardsCount: 0,
          reviewCardsCount: cards.length,
          pointsEarned: earned,
        }),
      ]);
      router.refresh();
    } catch (err) {
      console.error('Error saving review session:', err);
    }
  };

  if (isFinished) {
    return (
      <ReviewSummary
        correctCount={correctCount}
        incorrectCount={incorrectCount}
        totalCards={queue.length}
        pointsEarned={pointsEarned}
      />
    );
  }

  if (!currentCard) return null;

  return (
    <div className="max-w-2xl mx-auto flex flex-col animate-in fade-in duration-500">
      <ReviewHeader currentIndex={currentIndex} totalCards={queue.length} />

      <ReviewCardDisplay definition={currentCard.definition} partOfSpeech={currentCard.part_of_speech} />

      {debugError && (
        <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-xl text-red-200 font-mono text-sm break-all">
          Crash occurred: {debugError}
        </div>
      )}

      <ReviewInputForm
        inputRef={inputRef}
        inputValue={inputValue}
        setInputValue={setInputValue}
        isChecking={isChecking}
        feedback={feedback}
        currentCard={currentCard}
        onCheckAnswer={checkAnswer}
        onNext={handleNext}
      />

      <VoiceSettingsSidebar />
    </div>
  );
}
