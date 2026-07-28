"use client";

import { useEffect, useState } from "react";
import { Download, Share, X, Smartphone, Sparkles } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // Check if already running as standalone PWA
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsStandalone(isStandaloneMode);
    };

    checkStandalone();

    // Check if dismissed recently
    const isDismissed = localStorage.getItem("quizflash_pwa_prompt_dismissed");
    if (isDismissed) {
      const dismissedTime = parseInt(isDismissed, 10);
      // Don't show again within 7 days
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        return;
      }
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(iosDevice);

    if (iosDevice && !isStandalone) {
      // Show iOS prompt after 3 seconds
      const timer = setTimeout(() => setIsVisible(true), 3000);
      return () => clearTimeout(timer);
    }

    // Listen for beforeinstallprompt event (Android / Chrome / Edge / Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, [isStandalone]);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosGuide(!showIosGuide);
      return;
    }

    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("quizflash_pwa_prompt_dismissed", Date.now().toString());
  };

  if (!isVisible || isStandalone) return null;

  return (
    <div className="md:hidden fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-none">
      <div className="relative overflow-hidden rounded-2xl bg-slate-900/90 border border-indigo-500/30 p-4 shadow-2xl backdrop-blur-xl text-white pointer-events-auto">
        {/* Ambient Glow */}
        <div className="absolute -top-12 -left-12 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 shrink-0">
              <Sparkles className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                Cài đặt QuizFlash
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Học flashcard nhanh hơn, mượt hơn và dùng được Offline!
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* iOS Step-by-step Guide */}
        {isIos && showIosGuide && (
          <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-300 space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[10px]">1</span>
              <span>Bấm nút <strong>Chia sẻ (Share)</strong> <Share className="w-3.5 h-3.5 inline text-indigo-400 mx-0.5" /> ở thanh công cụ Safari.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[10px]">2</span>
              <span>Cuộn xuống và chọn <strong>"Thêm vào Màn hình chính" (Add to Home Screen)</strong>.</span>
            </div>
          </div>
        )}

        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            onClick={handleDismiss}
            className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            Để sau
          </button>
          <button
            onClick={handleInstallClick}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5 active:scale-95"
          >
            {isIos ? (
              <>
                <Smartphone className="w-3.5 h-3.5" />
                <span>Xem cách cài</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Cài đặt ngay</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
