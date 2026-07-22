'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Flame, Clock, Zap, ShieldAlert, Skull, Play, RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface DemonModeCardProps {
  dailyGoal?: {
    actual_new_words: number;
    sessions_completed: number;
    target_new_words: number;
  } | null;
  sets?: any[];
}

export function DemonModeCard({ dailyGoal, sets = [] }: DemonModeCardProps) {
  const router = useRouter();

  const [isDemonMode, setIsDemonMode] = useState<boolean>(false);
  const [timeRemainingStr, setTimeRemainingStr] = useState<string>('');
  const [showLockoutModal, setShowLockoutModal] = useState<boolean>(false);

  const completedSessions = Math.min(9, dailyGoal?.sessions_completed || 0);
  const targetSessions = 9; // 9 sessions * 20 words = ~180 words (covers 167 target)

  // 1. Initialize Demon Mode State from localStorage & Check Lockout
  useEffect(() => {
    const savedState = localStorage.getItem('quizflash_demon_mode');
    const enabled = savedState === 'true';
    setIsDemonMode(enabled);

    if (enabled) {
      // Check if yesterday's goal was failed
      const todayStr = new Date().toISOString().split('T')[0];
      const lastCheckedDate = localStorage.getItem('quizflash_demon_last_date');
      
      if (lastCheckedDate && lastCheckedDate !== todayStr) {
        const lastSessionCount = parseInt(localStorage.getItem('quizflash_demon_yesterday_sessions') || '0');
        if (lastSessionCount < 9) {
          setShowLockoutModal(true);
        }
      }

      // Save current date for future checks
      localStorage.setItem('quizflash_demon_last_date', todayStr);
      localStorage.setItem('quizflash_demon_yesterday_sessions', String(completedSessions));
    }
  }, [completedSessions]);

  // 2. Real-time Countdown Timer to 23:59:59 Midnight
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(23, 59, 59, 999);

      const diffMs = midnight.getTime() - now.getTime();
      if (diffMs <= 0) {
        setTimeRemainingStr('00:00:00');
        return;
      }

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      const hh = String(hours).padStart(2, '0');
      const mm = String(minutes).padStart(2, '0');
      const ss = String(seconds).padStart(2, '0');

      setTimeRemainingStr(`${hh}:${mm}:${ss}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleDemonMode = () => {
    const nextState = !isDemonMode;
    setIsDemonMode(nextState);
    localStorage.setItem('quizflash_demon_mode', String(nextState));
  };

  // Dynamic Aggressive Status Warning
  const getDemonWarning = () => {
    if (completedSessions >= 9) {
      return {
        title: "🔥 BÁ VƯƠNG KỶ LUẬT THÉP!",
        message: "Bạn đã hoàn thành toàn bộ 9 phiên sinh tồn hôm nay! Streak được bảo vệ tuyệt đối.",
        color: "text-emerald-400 border-emerald-500/30 bg-emerald-950/30"
      };
    }

    const currentHour = new Date().getHours();
    if (currentHour >= 21) {
      return {
        title: "🚨 BÁO ĐỘNG ĐỎ KHẨN CẤP!",
        message: `Sắp hết ngày! Bạn còn ${9 - completedSessions} phiên nữa trước 00:00. Bật chế độ cày điên cuồng ngay!`,
        color: "text-rose-400 border-rose-500/40 bg-rose-950/40 animate-pulse"
      };
    } else if (currentHour >= 17) {
      return {
        title: "⚠️ CẢNH BÁO BUỔI TỐI",
        message: `Đã là ${currentHour}h! Mới xong ${completedSessions}/9 phiên. Đừng để dồn lịch vào đêm muộn!`,
        color: "text-amber-400 border-amber-500/30 bg-amber-950/30"
      };
    } else {
      return {
        title: "👿 DEMON MODE DANG THEO DÕI",
        message: `Chỉ tiêu hôm nay: 9 phiên (167 từ). Hoàn thành sớm để làm chủ cuộc chơi!`,
        color: "text-rose-300 border-rose-500/20 bg-rose-950/20"
      };
    }
  };

  const warning = getDemonWarning();

  // Handle Quick Session launch
  const handleQuickSession = () => {
    if (sets && sets.length > 0) {
      router.push(`/flashcards/${sets[0].id}`);
    } else {
      router.push('/explore');
    }
  };

  return (
    <>
      {/* Demon Lockout Penalty Modal */}
      <Dialog open={showLockoutModal} onOpenChange={setShowLockoutModal}>
        <DialogContent className="sm:max-w-lg bg-[#0a0204]/95 border-rose-600/40 text-white rounded-3xl p-8 backdrop-blur-2xl shadow-[0_0_80px_rgba(244,63,94,0.4)]">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <div className="absolute -inset-3 bg-rose-600/40 rounded-full blur-xl animate-ping" />
              <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-600 to-red-950 border border-rose-500/50 flex items-center justify-center text-rose-400 shadow-2xl">
                <Skull className="w-10 h-10 text-rose-300" />
              </div>
            </div>

            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-red-300 to-amber-300 uppercase tracking-tight">
              💔 DEMON LOCKOUT: STREAK VỠ NÁT!
            </h2>

            <p className="text-sm text-rose-200/90 leading-relaxed max-w-md">
              Hôm qua bạn chưa hoàn thành 9 phiên kỷ luật thép! Ứng dụng đã bị khóa bởi <strong className="text-rose-400">Demon Mode</strong>. Bạn phải thực hiện 1 Phiên Sinh Tồn Bù Kỷ Luật ngay bây giờ để giải phóng ứng dụng!
            </p>

            <button
              onClick={() => {
                setShowLockoutModal(false);
                handleQuickSession();
              }}
              className="w-full py-4 px-6 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-black rounded-2xl text-sm transition-all shadow-[0_0_30px_rgba(244,63,94,0.5)] flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 uppercase tracking-wider"
            >
              <Play className="w-5 h-5 fill-current" />
              Làm Phiên Sinh Tồn Bù Ngay
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Demon Mode Switch Banner / Card */}
      <div className="mb-12">
        {!isDemonMode ? (
          /* Demon Mode Inactive Entry Banner */
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-slate-900 via-[#1a080d] to-slate-900 border border-rose-500/20 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl group">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
                <Skull className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                  Demon Mode (Kỷ Luật Thép)
                </h3>
                <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                  Ép bản thân học 9 phiên/ngày (167 từ mới), đếm ngược hạn chót 00:00 & Phạt khóa app nếu bùng kèo.
                </p>
              </div>
            </div>

            <button
              onClick={toggleDemonMode}
              className="shrink-0 px-6 py-3.5 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-extrabold text-xs rounded-2xl transition-all shadow-[0_0_20px_rgba(244,63,94,0.3)] hover:shadow-[0_0_30px_rgba(244,63,94,0.6)] flex items-center gap-2 uppercase tracking-wider hover:scale-105 active:scale-95"
            >
              <Flame className="w-4 h-4 fill-current animate-bounce" />
              Kích Hoạt Demon Mode
            </button>
          </div>
        ) : (
          /* Demon Mode ACTIVE Card */
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#180509] via-[#0d0204] to-[#1a060a] border border-rose-500/40 p-8 md:p-10 shadow-[0_0_50px_rgba(244,63,94,0.25)] space-y-6">
            <div className="absolute -right-16 -top-16 w-64 h-64 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

            {/* Top Header & Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-rose-500/20">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute -inset-1 bg-rose-500/30 rounded-2xl blur animate-pulse" />
                  <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-red-800 flex items-center justify-center text-white shadow-lg">
                    <Flame className="w-7 h-7 fill-current" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                      DEMON MODE
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                      ACTIVE
                    </span>
                  </div>
                  <p className="text-xs text-rose-300/80 font-bold mt-0.5">
                    9 Phiên Sinh Tồn / Ngày • Kỷ Luật Thép
                  </p>
                </div>
              </div>

              {/* Countdown Clock to Midnight */}
              <div className="flex items-center gap-3 px-5 py-2.5 bg-black/50 border border-rose-500/30 rounded-2xl backdrop-blur-md">
                <Clock className="w-5 h-5 text-rose-400 animate-spin" style={{ animationDuration: '6s' }} />
                <div>
                  <span className="text-[10px] text-rose-300/70 font-bold uppercase tracking-wider block">Hạn chót 00:00</span>
                  <span className="text-lg font-black font-mono text-rose-400 tracking-wider">
                    {timeRemainingStr}
                  </span>
                </div>
              </div>
            </div>

            {/* 9 Sessions Battery Gauge */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-white/80">
                <span className="flex items-center gap-1.5 text-rose-300">
                  <Zap className="w-4 h-4 fill-rose-400 text-rose-400" />
                  Tiến Độ 9 Phiên Sinh Tồn Hôm Nay
                </span>
                <span className="font-mono text-rose-400 text-sm">
                  {completedSessions} / 9 Phiên
                </span>
              </div>

              {/* Grid of 9 Energy Bars */}
              <div className="grid grid-cols-9 gap-2 w-full">
                {Array.from({ length: 9 }).map((_, i) => {
                  const isDone = i < completedSessions;
                  return (
                    <div
                      key={i}
                      className={`h-4 rounded-lg border transition-all duration-500 flex items-center justify-center ${
                        isDone 
                          ? 'bg-gradient-to-t from-rose-600 to-rose-400 border-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.6)]' 
                          : 'bg-white/5 border-white/10'
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Demon Warning Status Box */}
            <div className={`p-4 rounded-2xl border text-xs leading-relaxed flex items-start gap-3 ${warning.color}`}>
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-black uppercase tracking-wide mb-0.5">{warning.title}</strong>
                <span>{warning.message}</span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <button
                onClick={toggleDemonMode}
                className="text-xs font-bold text-rose-400/80 hover:text-rose-300 underline transition"
              >
                Tắt Demon Mode (Quay lại chế độ thường)
              </button>

              <button
                onClick={handleQuickSession}
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-extrabold text-xs rounded-2xl transition-all shadow-[0_0_25px_rgba(244,63,94,0.4)] hover:shadow-[0_0_35px_rgba(244,63,94,0.7)] flex items-center justify-center gap-2 uppercase tracking-wider hover:scale-105 active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" />
                Vào Phiên Sinh Tồn Tiếp Theo
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
