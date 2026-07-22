'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Mic, Square, Volume2, VolumeX, Play, Pause, X, SkipForward, Home, RefreshCw, 
  Trophy, CheckCircle2, XCircle, RotateCcw, ThumbsUp, ThumbsDown, Sparkles, Sliders 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ModeSwitcher } from '@/components/shared/mode-switcher';
import { playAudio } from '@/lib/speech';
import { recordStudyActivity } from '@/actions/study';
import { recordBulkCardReviews } from '@/actions/review';
import { logGameSession, checkNewCardsForSession } from '@/actions/game';
import { NewWordsWarmup } from '@/components/shared/new-words-warmup';
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
  part_of_speech?: string | null;
  audio_url?: string | null;
  image_url?: string | null;
}

interface SpeakingGameProps {
  set: SetData;
  cards: CardData[];
}

type StepState = 'ready' | 'recording' | 'recorded';

export default function SpeakingGame({ set, cards }: SpeakingGameProps) {
  const router = useRouter();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Card state
  const [step, setStep] = useState<StepState>('ready');
  const [recordingTime, setRecordingTime] = useState(0);
  const [userAudioUrl, setUserAudioUrl] = useState<string | null>(null);
  const [isPlayingNative, setIsPlayingNative] = useState(false);
  const [isPlayingUserAudio, setIsPlayingUserAudio] = useState(false);

  // Custom independent volume controls (0.0 to 1.0)
  const [nativeVolume, setNativeVolume] = useState<number>(1.0);
  const [userVolume, setUserVolume] = useState<number>(0.8);

  // Refs for media recording & audio playback
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const userAudioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const correctCardsRef = useRef<Set<string>>(new Set());
  const [newCardsForWarmup, setNewCardsForWarmup] = useState<any[]>([]);
  const [showWarmup, setShowWarmup] = useState(false);

  const currentCard = cards[currentIndex];

  // Check for new unreviewed cards on start
  useEffect(() => {
    if (cards && cards.length > 0) {
      checkNewCardsForSession(cards.map(c => c.id)).then(unreviewed => {
        if (unreviewed && unreviewed.length > 0) {
          setNewCardsForWarmup(unreviewed);
          setShowWarmup(true);
        }
      });
    }
  }, [cards]);

  // Clean up audio URL and reset states when changing cards
  useEffect(() => {
    if (userAudioUrl) {
      URL.revokeObjectURL(userAudioUrl);
    }
    setUserAudioUrl(null);
    setStep('ready');
    setRecordingTime(0);
    setIsPlayingNative(false);
    setIsPlayingUserAudio(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, [currentIndex]);

  // Save final results & trigger confetti ONLY on session end
  useEffect(() => {
    if (!isFinished) return;

    // Fire confetti once when entire lesson is completed!
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#f43f5e', '#fb7185', '#34d399', '#60a5fa']
    });

    (async () => {
      setIsSaving(true);
      try {
        const accuracy = cards.length > 0 ? Math.round((score / cards.length) * 100) : 0;
        const xp = Math.round(score * 10);
        
        const reviews = cards.map(c => ({
          cardId: c.id,
          quality: correctCardsRef.current.has(c.id) ? 4 : 1
        }));

        await Promise.all([
          recordStudyActivity(set.id, xp, cards.length, 'speaking'),
          recordBulkCardReviews(reviews, 'speaking'),
          logGameSession({
            setId: set.id,
            mode: 'speaking',
            totalCards: cards.length,
            correctCount: score,
            incorrectCount: cards.length - score,
            pointsEarned: xp
          })
        ]);
      } catch (e) {
        console.warn('Lỗi khi lưu kết quả Speaking:', e);
      } finally {
        setIsSaving(false);
      }
    })();
  }, [isFinished, score, cards, set.id]);

  // Start Voice Recording
  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setUserAudioUrl(url);
        setStep('recorded');

        // Stop media stream tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setStep('recording');
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Microphone access error:', err);
      alert('Vui lòng cho phép quyền truy cập Micro trên trình duyệt để thu âm.');
    }
  };

  // Stop Voice Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  // Play Native Audio with Native Volume
  const handlePlayNative = () => {
    if (!currentCard) return;
    setIsPlayingNative(true);
    playAudio(currentCard.audio_url, currentCard.term, nativeVolume);
    setTimeout(() => {
      setIsPlayingNative(false);
    }, 1500);
  };

  // Play User Recorded Audio with User Volume
  const handlePlayUserAudio = () => {
    if (!userAudioUrl) return;

    if (userAudioRef.current) {
      userAudioRef.current.pause();
    }

    const audio = new Audio(userAudioUrl);
    audio.volume = Math.max(0, Math.min(1, userVolume));
    userAudioRef.current = audio;
    setIsPlayingUserAudio(true);

    audio.onended = () => {
      setIsPlayingUserAudio(false);
    };

    audio.play().catch(e => {
      console.error('Error playing user audio:', e);
      setIsPlayingUserAudio(false);
    });
  };

  // Self Rating: Correct / Good (No confetti on single card)
  const handleRateCorrect = () => {
    if (currentCard) {
      correctCardsRef.current.add(currentCard.id);
    }
    setScore(prev => prev + 1);
    handleNextCard();
  };

  // Self Rating: Incorrect / Needs Work
  const handleRateIncorrect = () => {
    handleNextCard();
  };

  const handleNextCard = () => {
    const nextIdx = currentIndex + 1;
    if (nextIdx < cards.length) {
      setCurrentIndex(nextIdx);
    } else {
      setIsFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setScore(0);
    setIsFinished(false);
    setIsSaving(false);
    setStep('ready');
    correctCardsRef.current.clear();
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

  // ===== RESULT SCREEN =====
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
          <div className="w-24 h-24 bg-gradient-to-br from-rose-400 to-rose-600 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(244,63,94,0.4)]">
            <Trophy className="w-12 h-12 text-white" />
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/80 mb-2">
            Awesome Practice!
          </h1>
          <p className="text-lg text-muted-foreground mb-8 text-center max-w-md">
            You completed the speaking self-evaluation!
          </p>

          <div className="grid grid-cols-2 gap-4 w-full mb-10">
            <div className="bg-background/50 border border-white/5 rounded-2xl p-6 flex flex-col items-center">
              <span className="text-muted-foreground font-semibold mb-1">Accuracy</span>
              <span className="text-4xl font-black text-rose-400">{accuracy}%</span>
            </div>
            <div className="bg-background/50 border border-white/5 rounded-2xl p-6 flex flex-col items-center">
              <span className="text-muted-foreground font-semibold mb-1">Good Pronunciation</span>
              <span className="text-4xl font-black text-emerald-400">{score}/{cards.length}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <button
              onClick={handleRestart}
              className="flex-1 px-8 py-4 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(244,63,94,0.3)] hover:shadow-[0_0_30px_rgba(244,63,94,0.5)] flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" /> Practice Again
            </button>
            <button
              onClick={() => router.push('/')}
              className="flex-1 px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all border border-white/10 flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" /> Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== MAIN SPEAKING PRACTICE GAME SCREEN =====
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans overflow-hidden relative">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 relative z-10">
        <ModeSwitcher currentMode="Speaking" setId={set.id} />

        <div className="flex items-center gap-2 font-mono text-sm font-bold bg-white/5 px-4 py-1.5 rounded-full border border-white/10">
          <span className="text-rose-400">{currentIndex + 1}</span>
          <span className="text-white/40">/</span>
          <span className="text-white/80">{cards.length}</span>
        </div>

        <div className="flex items-center gap-3">
          <VoiceSettingsTriggerButton />
          <button
            onClick={() => router.push('/')}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 max-w-3xl mx-auto w-full">
        {/* Flashcard Card */}
        <div className="w-full bg-card/50 backdrop-blur-2xl border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
          {/* Top Tag */}
          <div className="flex items-center gap-2 px-3.5 py-1 bg-rose-500/10 border border-rose-500/30 rounded-full mb-6">
            <Mic className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-[11px] font-black uppercase tracking-wider text-rose-300">
              Pronunciation Self-Assessment
            </span>
          </div>

          {/* Optional Image */}
          {currentCard.image_url && (
            <div className="w-28 h-28 relative rounded-2xl overflow-hidden border border-white/10 mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={currentCard.image_url} alt={currentCard.term} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Term & Phonetic */}
          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-2">
            {currentCard.term}
          </h2>

          {(currentCard.phonetic || currentCard.part_of_speech) && (
            <div className="flex items-center justify-center gap-2 mb-4">
              {currentCard.phonetic && (
                <span className="text-base font-mono text-muted-foreground">{currentCard.phonetic}</span>
              )}
              {currentCard.part_of_speech && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white/10 text-purple-300 italic">
                  {currentCard.part_of_speech}
                </span>
              )}
            </div>
          )}

          {/* Definition Box */}
          <div className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-center mb-6">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 block mb-1">Meaning</span>
            <p className="text-base font-bold text-white/90">{currentCard.definition}</p>
          </div>

          {/* STATE 1: Ready to Record */}
          {step === 'ready' && (
            <div className="flex flex-col items-center space-y-4 w-full">
              <button
                onClick={startRecording}
                className="w-24 h-24 rounded-full bg-gradient-to-tr from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white flex items-center justify-center shadow-[0_0_40px_rgba(244,63,94,0.5)] hover:shadow-[0_0_50px_rgba(244,63,94,0.7)] hover:scale-105 active:scale-95 transition-all group"
              >
                <Mic className="w-10 h-10 group-hover:scale-110 transition-transform" />
              </button>
              <p className="text-xs font-bold text-muted-foreground">
                Tap microphone to start recording your voice
              </p>
            </div>
          )}

          {/* STATE 2: Recording in progress */}
          {step === 'recording' && (
            <div className="flex flex-col items-center space-y-4 w-full">
              <div className="relative">
                <div className="absolute -inset-4 bg-rose-500/30 rounded-full blur-xl animate-ping" />
                <button
                  onClick={stopRecording}
                  className="relative w-24 h-24 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-[0_0_50px_rgba(244,63,94,0.7)] hover:scale-105 active:scale-95 transition-all"
                >
                  <Square className="w-8 h-8 fill-current" />
                </button>
              </div>

              <div className="flex items-center gap-2 text-rose-400 font-mono text-sm font-bold bg-rose-500/10 px-4 py-1.5 rounded-full border border-rose-500/30">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                Recording... 0:0{recordingTime}s (Tap to stop)
              </div>
            </div>
          )}

          {/* STATE 3: Recorded -> Playback Comparison & Self Rating */}
          {step === 'recorded' && (
            <div className="w-full space-y-5 animate-in fade-in zoom-in duration-300">
              {/* Audio Comparison Players with Independent Volume Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                
                {/* 1. Native Speaker Audio Box */}
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col justify-between space-y-3">
                  <button
                    onClick={handlePlayNative}
                    className="flex items-center justify-between w-full text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400">
                        {nativeVolume === 0 ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5" />}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">Native Standard</span>
                        <span className="text-[10px] text-muted-foreground">Original Pronunciation</span>
                      </div>
                    </div>
                    {isPlayingNative ? (
                      <Pause className="w-5 h-5 text-blue-400 animate-pulse" />
                    ) : (
                      <Play className="w-5 h-5 text-white/50 group-hover:text-blue-400 transition" />
                    )}
                  </button>

                  {/* Native Volume Slider */}
                  <div className="pt-2 border-t border-white/5 flex items-center gap-2 text-[11px] font-bold text-white/60">
                    <Volume2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={nativeVolume}
                      onChange={(e) => setNativeVolume(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <span className="font-mono text-[10px] text-blue-300 w-8 text-right">
                      {Math.round(nativeVolume * 100)}%
                    </span>
                  </div>
                </div>

                {/* 2. User Recorded Audio Box */}
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col justify-between space-y-3">
                  <button
                    onClick={handlePlayUserAudio}
                    className="flex items-center justify-between w-full text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400">
                        {userVolume === 0 ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Mic className="w-5 h-5" />}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">Your Recording</span>
                        <span className="text-[10px] text-muted-foreground">Listen back to yourself</span>
                      </div>
                    </div>
                    {isPlayingUserAudio ? (
                      <Pause className="w-5 h-5 text-rose-400 animate-pulse" />
                    ) : (
                      <Play className="w-5 h-5 text-white/50 group-hover:text-rose-400 transition" />
                    )}
                  </button>

                  {/* User Recording Volume Slider */}
                  <div className="pt-2 border-t border-white/5 flex items-center gap-2 text-[11px] font-bold text-white/60">
                    <Mic className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={userVolume}
                      onChange={(e) => setUserVolume(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-rose-500"
                    />
                    <span className="font-mono text-[10px] text-rose-300 w-8 text-right">
                      {Math.round(userVolume * 100)}%
                    </span>
                  </div>
                </div>

              </div>

              {/* Re-record Option */}
              <div className="flex justify-center">
                <button
                  onClick={startRecording}
                  className="text-xs font-bold text-muted-foreground hover:text-white flex items-center gap-1.5 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Re-record Audio
                </button>
              </div>

              {/* Self-Rating Action Buttons */}
              <div className="pt-4 border-t border-white/10 space-y-3">
                <span className="text-xs font-bold text-white/60 uppercase tracking-wider block">
                  How was your pronunciation?
                </span>

                <div className="grid grid-cols-2 gap-4 w-full">
                  <button
                    onClick={handleRateIncorrect}
                    className="py-3.5 px-6 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-extrabold rounded-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <ThumbsDown className="w-5 h-5" /> Needs Work
                  </button>

                  <button
                    onClick={handleRateCorrect}
                    className="py-3.5 px-6 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-extrabold rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2"
                  >
                    <ThumbsUp className="w-5 h-5" /> Good / Correct
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <VoiceSettingsSidebar />
    </div>
  );
}
