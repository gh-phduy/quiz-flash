'use client';

import React, { useState } from 'react';
import { RotateCcw, AlertTriangle, Loader2, X, Trash2 } from 'lucide-react';
import { resetUserProgress } from '@/actions/review';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export default function ResetProgressButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await resetUserProgress();
      if (res.success) {
        setOpen(false);
        router.refresh();
      } else {
        setError(res.error || 'Failed to reset progress.');
      }
    } catch (e: any) {
      setError(e.message || 'An error occurred while resetting progress.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-5 py-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2.5 transition-all duration-300 hover:scale-[1.03] active:scale-95 shadow-[0_0_20px_rgba(244,63,94,0.12)] hover:border-rose-500/50 hover:shadow-[0_0_25px_rgba(244,63,94,0.25)] group shrink-0"
      >
        <RotateCcw className="w-4 h-4 text-rose-400 group-hover:-rotate-90 transition-transform duration-300" />
        <span>Reset Study Progress</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg bg-[#0d0c22]/95 border-rose-500/30 text-white rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-[0_0_60px_rgba(244,63,94,0.2)]">
          <div className="relative">
            {/* Modal Header */}
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative">
                <div className="absolute -inset-2 bg-rose-500/30 rounded-full blur-lg animate-pulse" />
                <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500/20 to-rose-950/40 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-inner">
                  <AlertTriangle className="w-8 h-8 text-rose-400" />
                </div>
              </div>

              <div className="space-y-2">
                <DialogTitle className="text-2xl font-black text-white tracking-tight">
                  Cảnh Báo: Đặt Lại Tiến Trình?
                </DialogTitle>
                <p className="text-xs font-bold text-rose-400/90 uppercase tracking-widest bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20 inline-block">
                  Hành động này không thể hoàn tác
                </p>
              </div>

              <DialogDescription className="text-sm text-gray-300 leading-relaxed max-w-sm text-center">
                Toàn bộ dữ liệu ôn tập từ vựng, mức độ thành thạo, điểm số tích lũy, chuỗi ngày học và mục tiêu hàng ngày của bạn sẽ bị <strong className="text-rose-400 font-bold">xóa hoàn toàn</strong> để bắt đầu lại từ đầu.
              </DialogDescription>
            </div>

            {/* Warning details box */}
            <div className="mt-6 p-4 bg-rose-950/30 border border-rose-500/20 rounded-2xl text-xs space-y-2 text-rose-200/90">
              <div className="flex items-start gap-2">
                <span className="text-rose-400 font-bold text-sm leading-none">•</span>
                <span>Cấp độ từ vựng (Level 1 - 5) sẽ trả về mặc định.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-rose-400 font-bold text-sm leading-none">•</span>
                <span>Tất cả lịch sử làm bài Test, Flashcards, Match sẽ được đặt lại.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-rose-400 font-bold text-sm leading-none">•</span>
                <span>Mục tiêu hàng ngày sẽ được làm mới cho ngày hôm nay.</span>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs text-rose-300 font-semibold text-center">
                {error}
              </div>
            )}

            {/* Modal Actions */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="w-full sm:w-1/2 py-3 px-5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl border border-white/15 text-xs transition-all hover:border-white/30 disabled:opacity-50"
              >
                Hủy bỏ (Cancel)
              </button>
              
              <button
                type="button"
                onClick={handleReset}
                disabled={loading}
                className="w-full sm:w-1/2 py-3 px-5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-extrabold rounded-2xl text-xs transition-all shadow-[0_0_20px_rgba(244,63,94,0.4)] flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.02] active:scale-95"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Đang đặt lại...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 text-white" />
                    <span>Xác nhận đặt lại</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
