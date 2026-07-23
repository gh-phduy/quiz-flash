'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Check, X as XIcon, Settings, Printer, Lightbulb, RotateCcw, Home, ArrowLeft } from 'lucide-react';
import { getTestEvaluation, EvaluationResult } from '@/utils/evaluation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { ModeSwitcher } from '@/components/shared/mode-switcher';
import { recordStudyActivity } from '@/actions/study';
import { recordBulkCardReviews } from '@/actions/review';
import { updateGameScores, logGameSession, checkNewCardsForSession } from '@/actions/game';
import { NewWordsWarmup } from '@/components/shared/new-words-warmup';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  image_url?: string | null;
}

interface TestGameProps {
  set: SetData;
  cards: CardData[];
}

type QuestionType = 'multiple_choice' | 'true_false' | 'matching' | 'written';

interface Question {
  id: string;
  cardId: string;
  type: QuestionType;
  prompt: string;
  promptImage?: string | null;
  partOfSpeech?: string | null;
  correctAnswer?: string;
  options?: string[]; // for multiple choice and matching
  statement?: string; // for true/false
  isTrue?: boolean; // for true/false
}

export default function TestGame({ set, cards }: TestGameProps) {
  const router = useRouter();

  // Setup State
  const [showSetup, setShowSetup] = useState(true);
  const [questionCount, setQuestionCount] = useState(Math.min(20, cards.length));
  const [answerWith, setAnswerWith] = useState<'term' | 'definition' | 'both'>('term');
  const [useMultipleChoice, setUseMultipleChoice] = useState(true);
  const [useTrueFalse, setUseTrueFalse] = useState(false);
  const [useMatching, setUseMatching] = useState(false);
  const [useWritten, setUseWritten] = useState(false);

  // Game State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string | boolean>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);

  const [newCardsForWarmup, setNewCardsForWarmup] = useState<any[]>([]);
  const [showWarmup, setShowWarmup] = useState(false);

  // Focus only on building questions when user hits "Start test"
  const startTest = async () => {
    // Validate
    if (!useMultipleChoice && !useTrueFalse && !useMatching && !useWritten) {
      alert("Please select at least one question type.");
      return;
    }
    
    // Generator
    const shuffledCards = [...cards].sort(() => Math.random() - 0.5).slice(0, questionCount);

    const unreviewed = await checkNewCardsForSession(shuffledCards.map(c => c.id));
    if (unreviewed && unreviewed.length > 0) {
      setNewCardsForWarmup(unreviewed);
      setShowWarmup(true);
    }
    
    const newQuestions = shuffledCards.map((card, index) => {
      let promptText = '';
      let answerText = '';
      let useDefinitionAsPrompt = false;
      
      if (answerWith === 'term') {
        useDefinitionAsPrompt = true;
      } else if (answerWith === 'definition') {
        useDefinitionAsPrompt = false;
      } else {
        useDefinitionAsPrompt = Math.random() > 0.5;
      }

      if (useDefinitionAsPrompt) {
        promptText = card.definition;
        answerText = card.term;
      } else {
        promptText = card.term;
        answerText = card.definition;
      }

      const activeTypes: QuestionType[] = [];
      if (useMultipleChoice) activeTypes.push('multiple_choice');
      if (useTrueFalse) activeTypes.push('true_false');
      if (useMatching) activeTypes.push('matching');
      if (useWritten) activeTypes.push('written');

      const qType = activeTypes[Math.floor(Math.random() * activeTypes.length)];

      if (qType === 'multiple_choice') {
        const otherCards = cards.filter(c => c.id !== card.id);
        const distractors = [...otherCards]
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .map(c => useDefinitionAsPrompt ? c.term : c.definition);
          
        const options = [answerText, ...distractors].sort(() => Math.random() - 0.5);

        return {
          id: `q-${index}`,
          cardId: card.id,
          type: 'multiple_choice' as QuestionType,
          prompt: promptText,
          promptImage: card.image_url,
          partOfSpeech: card.part_of_speech,
          correctAnswer: answerText,
          options
        };
      } else if (qType === 'matching') {
        const otherCards = cards.filter(c => c.id !== card.id);
        const distractors = [...otherCards]
          .sort(() => Math.random() - 0.5)
          .slice(0, 5) // 5 distractors + 1 correct = 6 options
          .map(c => useDefinitionAsPrompt ? c.term : c.definition);
          
        const options = [answerText, ...distractors].sort(() => Math.random() - 0.5);
        
        return {
          id: `q-${index}`,
          cardId: card.id,
          type: 'matching' as QuestionType,
          prompt: promptText,
          promptImage: card.image_url,
          partOfSpeech: card.part_of_speech,
          correctAnswer: answerText,
          options
        };
      } else if (qType === 'written') {
        return {
          id: `q-${index}`,
          cardId: card.id,
          type: 'written' as QuestionType,
          prompt: promptText,
          promptImage: card.image_url,
          partOfSpeech: card.part_of_speech,
          correctAnswer: answerText
        };
      } else {
        const isTrue = Math.random() > 0.5;
        let statement = answerText;
        if (!isTrue) {
          const otherCard = cards.filter(c => c.id !== card.id).sort(() => Math.random() - 0.5)[0];
          if (otherCard) {
            statement = useDefinitionAsPrompt ? otherCard.term : otherCard.definition;
          }
        }
        
        return {
          id: `q-${index}`,
          cardId: card.id,
          type: 'true_false' as QuestionType,
          prompt: promptText,
          promptImage: card.image_url,
          partOfSpeech: card.part_of_speech,
          statement,
          isTrue
        };
      }
    });

    setQuestions(newQuestions);
    setAnswers({});
    setIsSubmitted(false);
    setIsReviewing(false);
    setShowSetup(false);
  };

  const handleAnswerSelect = (qId: string, answer: string | boolean) => {
    if (isSubmitted) return;
    setAnswers(prev => ({ ...prev, [qId]: answer }));
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach(q => {
      const userAnswer = answers[q.id];
      if (userAnswer === undefined) return;
      
      if (q.type === 'multiple_choice' || q.type === 'matching') {
        if (userAnswer === q.correctAnswer) correct++;
      } else if (q.type === 'true_false') {
        if (userAnswer === q.isTrue) correct++;
      } else if (q.type === 'written') {
        const pAns = String(userAnswer).trim().toLowerCase();
        const pCor = String(q.correctAnswer).trim().toLowerCase();
        if (pAns === pCor) correct++;
      }
    });
    return Math.round((correct / questions.length) * 100);
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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans overflow-y-auto">
      
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 sticky top-0 bg-background z-20 border-b border-white/5">
        <div className="flex items-center gap-4">
          <ModeSwitcher currentMode="Test" setId={set.id} />
        </div>

        {!showSetup && (
          <div className="flex flex-col items-center absolute left-1/2 -translate-x-1/2">
            <span className="text-sm font-bold text-foreground mb-0.5">
              {Object.keys(answers).length} / {questions.length}
            </span>
            <span className="text-xs font-bold text-muted-foreground">{set.title}</span>
          </div>
        )}

        <div className="flex items-center gap-4">
          <button onClick={() => setShowSetup(true)} className="text-muted-foreground hover:text-foreground transition cursor-pointer" title="Options">
            <Settings className="w-5 h-5" />
          </button>
          <button onClick={() => router.push('/')} className="text-muted-foreground hover:text-foreground transition cursor-pointer" title="Close test">
            <X className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center p-4 md:p-8 max-w-4xl mx-auto w-full relative">
        
        {isSubmitted && !isReviewing ? (() => {
          const colorClasses = {
            emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-400',
            amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-400',
            rose: 'from-rose-500/20 to-rose-500/5 border-rose-500/30 text-rose-400',
            blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/30 text-blue-400',
            purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/30 text-purple-400',
          };
          
          const themeColor = evaluation ? colorClasses[evaluation.color] : colorClasses.blue;
          const score = calculateScore();

          return (
            <div className="flex flex-col items-center justify-center w-full relative z-10 px-4 mb-12 mt-4">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#4255ff]/10 rounded-full blur-[100px] pointer-events-none" />
              
              <div className="w-full max-w-2xl bg-card/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl relative z-10 flex flex-col items-center animate-in fade-in zoom-in duration-500">
                
                <div className="text-center mb-10">
                  <h1 className="text-4xl md:text-5xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-br from-white to-white/70">
                    {evaluation?.title || "Test Complete!"}
                  </h1>
                  <p className="text-lg text-muted-foreground max-w-md mx-auto">
                    {evaluation?.message || `You scored ${score}% on this test.`}
                  </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mb-8">
                  <div className="bg-white/5 rounded-2xl p-4 flex flex-col items-center justify-center border border-white/5">
                    <span className="text-sm font-bold text-muted-foreground mb-1">Score</span>
                    <span className="text-3xl font-black text-white">{score}%</span>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 flex flex-col items-center justify-center border border-white/5">
                    <span className="text-sm font-bold text-emerald-400 mb-1">Correct</span>
                    <span className="text-3xl font-black text-emerald-400">{correctCount}</span>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 flex flex-col items-center justify-center border border-white/5">
                    <span className="text-sm font-bold text-rose-400 mb-1">Incorrect</span>
                    <span className="text-3xl font-black text-rose-400">{incorrectCount}</span>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 flex flex-col items-center justify-center border border-white/5 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="text-sm font-bold text-amber-400 mb-1">XP Earned</span>
                    <span className="text-3xl font-black text-amber-400">+{pointsEarned}</span>
                  </div>
                </div>

                {/* Smart Advice */}
                {evaluation && (
                  <div className={`w-full p-5 rounded-2xl bg-gradient-to-br ${themeColor} border backdrop-blur-sm mb-10 flex gap-4 items-start`}>
                    <Lightbulb className="w-6 h-6 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-bold mb-1">Smart Tip</h3>
                      <p className="text-sm opacity-90 leading-relaxed">{evaluation.advice}</p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                  <button 
                    onClick={() => setIsReviewing(true)}
                    className="px-8 py-3.5 bg-[#4255ff] text-white font-bold rounded-xl hover:bg-[#5b6aff] transition shadow-[0_0_20px_rgba(66,85,255,0.3)] hover:shadow-[0_0_30px_rgba(66,85,255,0.5)] hover:-translate-y-0.5 flex items-center justify-center gap-2 w-full sm:w-auto"
                  >
                    <Check className="w-5 h-5" />
                    Review Answers
                  </button>
                  <button 
                    onClick={() => setShowSetup(true)}
                    className="px-8 py-3.5 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 transition border border-white/10 flex items-center justify-center gap-2 w-full sm:w-auto"
                  >
                    <RotateCcw className="w-5 h-5" />
                    Study Again
                  </button>
                  <button 
                    onClick={() => router.push('/')}
                    className="px-8 py-3.5 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 transition border border-white/10 flex items-center justify-center gap-2 w-full sm:w-auto"
                  >
                    <Home className="w-5 h-5" />
                    Back to Home
                  </button>
                </div>
              </div>
            </div>
          );
        })() : null}

        {!showSetup && (!isSubmitted || isReviewing) && (
          <div className="w-full flex flex-col gap-6 mb-20">
            {isReviewing && (
              <div className="flex justify-center mb-4">
                <button 
                  onClick={() => setIsReviewing(false)}
                  className="px-6 py-2 bg-card border border-white/10 text-white rounded-lg hover:bg-white/5 transition flex items-center gap-2 font-bold shadow-lg"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Results
                </button>
              </div>
            )}
            {questions.map((q, idx) => {
              const userAnswer = answers[q.id];
              const isAnswered = userAnswer !== undefined;
              
              // Determine styles based on submission state
              let cardStyle = "bg-card p-6 md:p-8 rounded-xl shadow-md border-2 border-transparent transition-all";
              
              if (isSubmitted) {
                let isCorrect = false;
                if (q.type === 'multiple_choice' || q.type === 'matching') {
                  isCorrect = userAnswer === q.correctAnswer;
                } else if (q.type === 'true_false') {
                  isCorrect = userAnswer === q.isTrue;
                } else if (q.type === 'written') {
                  isCorrect = String(userAnswer).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();
                }
                  
                if (isCorrect) {
                  cardStyle += " border-green-500/50";
                } else {
                  cardStyle += " border-red-500/50";
                }
              }

              return (
                <div key={q.id} className={cardStyle}>
                  {/* Question Header */}
                  <div className="flex justify-between items-start mb-6 text-muted-foreground text-sm font-bold tracking-wide">
                    <span>{answerWith === 'term' ? 'Definition' : 'Term'}</span>
                    <span>{idx + 1} of {questions.length}</span>
                  </div>

                  {/* Question Prompt */}
                  <div className="flex flex-col md:flex-row justify-between gap-6 mb-8">
                    <div className="flex flex-col gap-2">
                      <h3 className="text-xl md:text-2xl font-normal text-foreground">{q.prompt}</h3>
                      {q.partOfSpeech && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white/10 text-purple-300 italic w-fit">
                          {q.partOfSpeech}
                        </span>
                      )}
                    </div>
                    {q.promptImage && (
                      <div className="w-32 h-32 rounded-lg overflow-hidden shrink-0">
                        <img src={q.promptImage} alt="Prompt" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                  {/* Multiple Choice Options */}
                  {q.type === 'multiple_choice' && (
                    <div className="flex flex-col gap-4">
                      <span className="text-muted-foreground text-sm font-bold tracking-wide mb-1">Choose an answer</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {q.options?.map((opt, i) => {
                          const isSelected = userAnswer === opt;
                          let btnStyle = "p-4 rounded-lg border-2 text-left font-semibold transition-colors flex items-center justify-between";
                          
                          if (isSubmitted) {
                            if (opt === q.correctAnswer) {
                              btnStyle += " border-green-500 bg-green-500/10 text-foreground"; // Correct answer always highlights green
                            } else if (isSelected && opt !== q.correctAnswer) {
                              btnStyle += " border-red-500 bg-red-500/10 text-foreground"; // User's wrong pick
                            } else {
                              btnStyle += " border-[#3a466a] text-muted-foreground opacity-50";
                            }
                          } else {
                            if (isSelected) {
                              btnStyle += " border-[#b892ff] bg-[#3a466a] text-foreground";
                            } else {
                              btnStyle += " border-[#3a466a] text-foreground hover:bg-[#3a466a]/50 cursor-pointer";
                            }
                          }

                          return (
                            <button 
                              key={i} 
                              disabled={isSubmitted}
                              onClick={() => handleAnswerSelect(q.id, opt)}
                              className={btnStyle}
                            >
                              <span>{opt}</span>
                              {isSubmitted && opt === q.correctAnswer && <Check className="w-5 h-5 text-green-500" />}
                              {isSubmitted && isSelected && opt !== q.correctAnswer && <XIcon className="w-5 h-5 text-red-500" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* True / False Options */}
                  {q.type === 'true_false' && (
                    <div className="flex flex-col gap-4">
                      <div className="p-6 rounded-lg bg-background/50 mb-4 border border-white/5">
                        <span className="text-muted-foreground text-sm font-bold tracking-wide mb-2 block">{answerWith === 'term' ? 'Term' : 'Definition'}</span>
                        <h4 className="text-xl font-normal text-foreground">{q.statement}</h4>
                      </div>
                      <span className="text-muted-foreground text-sm font-bold tracking-wide mb-1">Choose an answer</span>
                      <div className="grid grid-cols-2 gap-4">
                        {[true, false].map((val) => {
                          const isSelected = userAnswer === val;
                          let btnStyle = "p-4 rounded-lg border-2 text-center font-bold transition-colors cursor-pointer";
                          
                          if (isSubmitted) {
                            if (val === q.isTrue) {
                              btnStyle += " border-green-500 bg-green-500/10 text-foreground";
                            } else if (isSelected && val !== q.isTrue) {
                              btnStyle += " border-red-500 bg-red-500/10 text-foreground";
                            } else {
                              btnStyle += " border-[#3a466a] text-muted-foreground opacity-50 cursor-default";
                            }
                          } else {
                            if (isSelected) {
                              btnStyle += " border-[#b892ff] bg-[#3a466a] text-foreground cursor-default";
                            } else {
                              btnStyle += " border-[#3a466a] text-foreground hover:bg-[#3a466a]/50";
                            }
                          }

                          return (
                            <button 
                              key={val.toString()} 
                              disabled={isSubmitted}
                              onClick={() => handleAnswerSelect(q.id, val)}
                              className={btnStyle}
                            >
                              {val ? 'True' : 'False'}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Matching Options */}
                  {q.type === 'matching' && (
                    <div className="flex flex-col gap-4">
                      <span className="text-muted-foreground text-sm font-bold tracking-wide mb-1">Select the correct match</span>
                      <Select 
                        value={userAnswer === '__DONT_KNOW__' ? '' : ((userAnswer as string) || '')} 
                        onValueChange={(val) => handleAnswerSelect(q.id, val || '')}
                        disabled={isSubmitted}
                      >
                        <SelectTrigger className={`w-full bg-[#3a466a] border-2 transition-colors rounded-xl text-foreground font-bold text-lg h-14 px-4 outline-none focus:ring-0 ${isSubmitted ? (userAnswer === q.correctAnswer ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10') : (userAnswer ? 'border-[#b892ff]' : 'border-transparent hover:border-white/50 focus:border-white')}`}>
                          <SelectValue placeholder="Choose match..." />
                        </SelectTrigger>
                        <SelectContent className="bg-[#3a466a] text-foreground border-[#43517a] rounded-xl shadow-xl overflow-hidden p-1 max-h-60">
                          {q.options?.map((opt, i) => (
                            <SelectItem key={i} value={opt} className="focus:bg-[#4255ff] focus:text-foreground cursor-pointer font-bold rounded-lg py-3">
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {isSubmitted && userAnswer !== q.correctAnswer && (
                        <div className="mt-4 p-4 rounded-lg bg-green-500/10 border-2 border-green-500 text-green-400 font-bold">
                          Correct match: {q.correctAnswer}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Written Options */}
                  {q.type === 'written' && (
                    <div className="flex flex-col gap-4">
                      <span className="text-muted-foreground text-sm font-bold tracking-wide mb-1">Type your answer</span>
                      <input 
                        type="text" 
                        value={userAnswer === '__DONT_KNOW__' ? '' : ((userAnswer as string) || '')}
                        onChange={(e) => handleAnswerSelect(q.id, e.target.value)}
                        disabled={isSubmitted}
                        placeholder="Type answer here..."
                        className={`w-full bg-[#3a466a] border-2 transition-colors rounded-xl text-foreground font-bold text-lg px-4 py-4 outline-none ${isSubmitted ? (String(userAnswer || '').trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase() ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10') : 'border-transparent focus:border-[#b892ff] hover:border-white/50'}`}
                      />
                      {isSubmitted && String(userAnswer || '').trim().toLowerCase() !== String(q.correctAnswer).trim().toLowerCase() && (
                        <div className="mt-4 p-4 rounded-lg bg-green-500/10 border-2 border-green-500 text-green-400 font-bold">
                          Correct answer: {q.correctAnswer}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Don't know button (only if not submitted) */}
                  {!isSubmitted && (
                    <div className="mt-8 flex justify-center">
                      <button 
                        onClick={() => handleAnswerSelect(q.id, "__DONT_KNOW__")}
                        className={`text-sm font-bold transition px-6 py-2 rounded-lg border-2 ${
                          userAnswer === "__DONT_KNOW__" 
                            ? "border-amber-500 text-amber-500 bg-amber-500/10" 
                            : "border-transparent text-[#b892ff] hover:text-[#cbb0ff] hover:bg-[#b892ff]/10"
                        }`}
                      >
                        {userAnswer === "__DONT_KNOW__" ? "Skipped" : "Don't know?"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating Submit Action Bar */}
      {!showSetup && !isSubmitted && questions.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-background/90 backdrop-blur border-t border-white/5 flex justify-center z-20">
          <button 
            onClick={async () => {
              const score = calculateScore();
              const earned = Math.round((score / 100) * 150) + questions.length; // Max ~150 pts + words
              
              let correct = 0;
              const cardQualities: Record<string, number[]> = {};
              const correctCardsSet = new Set<string>();
              const incorrectCardsSet = new Set<string>();

              questions.forEach(q => {
                const userAnswer = answers[q.id];
                if (userAnswer === undefined) return;
                
                let isCorrect = false;
                if (q.type === 'multiple_choice' || q.type === 'matching') {
                  isCorrect = userAnswer === q.correctAnswer;
                } else if (q.type === 'true_false') {
                  isCorrect = userAnswer === q.isTrue;
                } else if (q.type === 'written') {
                  const pAns = String(userAnswer).trim().toLowerCase();
                  const pCor = String(q.correctAnswer).trim().toLowerCase();
                  isCorrect = (pAns === pCor);
                }
                
                if (isCorrect) {
                  correct++;
                  correctCardsSet.add(q.cardId);
                } else {
                  incorrectCardsSet.add(q.cardId);
                }

                if (!cardQualities[q.cardId]) {
                  cardQualities[q.cardId] = [];
                }
                cardQualities[q.cardId].push(isCorrect ? 4 : 1);
              });
              
              const incorrect = questions.length - correct;
              
              const finalIncorrect = Array.from(incorrectCardsSet);
              const finalCorrect = Array.from(correctCardsSet).filter(id => !incorrectCardsSet.has(id));

              setCorrectCount(correct);
              setIncorrectCount(incorrect);
              setPointsEarned(earned);
              
              const evalResult = getTestEvaluation(score, correct, incorrect);
              setEvaluation(evalResult);
              
              if (evalResult.performance === 'perfect') {
                import('canvas-confetti').then(({ default: confetti }) => {
                  confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#b892ff', '#ff92d0', '#4255ff']
                  });
                });
              }

              setIsSubmitted(true);
              
              const reviews = Object.keys(cardQualities).map(cardId => {
                // Take the minimum quality if a card appears in multiple questions
                const minQuality = Math.min(...cardQualities[cardId]);
                return { cardId, quality: minQuality };
              });

              Promise.all([
                recordStudyActivity(set.id, earned, Object.keys(cardQualities).length, 'test'),
                recordBulkCardReviews(reviews, 'test'),
                updateGameScores(finalCorrect, finalIncorrect),
                logGameSession({
                  setId: set.id,
                  mode: 'test',
                  totalCards: Object.keys(cardQualities).length,
                  correctCount: finalCorrect.length,
                  incorrectCount: finalIncorrect.length,
                  pointsEarned: earned
                })
              ]);
            }}
            className="px-12 py-4 bg-[#4255ff] text-foreground text-lg font-bold rounded-full hover:bg-[#5b6aff] shadow-lg transition-transform hover:scale-105 active:scale-95"
          >
            Submit test
          </button>
        </div>
      )}

      {/* Setup Dialog */}
      <Dialog open={showSetup} onOpenChange={(open) => {
        // Prevent closing dialog if we haven't started a test yet
        if (!open && questions.length > 0) {
          setShowSetup(false);
        } else if (!open && questions.length === 0) {
          router.push('/'); // If they close it without starting, go back to home
        }
      }}>
        <DialogContent className="bg-card text-foreground border-transparent sm:max-w-[500px] p-0 overflow-hidden shadow-2xl rounded-2xl">
          <div className="relative p-8 pb-6 border-b border-border">
            <div className="pr-20">
              <span className="text-muted-foreground font-bold text-sm mb-2 block">{set.title}</span>
              <DialogTitle className="text-3xl font-extrabold text-foreground tracking-tight">
                Set up your test
              </DialogTitle>
            </div>
            
            {/* Decorative Icon like in the screenshot */}
            <div className="absolute top-8 right-8 w-12 h-12">
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <rect x="18" y="12" width="24" height="32" rx="4" fill="#4255ff" opacity="0.8" />
                <rect x="6" y="20" width="24" height="24" rx="4" fill="#4255ff" />
                <rect x="12" y="28" width="12" height="4" rx="2" fill="white" />
                <rect x="12" y="36" width="8" height="4" rx="2" fill="white" />
              </svg>
            </div>
          </div>

          <div className="p-8 flex flex-col gap-8 pt-6">
            {/* Options */}
            {/* Options */}
            <div className="flex items-center justify-between">
              <span className="font-bold text-[16px]">Questions <span className="text-muted-foreground font-normal text-sm ml-1">(max {cards.length})</span></span>
              
              {/* Custom Number Input */}
              <div className="flex items-center bg-background border-2 border-transparent focus-within:border-[#b892ff] transition-all rounded-lg h-12 w-20 px-1 group">
                <input 
                  type="text" 
                  value={questionCount}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val) && val >= 1 && val <= cards.length) {
                      setQuestionCount(val);
                    }
                  }}
                  className="flex-1 w-full bg-transparent text-foreground font-bold text-center outline-none"
                />
                <div className="flex flex-col h-8 w-5 shrink-0 bg-[#3a466a] rounded overflow-hidden mr-1">
                  <button 
                    onClick={() => setQuestionCount(prev => Math.min(cards.length, prev + 1))}
                    className="flex-1 flex items-center justify-center hover:bg-[#43517a] transition-colors"
                  >
                    <svg width="8" height="5" viewBox="0 0 10 6" fill="none"><path d="M5 0L10 6H0L5 0Z" fill="#939bb4"/></svg>
                  </button>
                  <button 
                    onClick={() => setQuestionCount(prev => Math.max(1, prev - 1))}
                    className="flex-1 flex items-center justify-center hover:bg-[#43517a] transition-colors"
                  >
                    <svg width="8" height="5" viewBox="0 0 10 6" fill="none"><path d="M5 6L0 0H10L5 6Z" fill="#939bb4"/></svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-bold text-[16px]">Answer with</span>
              <Select value={answerWith} onValueChange={(val) => setAnswerWith(val as any)}>
                <SelectTrigger className="w-[120px] bg-[#3a466a] border-transparent hover:bg-[#43517a] transition-colors rounded-full text-foreground font-bold text-sm h-9 focus:ring-0 focus:ring-offset-0 outline-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#3a466a] text-foreground border-[#43517a] rounded-xl shadow-xl overflow-hidden p-1">
                  <SelectItem value="term" className="focus:bg-[#4255ff] focus:text-foreground cursor-pointer font-bold rounded-lg py-2">Term</SelectItem>
                  <SelectItem value="definition" className="focus:bg-[#4255ff] focus:text-foreground cursor-pointer font-bold rounded-lg py-2">Definition</SelectItem>
                  <SelectItem value="both" className="focus:bg-[#4255ff] focus:text-foreground cursor-pointer font-bold rounded-lg py-2">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full h-px bg-border my-2"></div>

            {/* Question Types */}
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between group cursor-pointer" onClick={() => setUseTrueFalse(!useTrueFalse)}>
                <span className="font-bold text-[16px] group-hover:text-muted-foreground transition-colors">True/False</span>
                <Switch 
                  checked={useTrueFalse}
                  onCheckedChange={setUseTrueFalse}
                  className="data-[state=checked]:bg-[#4255ff] data-[state=unchecked]:bg-gray-400"
                />
              </div>
              <div className="flex items-center justify-between group cursor-pointer" onClick={() => setUseMultipleChoice(!useMultipleChoice)}>
                <span className="font-bold text-[16px] group-hover:text-muted-foreground transition-colors">Multiple choice</span>
                <Switch 
                  checked={useMultipleChoice}
                  onCheckedChange={setUseMultipleChoice}
                  className="data-[state=checked]:bg-[#4255ff] data-[state=unchecked]:bg-gray-400"
                />
              </div>
              <div className="flex items-center justify-between group cursor-pointer" onClick={() => setUseMatching(!useMatching)}>
                <span className="font-bold text-[16px] group-hover:text-muted-foreground transition-colors">Matching</span>
                <Switch 
                  checked={useMatching}
                  onCheckedChange={setUseMatching}
                  className="data-[state=checked]:bg-[#4255ff] data-[state=unchecked]:bg-gray-400"
                />
              </div>
              <div className="flex items-center justify-between group cursor-pointer" onClick={() => setUseWritten(!useWritten)}>
                <span className="font-bold text-[16px] group-hover:text-muted-foreground transition-colors">Written</span>
                <Switch 
                  checked={useWritten}
                  onCheckedChange={setUseWritten}
                  className="data-[state=checked]:bg-[#4255ff] data-[state=unchecked]:bg-gray-400"
                />
              </div>
            </div>

            {/* Action */}
            <div className="flex justify-end mt-4">
              <button 
                onClick={startTest}
                className="px-8 py-3.5 bg-[#4255ff] text-foreground font-bold rounded-xl hover:bg-[#5b6aff] shadow-lg transition-transform hover:scale-105 active:scale-95"
              >
                Start test
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}

// Simple icon component to avoid installing lucide-react if not present 
// (we already have lucide-react but sometimes it misses some exports, using FileText is safe)
function FileTextIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <line x1="10" x2="8" y1="9" y2="9" />
    </svg>
  )
}
