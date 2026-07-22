'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X, RotateCcw, Play, Home, Lightbulb } from 'lucide-react';
import Image from 'next/image';
import { ModeSwitcher } from '@/components/shared/mode-switcher';
import { recordStudyActivity } from '@/actions/study';
import { recordBulkCardReviews } from '@/actions/review';
import { updateGameScores, logGameSession, checkNewCardsForSession } from '@/actions/game';
import { NewWordsWarmup } from '@/components/shared/new-words-warmup';
import { getMatchEvaluation, EvaluationResult } from '@/utils/evaluation';

interface SetData {
  id: string;
  title: string;
}

interface CardData {
  id: string;
  term: string;
  definition: string;
  part_of_speech?: string | null;
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
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isFinished && !hasRecorded) {
      setHasRecorded(true);
      const basePoints = 50;
      // Thưởng thêm điểm nếu hoàn thành nhanh (dưới 60s)
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

      // Prepare bulk reviews for the cards played in this session
      const playedCardIds = Array.from(new Set(tiles.map(t => t.cardId)));
      const reviews = playedCardIds.map(cardId => {
        const mistakes = mistakesPerCard[cardId] || 0;
        let quality = 4;
        if (mistakes === 1) quality = 3;
        else if (mistakes === 2) quality = 2;
        else if (mistakes >= 3) quality = 1;
        return { cardId, quality };
      });

      const correctCards = playedCardIds.filter(id => !mistakesPerCard[id]);
      const incorrectCards = playedCardIds.filter(id => mistakesPerCard[id] > 0);

      Promise.all([
        recordStudyActivity(set.id, earned, playedCardIds.length, 'match'),
        recordBulkCardReviews(reviews, 'match'),
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
  const initGame = useCallback(() => {
    // Lấy tối đa 6 cặp thẻ ngẫu nhiên để không bị quá chật màn hình
    const shuffledCards = [...cards].sort(() => Math.random() - 0.5).slice(0, 6);
    
    checkNewCardsForSession(shuffledCards.map(c => c.id)).then(unreviewed => {
      if (unreviewed && unreviewed.length > 0) {
        setNewCardsForWarmup(unreviewed);
        setShowWarmup(true);
      }
    });

    let newTiles: TileData[] = [];
    
    shuffledCards.forEach(card => {
      // Tile cho Term
      newTiles.push({
        id: `term-${card.id}`,
        cardId: card.id,
        type: 'term',
        text: card.term,
        status: 'idle'
      });
      
      // Tile cho Definition (hoặc Image)
      newTiles.push({
        id: `def-${card.id}`,
        cardId: card.id,
        type: 'definition',
        text: card.definition,
        imageUrl: card.image_url,
        partOfSpeech: card.part_of_speech,
        status: 'idle'
      });
    });

    // Xáo trộn vị trí các tiles
    newTiles = newTiles.sort(() => Math.random() - 0.5);
    
    setTiles(newTiles);
    setTimeMs(0);
    setIsFinished(false);
    setSelectedIds([]);
    setIsPlaying(true);
    setHasRecorded(false);
    setIncorrectAttempts(0);
    setEvaluation(null);
    setPointsEarned(0);
    setMistakesPerCard({});
  }, [cards]);

  // Start game on mount
  useEffect(() => {
    initGame();
  }, [initGame]);

  // Timer logic
  useEffect(() => {
    if (isPlaying && !isFinished) {
      timerRef.current = setInterval(() => {
        setTimeMs(prev => prev + 100); // Tăng mỗi 100ms
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

    // Nếu click lại chính tile đang chọn -> Hủy chọn
    if (selectedIds.includes(clickedId)) {
      setTiles(prev => prev.map(t => t.id === clickedId ? { ...t, status: 'idle' as TileStatus } : t));
      setSelectedIds([]);
      return;
    }

    // Đánh dấu tile này là selected
    setTiles(prev => prev.map(t => t.id === clickedId ? { ...t, status: 'selected' as TileStatus } : t));
    const newSelectedIds = [...selectedIds, clickedId];
    setSelectedIds(newSelectedIds);

    // Nếu đã chọn đủ 2 tiles -> Kiểm tra kết quả
    if (newSelectedIds.length === 2) {
      const tile1 = tiles.find(t => t.id === newSelectedIds[0]);
      const tile2 = tiles.find(t => t.id === newSelectedIds[1]);
      
      if (!tile1 || !tile2) return;

      if (tile1.cardId === tile2.cardId) {
        // MATCH!
        setTimeout(() => {
          setTiles(prev => {
            const nextTiles = prev.map(t => 
              newSelectedIds.includes(t.id) ? { ...t, status: 'matched' as TileStatus } : t
            );
            
            // Check win condition
            if (nextTiles.every(t => t.status === 'matched')) {
              setIsFinished(true);
            }
            
            return nextTiles;
          });
          setSelectedIds([]);
        }, 300);
      } else {
        // MISMATCH!
        // Chuyển sang màu đỏ báo lỗi
        setTiles(prev => prev.map(t => 
          newSelectedIds.includes(t.id) ? { ...t, status: 'error' as TileStatus } : t
        ));
        
        setMistakesPerCard(prev => ({
          ...prev,
          [tile1.cardId]: (prev[tile1.cardId] || 0) + 1,
          [tile2.cardId]: (prev[tile2.cardId] || 0) + 1
        }));
        
        setIncorrectAttempts(prev => prev + 1);
        // Cộng phạt 1 giây
        setTimeMs(prev => prev + 1000);

        // Hủy chọn sau 600ms
        setTimeout(() => {
          setTiles(prev => prev.map(t => 
            newSelectedIds.includes(t.id) ? { ...t, status: 'idle' as TileStatus } : t
          ));
          setSelectedIds([]);
        }, 600);
      }
    }
  };

  // Format Timer (e.g. 12.4s)
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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 shrink-0 z-10 relative">
        <ModeSwitcher currentMode="Match" setId={set.id} />

        <div className="flex items-center absolute left-1/2 -translate-x-1/2">
          <span className={`text-4xl font-extrabold font-mono transition-colors duration-300 ${isFinished ? 'text-green-500' : 'text-foreground'}`}>
            {formatTime(timeMs)}s
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/')} className="text-muted-foreground hover:text-foreground transition cursor-pointer" title="Close game">
            <X className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex-1 flex flex-col items-center justify-start pt-10 md:pt-20 p-4 md:p-8 w-full relative">
        
        {isFinished ? (() => {
          const colorClasses = {
            emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-400',
            amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-400',
            rose: 'from-rose-500/20 to-rose-500/5 border-rose-500/30 text-rose-400',
            blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/30 text-blue-400',
            purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/30 text-purple-400',
          };
          
          const themeColor = evaluation ? colorClasses[evaluation.color] : colorClasses.blue;
          
          // Fix infinity accuracy if 0 errors
          const accuracy = Math.round((cards.length / (cards.length + incorrectAttempts)) * 100) || 100;

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
                    <span className="text-3xl font-black text-emerald-400">{cards.length}</span>
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

                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                  <button 
                    onClick={initGame}
                    className="px-8 py-3.5 bg-[#4255ff] text-white font-bold rounded-xl hover:bg-[#5b6aff] transition shadow-[0_0_20px_rgba(66,85,255,0.3)] hover:shadow-[0_0_30px_rgba(66,85,255,0.5)] hover:-translate-y-0.5 flex items-center justify-center gap-2 w-full sm:w-auto"
                  >
                    <RotateCcw className="w-5 h-5" />
                    Play again
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
        })() : (
          <div className="w-full max-w-5xl grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 relative">
            {tiles.map(tile => {
              // Xử lý styles dựa trên status
              let tileStyles = "bg-card hover:bg-[#3a466a] border-transparent hover:shadow-lg cursor-pointer transform hover:-translate-y-1";
              if (tile.status === 'selected') {
                tileStyles = "bg-[#3a466a] border-[#b892ff] ring-4 ring-[#b892ff]/20 shadow-xl scale-[1.02] cursor-default";
              } else if (tile.status === 'error') {
                tileStyles = "bg-red-500/20 border-red-500 ring-4 ring-red-500/20 shadow-xl animate-shake cursor-default";
              } else if (tile.status === 'matched') {
                tileStyles = "bg-green-500/20 border-green-500 scale-95 opacity-0 pointer-events-none";
              }

              return (
                <div 
                  key={tile.id}
                  onClick={() => handleTileClick(tile.id)}
                  className={`
                    min-h-[140px] md:min-h-[180px] rounded-xl border-2 p-4 md:p-6 flex flex-col items-center justify-center text-center
                    transition-all duration-300 select-none shadow-md
                    ${tileStyles}
                  `}
                >
                  {tile.imageUrl ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                      <div className="relative w-full h-24 md:h-32 rounded-lg overflow-hidden shrink-0">
                        <img 
                          src={tile.imageUrl} 
                          alt="card image" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        {tile.text && <span className="font-semibold text-sm md:text-base line-clamp-2">{tile.text}</span>}
                        {tile.partOfSpeech && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-purple-300 italic">
                            {tile.partOfSpeech}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 break-words w-full">
                      <span className="font-semibold text-base md:text-xl line-clamp-5">
                        {tile.text}
                      </span>
                      {tile.partOfSpeech && (
                        <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-purple-300 italic">
                          {tile.partOfSpeech}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
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
    </div>
  );
}
