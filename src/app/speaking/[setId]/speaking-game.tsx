'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, X, SkipForward, Home, RefreshCw, Trophy, CheckCircle2, XCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ModeSwitcher } from '@/components/shared/mode-switcher';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { recordStudyActivity } from '@/actions/study';
import { updateGameScores } from '@/actions/game';

interface SetData {
  id: string;
  title: string;
}

interface CardData {
  id: string;
  term: string;
  definition: string;
}

interface SpeakingGameProps {
  set: SetData;
  cards: CardData[];
}

// So sánh chuỗi
function normalize(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

function isMatch(spoken: string, target: string): boolean {
  const s = normalize(spoken);
  const t = normalize(target);
  if (!s || !t) return false;
  if (s === t) return true;
  // "the cat" chứa "cat"
  if (s.includes(t)) return true;
  // Cho phép sai lệch nhỏ (VD: "cats" vs "cat")
  if (t.includes(s) && Math.abs(t.length - s.length) <= 2) return true;
  return false;
}

type Status = 'idle' | 'listening' | 'correct' | 'wrong';

export default function SpeakingGame({ set, cards }: SpeakingGameProps) {
  const router = useRouter();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [heardText, setHeardText] = useState('');

  // Refs để callback luôn đọc được state mới nhất
  const statusRef = useRef(status);
  const currentIndexRef = useRef(currentIndex);
  const heardTextRef = useRef(heardText);
  statusRef.current = status;
  currentIndexRef.current = currentIndex;
  heardTextRef.current = heardText;

  const speech = useSpeechRecognition();

  // Đăng ký callback onResult: gọi mỗi khi trình duyệt nhận ra một đoạn text
  useEffect(() => {
    speech.setOnResult((text: string, isFinal: boolean) => {
      if (statusRef.current === 'correct') return;

      setHeardText(text);
      heardTextRef.current = text;

      const term = cards[currentIndexRef.current]?.term;
      if (!term) return;

      if (isMatch(text, term)) {
        // ĐÚNG
        setStatus('correct');
        statusRef.current = 'correct';

        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#4ade80', '#22c55e', '#16a34a'],
        });

        setScore(prev => prev + 1);

        setTimeout(() => {
          const next = currentIndexRef.current + 1;
          if (next < cards.length) {
            setCurrentIndex(next);
            setStatus('idle');
            statusRef.current = 'idle';
            setHeardText('');
            heardTextRef.current = '';
          } else {
            setIsFinished(true);
          }
        }, 1500);
      } else if (isFinal) {
        // SAI - trình duyệt đã chốt xong kết quả cuối cùng
        setStatus('wrong');
        statusRef.current = 'wrong';
      }
    });

    // Đăng ký callback onEnd: gọi khi recognition KẾT THÚC (dù có kết quả hay không)
    // ĐÂY LÀ CHỖ SỬA LỖI TREO: nếu recognition kết thúc mà status vẫn là 'listening',
    // nghĩa là không có kết quả nào được trả về hoặc kết quả interim chưa kịp chấm.
    // Ta sẽ kiểm tra và cập nhật status cho phù hợp.
    speech.setOnEnd((finalTranscript: string) => {
      if (statusRef.current === 'correct') return; // Đã xử lý rồi

      if (statusRef.current === 'listening') {
        if (finalTranscript) {
          // Có text nhưng chưa chấm (interim chưa kịp match) → chấm lại lần cuối
          const term = cards[currentIndexRef.current]?.term;
          if (term && isMatch(finalTranscript, term)) {
            setStatus('correct');
            statusRef.current = 'correct';
            confetti({
              particleCount: 120,
              spread: 80,
              origin: { y: 0.6 },
              colors: ['#4ade80', '#22c55e', '#16a34a'],
            });
            setScore(prev => prev + 1);
            setTimeout(() => {
              const next = currentIndexRef.current + 1;
              if (next < cards.length) {
                setCurrentIndex(next);
                setStatus('idle');
                statusRef.current = 'idle';
                setHeardText('');
                heardTextRef.current = '';
              } else {
                setIsFinished(true);
              }
            }, 1500);
          } else {
            // Có text nhưng sai
            setStatus('wrong');
            statusRef.current = 'wrong';
          }
        } else {
          // Không nghe được gì cả → về idle
          setStatus('idle');
          statusRef.current = 'idle';
        }
      }
    });
  }, [cards, speech]);

  // Lưu kết quả
  useEffect(() => {
    if (!isFinished) return;
    (async () => {
      setIsSaving(true);
      try {
        const accuracy = Math.round((score / cards.length) * 100);
        const xp = Math.round(score * 10);
        await Promise.all([
          recordStudyActivity(set.id, 'test', cards.length, score),
          updateGameScores('test', accuracy, xp),
        ]);
      } catch (e) {
        console.warn('Lỗi khi lưu kết quả:', e);
      } finally {
        setIsSaving(false);
      }
    })();
  }, [isFinished, score, cards.length, set.id]);

  const handleMicClick = () => {
    if (status === 'correct') return;
    if (speech.isListening) {
      speech.stop();
    } else {
      setStatus('listening');
      statusRef.current = 'listening';
      setHeardText('');
      heardTextRef.current = '';
      speech.start();
    }
  };

  const handleSkip = () => {
    speech.stop();
    const next = currentIndex + 1;
    if (next < cards.length) {
      setCurrentIndex(next);
      setStatus('idle');
      statusRef.current = 'idle';
      setHeardText('');
      heardTextRef.current = '';
    } else {
      setIsFinished(true);
    }
  };

  const handleRetry = () => {
    setStatus('idle');
    statusRef.current = 'idle';
    setHeardText('');
    heardTextRef.current = '';
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setScore(0);
    setIsFinished(false);
    setIsSaving(false);
    setStatus('idle');
    statusRef.current = 'idle';
    setHeardText('');
    heardTextRef.current = '';
  };

  // ===== TRÌNH DUYỆT KHÔNG HỖ TRỢ =====
  if (!speech.isSupported) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background text-foreground">
        <XCircle className="w-16 h-16 text-rose-500 mb-4" />
        <h2 className="text-2xl font-bold text-rose-400 mb-2">Trình duyệt không hỗ trợ</h2>
        <p className="text-muted-foreground max-w-md">
          Vui lòng sử dụng <strong>Google Chrome</strong> hoặc <strong>Microsoft Edge</strong> để sử dụng tính năng luyện phát âm.
        </p>
        <button onClick={() => router.push('/')} className="mt-8 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition">
          Quay về trang chủ
        </button>
      </div>
    );
  }

  // ===== MÀN HÌNH KẾT QUẢ =====
  if (isFinished) {
    const accuracy = cards.length > 0 ? Math.round((score / cards.length) * 100) : 0;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-rose-500/10 rounded-full blur-[120px] pointer-events-none" />
        {isSaving && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="w-12 h-12 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
          </div>
        )}
        <div className="w-full max-w-2xl bg-card/40 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl relative z-10 flex flex-col items-center">
          <div className="w-24 h-24 bg-gradient-to-br from-rose-400 to-rose-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
            <Trophy className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/80 mb-2">
            Awesome Job!
          </h1>
          <p className="text-lg text-muted-foreground mb-8 text-center max-w-md">
            You completed the speaking practice!
          </p>
          <div className="grid grid-cols-2 gap-4 w-full mb-10">
            <div className="bg-background/50 border border-white/5 rounded-2xl p-6 flex flex-col items-center">
              <span className="text-muted-foreground font-semibold mb-1">Accuracy</span>
              <span className="text-4xl font-black text-rose-400">{accuracy}%</span>
            </div>
            <div className="bg-background/50 border border-white/5 rounded-2xl p-6 flex flex-col items-center">
              <span className="text-muted-foreground font-semibold mb-1">Correct</span>
              <span className="text-4xl font-black text-emerald-400">{score}/{cards.length}</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <button onClick={handleRestart} className="flex-1 px-8 py-4 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(244,63,94,0.3)] hover:shadow-[0_0_30px_rgba(244,63,94,0.5)] flex items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5" /> Practice Again
            </button>
            <button onClick={() => router.push('/')} className="flex-1 px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all border border-white/10 flex items-center justify-center gap-2">
              <Home className="w-5 h-5" /> Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== MÀN HÌNH CHÍNH =====
  const currentCard = cards[currentIndex];

  const bgClass =
    status === 'correct' ? 'bg-emerald-500/10' :
    status === 'wrong' ? 'bg-rose-500/10' :
    speech.isListening ? 'bg-blue-500/10' :
    'bg-transparent';

  const micBtnClass =
    status === 'correct'
      ? 'bg-emerald-500 text-white scale-110 shadow-[0_0_40px_rgba(52,211,153,0.6)]'
      : speech.isListening
        ? 'bg-blue-500 text-white scale-95 shadow-[0_0_30px_rgba(59,130,246,0.6)]'
        : 'bg-[#0a092d] border-2 border-white/20 hover:border-white/40 text-white hover:scale-105';

  // Xác định hiển thị Listening dựa trên THỰC TẾ speech.isListening, không phải status
  const showListening = speech.isListening && status !== 'correct' && status !== 'wrong';

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans overflow-hidden relative">
      <div className={`absolute inset-0 transition-colors duration-700 ${bgClass}`} />

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 relative z-10">
        <ModeSwitcher currentMode="Speaking" setId={set.id} />
        <div className="flex flex-col items-center absolute left-1/2 -translate-x-1/2">
          <span className="text-sm font-bold text-foreground mb-1">{currentIndex + 1} / {cards.length}</span>
          <span className="text-sm font-bold text-muted-foreground">{set.title}</span>
        </div>
        <button onClick={() => router.push('/')} className="text-muted-foreground hover:text-foreground transition cursor-pointer">
          <X className="w-6 h-6" />
        </button>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 max-w-4xl mx-auto w-full relative z-10">
        <div className="w-full bg-card/60 backdrop-blur-xl border border-white/10 rounded-3xl p-10 md:p-16 flex flex-col items-center justify-center min-h-[420px] shadow-2xl relative">

          {/* Từ vựng */}
          <h2 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 mb-10 text-center tracking-tight select-none">
            {currentCard.term}
          </h2>

          {/* Feedback */}
          <div className="min-h-[80px] mb-6 flex flex-col items-center justify-center w-full">

            {status === 'correct' && (
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xl animate-in zoom-in duration-300">
                <CheckCircle2 className="w-6 h-6" />
                <span>Correct! 🎉</span>
              </div>
            )}

            {status === 'wrong' && (
              <div className="flex flex-col items-center text-center gap-2">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-lg">
                  <XCircle className="w-5 h-5" />
                  <span>Not quite right</span>
                </div>
                {heardText && (
                  <span className="text-muted-foreground text-sm">
                    Heard: <span className="text-white font-medium">&quot;{heardText}&quot;</span>
                  </span>
                )}
                <button onClick={handleRetry} className="mt-2 px-5 py-2 bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 rounded-full text-sm font-bold transition cursor-pointer">
                  Try again
                </button>
              </div>
            )}

            {showListening && (
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-blue-400 font-medium animate-pulse">
                  <span>Listening</span>
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
                {heardText && (
                  <span className="text-white/70 text-base font-medium">&quot;{heardText}&quot;</span>
                )}
              </div>
            )}

            {speech.error && status !== 'correct' && (
              <span className="text-rose-400 text-sm font-medium">{speech.error}</span>
            )}

            {status === 'idle' && !speech.isListening && !speech.error && (
              <span className="text-muted-foreground font-medium">Click the microphone and say the word</span>
            )}
          </div>

          {/* Mic button */}
          <div className="relative">
            {speech.isListening && (
              <>
                <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
                <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping" style={{ animationDuration: '2s', animationDelay: '1s' }} />
              </>
            )}
            <button
              onClick={handleMicClick}
              disabled={status === 'correct'}
              className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl cursor-pointer select-none ${micBtnClass}`}
            >
              <Mic className={`w-10 h-10 ${speech.isListening ? 'animate-pulse' : ''}`} />
            </button>
          </div>

          <p className="text-muted-foreground text-sm mt-6 select-none font-medium">
            {speech.isListening ? 'Listening... speak now!' : 'Click to speak'}
          </p>
        </div>

        {/* Skip */}
        <button onClick={handleSkip} className="mt-8 flex items-center gap-2 text-muted-foreground hover:text-white transition-colors py-2 px-4 rounded-full hover:bg-white/5 font-semibold cursor-pointer">
          Skip <SkipForward className="w-4 h-4" />
        </button>
      </main>
    </div>
  );
}
