'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Volume2, X, Trophy, ArrowRight, Settings, Lightbulb, Home, RotateCcw } from 'lucide-react';
import { getLearnEvaluation, EvaluationResult } from '@/utils/evaluation';
import { ModeSwitcher } from '@/components/shared/mode-switcher';
import { recordStudyActivity } from '@/actions/study';
import { recordCardReview } from '@/actions/review';
import { generateGameSession } from '@/actions/game';
import { playAudio } from '@/lib/speech';
import { Loader2 } from 'lucide-react';

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
  const [wordsLearnedAdded, setWordsLearnedAdded] = useState(0);
  
  const [isConfiguring, setIsConfiguring] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessionCards, setSessionCards] = useState<any[]>([]);
  
  const [totalReviews, setTotalReviews] = useState(0);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);

  // Initialize game after configuration
  useEffect(() => {
    if (!isConfiguring && sessionCards.length > 0 && learningQueue.length === 0 && !isFinished && !currentCard) {
      setLearningQueue(sessionCards);
      loadNextCard(sessionCards);
    }
  }, [sessionCards, isConfiguring]);

  const handleStartSession = async (count: number) => {
    setIsGenerating(true);
    const res = await generateGameSession(set.id, count);
    if (res.success && res.cards) {
      setSessionCards(res.cards);
      setIsConfiguring(false);
    } else {
      // Fallback
      const shuffled = [...cards].sort(() => 0.5 - Math.random()).slice(0, count);
      setSessionCards(shuffled);
      setIsConfiguring(false);
    }
    setIsGenerating(false);
  };

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
    
    const points = sessionCards.length * 10;
    setPointsEarned(points);
    
    const accuracy = totalReviews > 0 ? sessionCards.length / totalReviews : 1;
    const evalResult = getLearnEvaluation(sessionCards.length, totalReviews, accuracy);
    setEvaluation(evalResult);

    if (evalResult.performance === 'perfect') {
      import('canvas-confetti').then(({ default: confetti }) => {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#9fa6ff', '#b892ff', '#4255ff']
        });
      });
    }

    try {
      const res = await recordStudyActivity(set.id, points, sessionCards.length, 'learn');
      if (res.success) {
        setWordsLearnedAdded(res.wordsLearnedAdded ?? 0);
      } else {
        setWordsLearnedAdded(0);
      }
    } catch (error) {
      console.error('Failed to save study activity:', error);
      setWordsLearnedAdded(0);
    }
    setIsSaving(false);
  };

  const handleOptionClick = (option: any) => {
    if (selectedOptionId) return; // Prevent multiple clicks

    setSelectedOptionId(option.id);
    const correct = option.id === currentCard.id;
    setIsCorrect(correct);
    setTotalReviews(prev => prev + 1);

    // Record SM-2 review progress
    recordCardReview(currentCard.id, correct ? 4 : 1).catch(err => {
      console.error('Failed to record card review:', err);
    });

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
  const totalSessionCards = sessionCards.length;
  const progressPercent = totalSessionCards === 0 ? 0 : (learnedCards.length / totalSessionCards) * 100;

  if (isFinished) {
    const accuracy = totalReviews > 0 ? Math.round((sessionCards.length / totalReviews) * 100) : 100;
    
    const colorClasses = {
      emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-400',
      amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-400',
      rose: 'from-rose-500/20 to-rose-500/5 border-rose-500/30 text-rose-400',
      blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/30 text-blue-400',
      purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/30 text-purple-400',
    };
    
    const themeColor = evaluation ? colorClasses[evaluation.color] : colorClasses.blue;

    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center font-sans overflow-hidden p-6 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-[#4255ff]/10 via-background to-[#b892ff]/10 pointer-events-none" />
        
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#4255ff]/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-2xl bg-card/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 flex flex-col items-center text-center shadow-2xl relative z-10 animate-in fade-in zoom-in duration-500">
          
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-br from-white to-white/70">
              {evaluation?.title || "Awesome!"}
            </h1>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              {evaluation?.message || "You've mastered this set."}
            </p>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mb-8">
            <div className="bg-white/5 rounded-2xl p-4 flex flex-col items-center justify-center border border-white/5">
              <span className="text-sm font-bold text-emerald-400 mb-1">Learned</span>
              <span className="text-3xl font-black text-emerald-400">{wordsLearnedAdded}</span>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 flex flex-col items-center justify-center border border-white/5">
              <span className="text-sm font-bold text-muted-foreground mb-1">Reviews</span>
              <span className="text-3xl font-black text-white">{totalReviews}</span>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 flex flex-col items-center justify-center border border-white/5">
              <span className="text-sm font-bold text-orange-400 mb-1">Accuracy</span>
              <span className="text-3xl font-black text-orange-400">{accuracy}%</span>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 flex flex-col items-center justify-center border border-white/5 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="text-sm font-bold text-amber-400 mb-1">XP Earned</span>
              <span className="text-3xl font-black text-amber-400">+{pointsEarned}</span>
            </div>
          </div>
          
          {/* Smart Advice */}
          {evaluation && (
            <div className={`w-full p-5 rounded-2xl bg-gradient-to-br ${themeColor} border backdrop-blur-sm mb-10 flex gap-4 items-start text-left`}>
              <Lightbulb className="w-6 h-6 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold mb-1">Smart Tip</h3>
                <p className="text-sm opacity-90 leading-relaxed">{evaluation.advice}</p>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button 
              onClick={() => {
                setIsFinished(false);
                setLearnedCards([]);
                setCurrentCard(null);
                setLearningQueue([]);
                setSessionCards([]);
                setIsConfiguring(true);
                setTotalReviews(0);
                setEvaluation(null);
              }}
              disabled={isSaving}
              className="px-8 py-3.5 bg-[#4255ff] text-white font-bold rounded-xl hover:bg-[#5b6aff] transition shadow-[0_0_20px_rgba(66,85,255,0.3)] hover:shadow-[0_0_30px_rgba(66,85,255,0.5)] hover:-translate-y-0.5 flex items-center justify-center gap-2 w-full sm:w-auto disabled:opacity-50"
            >
              <RotateCcw className="w-5 h-5" />
              {isSaving ? 'Saving...' : 'Learn More'}
            </button>
            <button 
              onClick={() => router.push('/')}
              disabled={isSaving}
              className="px-8 py-3.5 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 transition border border-white/10 flex items-center justify-center gap-2 w-full sm:w-auto disabled:opacity-50"
            >
              <Home className="w-5 h-5" />
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isConfiguring) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col font-sans overflow-hidden p-6 relative items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-[#4255ff]/10 via-background to-[#b892ff]/10 pointer-events-none" />
        
        <div className="w-full max-w-xl bg-card/80 backdrop-blur-xl border border-white/10 rounded-3xl p-10 flex flex-col items-center text-center shadow-2xl relative z-10">
          <h1 className="text-3xl font-bold text-white mb-2">High-Intensity Training</h1>
          <p className="text-muted-foreground mb-8">How many words do you want to conquer today?</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mb-8">
            {[10, 20, 30, 50].map((count) => {
              const disabled = count > cards.length;
              return (
                <button
                  key={count}
                  onClick={() => handleStartSession(count)}
                  disabled={disabled || isGenerating}
                  className={`py-6 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${
                    disabled 
                      ? 'bg-white/5 border-white/5 opacity-50 cursor-not-allowed' 
                      : 'bg-white/5 border-white/10 hover:border-[#4255ff]/50 hover:bg-[#4255ff]/10'
                  }`}
                >
                  <span className="text-2xl font-bold text-white mb-1">{count}</span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Words</span>
                </button>
              );
            })}
          </div>

          <div className="w-full flex items-center gap-4 my-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-muted-foreground uppercase tracking-widest">OR</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <button
            onClick={() => handleStartSession(cards.length)}
            disabled={isGenerating}
            className="w-full py-4 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mb-8"
          >
            Learn all {cards.length} words
          </button>

          {isGenerating && (
            <div className="flex items-center gap-3 text-[#b892ff]">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-medium">Generating optimal learning path...</span>
            </div>
          )}
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
            onClick={() => router.push('/')}
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
        <span className="text-sm font-bold text-muted-foreground w-6">{totalSessionCards}</span>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 max-w-4xl mx-auto w-full relative">
        
        {currentCard && (
          <div className="w-full bg-card/40 backdrop-blur-md border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl">
            
            {/* Term Section */}
            <div className="mb-12">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Term</span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    playAudio(currentCard.audio_url, currentCard.term);
                  }}
                  className="text-muted-foreground hover:text-foreground transition bg-white/5 p-2 rounded-lg cursor-pointer"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-col gap-2">
                <h2 className="text-3xl md:text-5xl font-medium text-white break-words">
                  {currentCard.term}
                </h2>
                {currentCard.phonetic && (
                  <span className="text-muted-foreground text-xl">{currentCard.phonetic}</span>
                )}
              </div>
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
                  
                  // Record SM-2 review progress (1 = forgot)
                  recordCardReview(currentCard.id, 1).catch(err => {
                    console.error('Failed to record card review:', err);
                  });

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
