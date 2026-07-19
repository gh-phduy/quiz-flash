'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X, RotateCcw, ArrowLeft, Play } from 'lucide-react';
import Image from 'next/image';
import { ModeSwitcher } from '@/components/shared/mode-switcher';
import { recordStudyActivity } from '@/actions/study';

interface SetData {
  id: string;
  title: string;
}

interface CardData {
  id: string;
  term: string;
  definition: string;
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
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isFinished && !hasRecorded) {
      setHasRecorded(true);
      const basePoints = 50;
      // Thưởng thêm điểm nếu hoàn thành nhanh (dưới 60s)
      const timeBonus = Math.max(0, 60000 - timeMs) / 1000;
      const pointsEarned = Math.round(basePoints + timeBonus) + cards.length;
      recordStudyActivity(pointsEarned, cards.length);
    }
  }, [isFinished, hasRecorded, timeMs, cards.length]);

  // Initialize Game
  const initGame = useCallback(() => {
    // Lấy tối đa 6 cặp thẻ ngẫu nhiên để không bị quá chật màn hình
    const shuffledCards = [...cards].sort(() => Math.random() - 0.5).slice(0, 6);
    
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
          <button onClick={() => router.push(`/flashcards/${set.id}`)} className="text-muted-foreground hover:text-foreground transition cursor-pointer" title="Close game">
            <X className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 w-full relative">
        
        {isFinished ? (
          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500 z-10">
            <h2 className="text-4xl font-bold mb-2">Great time!</h2>
            <p className="text-muted-foreground font-bold text-lg mb-8">You matched everything in {formatTime(timeMs)} seconds.</p>
            <div className="flex items-center gap-4">
              <button 
                onClick={initGame}
                className="px-8 py-3 bg-[#4255ff] text-foreground font-bold rounded-lg hover:bg-[#5b6aff] transition flex items-center gap-2 shadow-lg hover:shadow-xl cursor-pointer"
              >
                <RotateCcw className="w-5 h-5" />
                Play again
              </button>
              <button 
                onClick={() => router.push(`/flashcards/${set.id}`)}
                className="px-8 py-3 bg-card text-foreground font-bold rounded-lg hover:bg-[#3a466a] transition cursor-pointer"
              >
                Back to Flashcards
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-5xl h-[60vh] max-h-[800px] grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 relative">
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
                    rounded-xl border-2 p-4 md:p-6 flex flex-col items-center justify-center text-center
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
                      {tile.text && <span className="font-semibold text-sm md:text-base line-clamp-2">{tile.text}</span>}
                    </div>
                  ) : (
                    <span className="font-semibold text-base md:text-xl break-words w-full line-clamp-5">
                      {tile.text}
                    </span>
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
