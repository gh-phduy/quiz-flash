'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X, RotateCcw, Home, Lightbulb, Volume2, VolumeX } from 'lucide-react';
import { ModeSwitcher } from '@/components/shared/mode-switcher';
import { recordStudyActivity } from '@/actions/study';
import { recordCardReview } from '@/actions/review';
import { updateGameScores, logGameSession, checkNewCardsForSession } from '@/actions/game';
import { NewWordsWarmup } from '@/components/shared/new-words-warmup';
import { getMatchEvaluation, EvaluationResult } from '@/utils/evaluation';
import { playAudio } from '@/lib/speech';
import { VoiceSettingsSidebar, VoiceSettingsTriggerButton } from '@/components/shared/voice-settings-sidebar';

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

interface MatchGameProps {
  set: SetData;
  cards: CardData[];
}

type TileStatus = 'idle' | 'selected' | 'matched' | 'error';

interface TileData {
  id: string;
  cardId: string;
  type: 'term' | 'definition';
  text: string;
  imageUrl?: string | null;
  partOfSpeech?: string | null;
  status: TileStatus;
}

export default function MatchGame({ set, cards }: MatchGameProps) {
  const router = useRouter();
  
  const [tiles, setTiles] = useState<TileData[]>([]);
  const [timeMs, setTimeMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [incorrectAttempts, setIncorrectAttempts] = useState(0);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [mistakesPerCard, setMistakesPerCard] = useState<Record<string, number>>({});
  const matchCardCount = Math.min(12, cards.length);
  const [isAutoSpeak, setIsAutoSpeak] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('match_auto_speak') !== 'false';
    }
    return true;
  });
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isFinished && !hasRecorded) {
      setHasRecorded(true);
      const basePoints = 50;
      const timeBonus = Math.max(0, 60000 - timeMs) / 1000;
      const earned = Math.round(basePoints + timeBonus) + cards.length;
      setPointsEarned(earned);
      
       const evalResult = getMatchEvaluation(timeMs / 1000, cards.length, incorrectAttempts);
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

      const playedCardIds = Object.keys(mistakesPerCard);
      const correctCards = playedCardIds.filter(id => !mistakesPerCard[id]);
      const incorrectCards = playedCardIds.filter(id => mistakesPerCard[id] > 0);

      Promise.all([
        recordStudyActivity(set.id, earned, playedCardIds.length, 'match'),
        updateGameScores(correctCards, incorrectCards),
        logGameSession({
          setId: set.id,
          mode: 'match',
          totalCards: playedCardIds.length,
          correctCount: correctCards.length,
          incorrectCount: incorrectCards.length,
          durationSeconds: Math.round(timeMs / 1000),
          pointsEarned: earned
        })
      ]);
    }
  }, [isFinished, hasRecorded, timeMs, cards.length, set.id, mistakesPerCard, tiles]);

  const [newCardsForWarmup, setNewCardsForWarmup] = useState<any[]>([]);
  const [showWarmup, setShowWarmup] = useState(false);

  // Initialize Game
  const initGame = useCallback((overrideCount?: number) => {
    const targetCount = overrideCount !== undefined ? overrideCount : matchCardCount;
    const countToUse = Math.max(1, Math.min(targetCount, cards.length));
    const shuffledCards = [...cards].sort(() => Math.random() - 0.5).slice(0, countToUse);
    
    checkNewCardsForSession(shuffledCards.map(c => c.id)).then(unreviewed => {
      if (unreviewed && unreviewed.length > 0) {
        setNewCardsForWarmup(unreviewed);
        setShowWarmup(true);
      }
    });

    let termTiles: TileData[] = [];
    let defTiles: TileData[] = [];
    
    shuffledCards.forEach(card => {
      // Tile cho Term
      termTiles.push({
        id: `term-${card.id}`,
        cardId: card.id,
        type: 'term',
        text: card.term,
        status: 'idle'
      });
      
      // Tile cho Definition (hoặc Image)
      defTiles.push({
        id: `def-${card.id}`,
        cardId: card.id,
        type: 'definition',
        text: card.definition,
        imageUrl: card.image_url,
        partOfSpeech: card.part_of_speech,
        status: 'idle'
      });
    });

    // Xáo trộn riêng 2 nhóm Term và Definition
    termTiles = termTiles.sort(() => Math.random() - 0.5);
    defTiles = defTiles.sort(() => Math.random() - 0.5);
    
    setTiles([...termTiles, ...defTiles]);
    setTimeMs(0);
    setIsFinished(false);
    setSelectedIds([]);
    setIsPlaying(true);
    setHasRecorded(false);
    setIncorrectAttempts(0);
    setEvaluation(null);
    setPointsEarned(0);
    setMistakesPerCard({});
  }, [cards, matchCardCount]);

  const hasInitialized = useRef(false);

  // Start game on mount
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      initGame();
    }
  }, [initGame]);

  // Timer logic
  useEffect(() => {
    if (isPlaying && !isFinished) {
      timerRef.current = setInterval(() => {
        setTimeMs(prev => prev + 100);
      }, 100);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, isFinished]);

  // Handle Tile Click
  const handleTileClick = (clickedId: string) => {
    if (isFinished || selectedIds.length >= 2) return;
    
    const tile = tiles.find(t => t.id === clickedId);
    if (!tile || tile.status === 'matched') return;

    if (selectedIds.includes(clickedId)) {
      setTiles(prev => prev.map(t => t.id === clickedId ? { ...t, status: 'idle' as TileStatus } : t));
      setSelectedIds([]);
      return;
    }

    if (tile.type === 'term' && isAutoSpeak) {
      playAudio(undefined, tile.text);
    }

    setTiles(prev => prev.map(t => t.id === clickedId ? { ...t, status: 'selected' as TileStatus } : t));
    const newSelectedIds = [...selectedIds, clickedId];
    setSelectedIds(newSelectedIds);

    if (newSelectedIds.length === 2) {
      const tile1 = tiles.find(t => t.id === newSelectedIds[0]);
      const tile2 = tiles.find(t => t.id === newSelectedIds[1]);
      
      if (!tile1 || !tile2) return;

      if (tile1.cardId === tile2.cardId) {
        // MATCH!
        recordCardReview(tile1.cardId, 4, 'match').catch(console.error);
        setTimeout(() => {
          setTiles(prev => {
            const nextTiles = prev.map(t => 
              newSelectedIds.includes(t.id) ? { ...t, status: 'matched' as TileStatus } : t
            );
            
            if (nextTiles.every(t => t.status === 'matched')) {
              setIsFinished(true);
            }
            
            return nextTiles;
          });
          setSelectedIds([]);
        }, 300);
      } else {
        // MISMATCH!
        recordCardReview(tile1.cardId, 1, 'match').catch(console.error);
        recordCardReview(tile2.cardId, 1, 'match').catch(console.error);
        setTiles(prev => prev.map(t => 
          newSelectedIds.includes(t.id) ? { ...t, status: 'error' as TileStatus } : t
        ));
        
        setMistakesPerCard(prev => ({
          ...prev,
          [tile1.cardId]: (prev[tile1.cardId] || 0) + 1,
          [tile2.cardId]: (prev[tile2.cardId] || 0) + 1
        }));
        
        setIncorrectAttempts(prev => prev + 1);
        setTimeMs(prev => prev + 1000);

        setTimeout(() => {
          setTiles(prev => prev.map(t => 
            newSelectedIds.includes(t.id) ? { ...t, status: 'idle' as TileStatus } : t
          ));
          setSelectedIds([]);
        }, 600);
      }
    }
  };

  const formatTime = (ms: number) => {
    return (ms / 1000).toFixed(1);
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

  const playedPairCount = Math.round(tiles.length / 2);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 shrink-0 z-10 relative border-b border-white/5">
        <ModeSwitcher currentMode="Match" setId={set.id} />

        <div className="flex items-center absolute left-1/2 -translate-x-1/2">
          <span className={`text-4xl font-extrabold font-mono transition-colors duration-300 ${isFinished ? 'text-green-500' : 'text-foreground'}`}>
            {formatTime(timeMs)}s
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const newVal = !isAutoSpeak;
              setIsAutoSpeak(newVal);
              localStorage.setItem('match_auto_speak', String(newVal));
            }}
            className={`p-2.5 rounded-xl border transition-all flex items-center gap-2 cursor-pointer shadow-md ${
              isAutoSpeak
                ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title={isAutoSpeak ? "Click to mute selection audio" : "Click to unmute selection audio"}
          >
            {isAutoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="text-xs font-bold hidden sm:inline">Auto-pronounce</span>
          </button>
          <VoiceSettingsTriggerButton />
          <button onClick={() => router.push('/')} className="text-muted-foreground hover:text-foreground transition cursor-pointer" title="Close game">
            <X className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex-1 h-[calc(100vh-5.5rem)] p-3 sm:p-4 md:p-6 w-full max-w-[95vw] mx-auto flex flex-col items-center justify-center relative">
        {isFinished ? (
          (() => {
            const colorClasses = {
              emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-400',
              amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-400',
              rose: 'from-rose-500/20 to-rose-500/5 border-rose-500/30 text-rose-400',
              blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/30 text-blue-400',
              purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/30 text-purple-400',
            };
            
            const themeColor = evaluation ? colorClasses[evaluation.color] : colorClasses.blue;
            
            const totalAttempts = playedPairCount + incorrectAttempts;
            const accuracy = totalAttempts > 0 
              ? Math.max(0, Math.min(100, Math.round((playedPairCount / totalAttempts) * 100))) 
              : 100;

            return (
              <div className="flex flex-col items-center justify-center w-full h-full relative z-10 px-4">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#4255ff]/10 rounded-full blur-[100px] pointer-events-none" />
                
                <div className="w-full max-w-2xl bg-card/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl relative z-10 flex flex-col items-center animate-in fade-in zoom-in duration-500">
                  
                  <div className="text-center mb-10">
                    <h1 className="text-4xl md:text-5xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-br from-white to-white/70">
                      {evaluation?.title || "Great time!"}
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-md mx-auto">
                      {evaluation?.message || `You matched everything in ${formatTime(timeMs)} seconds.`}
                    </p>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mb-8">
                    <div className="bg-white/5 rounded-2xl p-4 flex flex-col items-center justify-center border border-white/5">
                      <span className="text-sm font-bold text-muted-foreground mb-1">Time</span>
                      <span className="text-3xl font-black text-white">{formatTime(timeMs)}s</span>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-4 flex flex-col items-center justify-center border border-white/5">
                      <span className="text-sm font-bold text-emerald-400 mb-1">Cards</span>
                      <span className="text-3xl font-black text-emerald-400">{playedPairCount}</span>
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
                    <div className={`w-full p-5 rounded-2xl bg-gradient-to-br ${themeColor} border backdrop-blur-sm mb-10 flex gap-4 items-start`}>
                      <Lightbulb className="w-6 h-6 shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-bold mb-1">Smart Tip</h3>
                        <p className="text-sm opacity-90 leading-relaxed">{evaluation.advice}</p>
                      </div>
                    </div>
                  )}

                <div className="flex flex-col sm:flex-row gap-4 w-full">
                  <button 
                    onClick={() => initGame()}
                    className="flex-1 py-4 bg-[#4255ff] text-white font-bold rounded-xl hover:bg-[#5b6aff] transition shadow-[0_0_20px_rgba(66,85,255,0.3)] hover:shadow-[0_0_30px_rgba(66,85,255,0.5)] hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-5 h-5" />
                    Play again
                  </button>
                  <button 
                    onClick={() => router.push('/')}
                    className="flex-1 py-4 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 transition border border-white/10 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Home className="w-5 h-5" />
                    Back to Home
                  </button>
                </div>  
                </div>
              </div>
            );
          })()
        ) : (
          (() => {
            const termTiles = tiles.filter(t => t.type === 'term');
            const defTiles = tiles.filter(t => t.type === 'definition');

            const renderTileCard = (tile: TileData) => {
              const isTerm = tile.type === 'term';
              let tileStyles = "";
              
              if (tile.status === 'selected') {
                tileStyles = isTerm 
                  ? "bg-cyan-500/20 border-cyan-400 ring-2 ring-cyan-400/50 shadow-[0_0_25px_rgba(6,182,212,0.35)] scale-[1.02] text-white"
                  : "bg-indigo-500/20 border-indigo-400 ring-2 ring-indigo-400/50 shadow-[0_0_25px_rgba(99,102,241,0.35)] scale-[1.02] text-white";
              } else if (tile.status === 'error') {
                tileStyles = "bg-red-500/20 border-red-500 ring-2 ring-red-500/40 shadow-[0_0_25px_rgba(239,68,68,0.35)] animate-shake text-white";
              } else if (tile.status === 'matched') {
                tileStyles = "scale-90 opacity-0 pointer-events-none transition-all duration-500";
              } else {
                tileStyles = isTerm
                  ? "bg-slate-900/60 backdrop-blur-md hover:bg-cyan-950/30 border-white/10 hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] text-slate-100"
                  : "bg-slate-900/60 backdrop-blur-md hover:bg-indigo-950/30 border-white/10 hover:border-indigo-500/50 hover:shadow-[0_0_15px_rgba(99,102,241,0.15)] text-slate-200";
              }

              return (
                <div 
                  key={tile.id}
                  onClick={() => handleTileClick(tile.id)}
                  className={`
                    w-full h-full min-h-[115px] sm:min-h-[135px] md:min-h-[155px] rounded-2xl border p-4 sm:p-5 flex flex-col items-center justify-center text-center
                    transition-all duration-300 select-none shadow-lg relative group cursor-pointer
                    ${tileStyles}
                  `}
                >
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none bg-gradient-to-br rounded-2xl ${
                    isTerm ? 'from-cyan-400 to-transparent' : 'from-indigo-400 to-transparent'
                  }`} />

                  <span className={`absolute top-2.5 right-2.5 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border pointer-events-none ${
                    isTerm 
                      ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/25' 
                      : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/25'
                  }`}>
                    {isTerm ? 'Term' : 'Def'}
                  </span>

                  {tile.imageUrl ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 overflow-hidden pt-2">
                      <div className="relative w-full flex-1 max-h-[58%] rounded-xl overflow-hidden shrink-0 border border-white/5 group-hover:border-indigo-500/25 transition-colors">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={tile.imageUrl} 
                          alt="card image" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="flex flex-col items-center gap-0.5 min-h-0">
                        {tile.text && (
                          <span className="font-bold text-xs sm:text-sm line-clamp-2 text-white/95">
                            {tile.text}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 break-words w-full h-full overflow-hidden pt-2">
                      <span className={`font-black line-clamp-4 leading-snug tracking-wide ${
                        isTerm 
                          ? 'text-base sm:text-lg md:text-xl text-white' 
                          : 'text-xs sm:text-sm md:text-base text-slate-200 font-bold'
                      }`}>
                        {tile.text}
                      </span>
                      {tile.partOfSpeech && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded bg-white/10 text-purple-300 italic shrink-0 uppercase tracking-wider scale-90">
                          {tile.partOfSpeech}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            };

            return (
              <div className="w-full h-full flex flex-col md:flex-row items-stretch gap-4 md:gap-6 relative overflow-y-auto">
                {/* Left Column: TERMS */}
                <div className="flex-1 flex flex-col bg-cyan-950/10 border border-cyan-500/20 rounded-3xl p-4 sm:p-5 backdrop-blur-md h-full justify-between">
                  <div className="flex items-center gap-2 mb-4 pb-2.5 border-b border-cyan-500/20 shrink-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-cyan-300">
                      TERMS ({termTiles.filter(t => t.status !== 'matched').length} left)
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-4 auto-rows-fr flex-1 h-full">
                    {termTiles.map(tile => renderTileCard(tile))}
                  </div>
                </div>

                {/* Center Divider Line */}
                <div className="hidden md:flex flex-col items-center justify-center shrink-0 py-4">
                  <div className="w-[2px] h-full bg-gradient-to-b from-cyan-500/40 via-white/20 to-indigo-500/40 rounded-full shadow-[0_0_12px_rgba(6,182,212,0.3)]" />
                </div>

                {/* Right Column: DEFINITIONS */}
                <div className="flex-1 flex flex-col bg-indigo-950/10 border border-indigo-500/20 rounded-3xl p-4 sm:p-5 backdrop-blur-md h-full justify-between">
                  <div className="flex items-center gap-2 mb-4 pb-2.5 border-b border-indigo-500/20 shrink-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-indigo-300">
                      DEFINITIONS ({defTiles.filter(t => t.status !== 'matched').length} left)
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-4 auto-rows-fr flex-1 h-full">
                    {defTiles.map(tile => renderTileCard(tile))}
                  </div>
                </div>
              </div>
            );
          })()
        )}
      </main>

      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-5px); }
          40% { transform: translateX(5px); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
      <VoiceSettingsSidebar />
    </div>
  );
}
