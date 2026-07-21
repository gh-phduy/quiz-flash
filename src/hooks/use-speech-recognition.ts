'use client';

import { useState, useRef, useCallback } from 'react';

/**
 * Hook nhận diện giọng nói qua Web Speech API.
 * Dùng useRef cho callbacks để tránh stale closure.
 * Cung cấp onResult và onEnd callback.
 */
export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const onResultRef = useRef<((text: string, isFinal: boolean) => void) | null>(null);
  const onEndRef = useRef<((finalTranscript: string) => void) | null>(null);
  const lastTranscriptRef = useRef('');

  const isSupported = typeof window !== 'undefined' &&
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const start = useCallback(() => {
    if (!isSupported) {
      setError('Trình duyệt không hỗ trợ Speech Recognition');
      return;
    }

    // Dừng phiên cũ
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    lastTranscriptRef.current = '';

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      setTranscript('');
    };

    recognition.onresult = (event: any) => {
      let finalText = '';
      let interimText = '';

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interimText += result[0].transcript;
        }
      }

      const text = finalText || interimText;
      const isFinal = !!finalText;

      setTranscript(text);
      lastTranscriptRef.current = text;

      if (onResultRef.current) {
        onResultRef.current(text, isFinal);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'aborted') return;
      if (event.error === 'no-speech') {
        setError('Không nghe thấy gì. Hãy nói to hơn!');
      } else if (event.error === 'not-allowed') {
        setError('Trình duyệt chặn Micro! Hãy cho phép quyền truy cập Micro.');
      } else if (event.error === 'network') {
        setError('Lỗi mạng. Speech Recognition cần kết nối internet.');
      } else {
        setError(`Lỗi: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      // Gọi onEnd callback với transcript cuối cùng để game component xử lý
      if (onEndRef.current) {
        onEndRef.current(lastTranscriptRef.current);
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (e: any) {
      setError(`Không thể khởi động micro: ${e.message}`);
    }
  }, [isSupported]);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
  }, []);

  const setOnResult = useCallback((fn: (text: string, isFinal: boolean) => void) => {
    onResultRef.current = fn;
  }, []);

  const setOnEnd = useCallback((fn: (finalTranscript: string) => void) => {
    onEndRef.current = fn;
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    error,
    start,
    stop,
    setOnResult,
    setOnEnd,
  };
}
