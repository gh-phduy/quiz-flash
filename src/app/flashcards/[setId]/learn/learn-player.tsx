'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Volume2, X, Trophy, ArrowRight, Settings } from 'lucide-react';
import { ModeSwitcher } from '@/components/shared/mode-switcher';
import { recordStudyActivity } from '@/actions/study';
import confetti from 'canvas-confetti';

interface LearnPlayerProps {
  set: any;
  cards: any[];
}

export default function LearnPlayer({ set, cards }: LearnPlayerProps) {
  const router = useRouter();
  
  const [learningQueue, setLearningQueue] = useState<any[]>([]);
  const [learnedCards, setLearnedCards] = useState<any[]>([]);
  const [currentCard, setCurrentCard] = useState<any>(null);
  const [options, setOptions] = useState<any[]>([]);
  
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);

  // Initialize game
  useEffect(() => {
    if (cards.length > 0 && learningQueue.length === 0 && !isFinished && !currentCard) {
      const shuffled = [...cards].sort(() => 0.5 - Math.random());
      setLearningQueue(shuffled);
      loadNextCard(shuffled);
    }
  }, [cards]);

  const generateOptions = (correctCard: any, allCards: any[]) => {
    const incorrectCards = allCards.filter(c => c.id !== correctCard.id);
    const shuffledIncorrect = [...incorrectCards].sort(() => 0.5 - Math.random()).slice(0, 3);
    const newOptions = [correctCard, ...shuffledIncorrect].sort(() => 0.5 - Math.random());
    return newOptions;
  };

  const loadNextCard = (queue: any[]) => {
    if (queue.length === 0) {
      handleFinish();
      return;
    }
    const nextCard = queue[0];
    setCurrentCard(nextCard);
    setOptions(generateOptions(nextCard, cards));
    setSelectedOptionId(null);
    setIsCorrect(null);
  };

  const handleFinish = async () => {
    setIsFinished(true);
    setIsSaving(true);
    
    // Shoot confetti
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#9fa6ff', '#b892ff', '#4255ff']
    });

    // Award 10 points per card learned
    const points = cards.length * 10;
    setPointsEarned(points);

    try {
      await recordStudyActivity(points, cards.length);
    } catch (error) {
      console.error('Failed to save study activity:', error);
    }
    setIsSaving(false);
  };

  const handleOptionClick = (option: any) => {
    if (selectedOptionId) return; // Prevent multiple clicks

    setSelectedOptionId(option.id);
    const correct = option.id === currentCard.id;
    setIsCorrect(correct);

    setTimeout(() => {
      if (correct) {
        // Move from queue to learned
        const newQueue = learningQueue.slice(1);
        setLearnedCards([...learnedCards, currentCard]);
        setLearningQueue(newQueue);
        loadNextCard(newQueue);
      } else {
        // Move current card to the end of the queue to learn again later
        const newQueue = [...learningQueue.slice(1), currentCard];
        setLearningQueue(newQueue);
        loadNextCard(newQueue);
      }
    }, 1200); // Wait 1.2s to show result before moving on
  };

  // Calculate Progress
  const totalCards = cards.length;
  const progressPercent = totalCards === 0 ? 0 : (learnedCards.length / totalCards) * 100;

  if (isFinished) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center font-sans overflow-hidden p-6 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-[#4255ff]/10 via-background to-[#b892ff]/10 pointer-events-none" />
        
        <div className="w-full max-w-lg bg-card/80 backdrop-blur-xl border border-white/10 rounded-3xl p-10 flex flex-col items-center text-center shadow-2xl relative z-10">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#4255ff] to-[#9fa6ff] flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(159,166,255,0.4)]">
            <Trophy className="w-12 h-12 text-white" />
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-2">Awesome!</h1>
          <p className="text-muted-foreground text-lg mb-8">You've mastered this set.</p>
          
          <div className="flex gap-4 w-full mb-8">
            <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center">
              <span className="text-3xl font-bold text-[#b892ff]">{cards.length}</span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider mt-1 font-semibold">Words Learned</span>
            </div>
            <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center">
              <span className="text-3xl font-bold text-[#9fa6ff]">+{pointsEarned}</span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider mt-1 font-semibold">Points Earned</span>
            </div>
          </div>
          
          <button 
            onClick={() => router.push(`/flashcards/${set.id}`)}
            disabled={isSaving}
            className="w-full py-4 bg-gradient-to-r from-[#4255ff] to-[#6b7bff] text-white font-bold rounded-xl hover:opacity-90 transition-opacity shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSaving ? 'Saving progress...' : 'Continue'} 
            {!isSaving && <ArrowRight className="w-5 h-5" />}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <ModeSwitcher currentMode="Learn" setId={set.id} />

        <div className="flex flex-col items-center absolute left-1/2 -translate-x-1/2">
          <span className="text-sm font-bold text-muted-foreground">{set.title}</span>
        </div>

        <div className="flex items-center gap-4">
          <button className="text-muted-foreground hover:text-foreground transition">
            <Settings className="w-5 h-5" />
          </button>
          <button 
            onClick={() => router.push(`/flashcards/${set.id}`)}
            className="text-muted-foreground hover:text-foreground transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Progress Bar Container */}
      <div className="w-full max-w-4xl mx-auto px-6 mt-4 flex items-center gap-4">
        <span className="text-sm font-bold text-muted-foreground w-6 text-right">{learnedCards.length}</span>
        <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
          {/* Animated Gradient Progress */}
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#4255ff] via-[#b892ff] to-[#9fa6ff] transition-all duration-500 ease-out shadow-[0_0_10px_rgba(184,146,255,0.5)]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="text-sm font-bold text-muted-foreground w-6">{totalCards}</span>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 max-w-4xl mx-auto w-full relative">
        
        {currentCard && (
          <div className="w-full bg-card/40 backdrop-blur-md border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl">
            
            {/* Term Section */}
            <div className="mb-12">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Term</span>
                <button className="text-muted-foreground hover:text-foreground transition bg-white/5 p-2 rounded-lg">
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>
              <h2 className="text-3xl md:text-5xl font-medium text-white break-words">
                {currentCard.term}
              </h2>
            </div>

            {/* Options Section */}
            <div className="mt-8">
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider block mb-4">Choose an answer</span>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {options.map((option, index) => {
                  const isSelected = selectedOptionId === option.id;
                  const isOptionCorrect = option.id === currentCard.id;
                  
                  // Determine styling based on state
                  let buttonStyle = "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-foreground";
                  let numberStyle = "text-muted-foreground";
                  
                  if (selectedOptionId) {
                    if (isOptionCorrect) {
                      buttonStyle = "bg-emerald-500/20 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)] text-emerald-400";
                      numberStyle = "text-emerald-500";
                    } else if (isSelected && !isCorrect) {
                      buttonStyle = "bg-rose-500/20 border-rose-500/50 text-rose-400";
                      numberStyle = "text-rose-500";
                    } else {
                      buttonStyle = "bg-black/20 border-white/5 opacity-50"; // Dim others
                    }
                  }

                  return (
                    <button
                      key={option.id}
                      onClick={() => handleOptionClick(option)}
                      disabled={selectedOptionId !== null}
                      className={`flex items-center justify-between p-4 rounded-2xl border-2 text-left transition-all duration-300 ${buttonStyle} ${isSelected && !isCorrect ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}
                    >
                      <div className="flex items-center gap-4">
                        <span className={`text-sm font-bold w-6 text-center ${numberStyle}`}>{index + 1}</span>
                        <span className="text-lg font-medium">{option.definition}</span>
                      </div>
                      
                      {option.image_url && (
                        <div className="w-12 h-12 relative rounded-lg overflow-hidden shrink-0 shadow-md">
                          <Image src={option.image_url} alt="Image" fill className="object-cover" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Don't know button */}
            <div className="mt-8 flex justify-end">
              <button 
                onClick={() => {
                  if (selectedOptionId) return;
                  // If they don't know, treat it as selecting a wrong invisible option
                  setSelectedOptionId('dont_know');
                  setIsCorrect(false);
                  setTimeout(() => {
                    const newQueue = [...learningQueue.slice(1), currentCard];
                    setLearningQueue(newQueue);
                    loadNextCard(newQueue);
                  }, 1200);
                }}
                disabled={selectedOptionId !== null}
                className="text-sm font-bold text-[#b892ff] hover:text-[#9fa6ff] transition disabled:opacity-50 disabled:hover:text-[#b892ff]"
              >
                Don't know?
              </button>
            </div>
            
          </div>
        )}

      </main>
    </div>
  );
}
