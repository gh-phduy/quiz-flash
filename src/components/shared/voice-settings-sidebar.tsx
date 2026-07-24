'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useVoiceStore } from '@/store/useVoiceStore';
import { playAudio } from '@/lib/speech';
import { FlagIcon } from '@/components/shared/flag-icon';
import {
  Volume2,
  VolumeX,
  SlidersHorizontal,
  X,
  Play,
  RotateCcw,
  Sparkles,
  Check,
  Globe,
  Gauge,
  ChevronDown,
} from 'lucide-react';

export interface CustomVoiceInfo {
  voiceURI: string;
  name: string;
  cleanName: string;
  lang: string;
  provider: 'system' | 'cloud';
  regionBadge: {
    code: string;
    label: string;
    colorClass: string;
  };
}

const UK_VOICES: CustomVoiceInfo[] = [
  {
    voiceURI: 'uk_female',
    name: 'UK English Female',
    cleanName: 'UK English Female',
    lang: 'en-GB',
    provider: 'cloud',
    regionBadge: {
      code: 'UK',
      label: 'UK English',
      colorClass: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    },
  },
  {
    voiceURI: 'uk_male',
    name: 'UK English Male',
    cleanName: 'UK English Male',
    lang: 'en-GB',
    provider: 'cloud',
    regionBadge: {
      code: 'UK',
      label: 'UK English',
      colorClass: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    },
  },
];

const US_VOICES: CustomVoiceInfo[] = [
  {
    voiceURI: 'us_female',
    name: 'US English Female',
    cleanName: 'US English Female',
    lang: 'en-US',
    provider: 'cloud',
    regionBadge: {
      code: 'US',
      label: 'US English',
      colorClass: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    },
  },
  {
    voiceURI: 'david',
    name: 'David (US Male)',
    cleanName: 'David (US Male)',
    lang: 'en-US',
    provider: 'system',
    regionBadge: {
      code: 'US',
      label: 'US English',
      colorClass: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    },
  },
  {
    voiceURI: 'mark',
    name: 'Mark (US Deep Male)',
    cleanName: 'Mark (US Deep Male)',
    lang: 'en-US',
    provider: 'system',
    regionBadge: {
      code: 'US',
      label: 'US English',
      colorClass: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    },
  },
];

export function VoiceSettingsSidebar() {
  const {
    isOpen,
    setIsOpen,
    ukVoiceURI,
    setUkVoiceURI,
    usVoiceURI,
    setUsVoiceURI,
    preferredAccent,
    setPreferredAccent,
    rate,
    setRate,
    volume,
    setVolume,
    resetToDefault,
  } = useVoiceStore();

  const [isUkDropdownOpen, setIsUkDropdownOpen] = useState(false);
  const [isUsDropdownOpen, setIsUsDropdownOpen] = useState(false);
  const [isPlayingUkTest, setIsPlayingUkTest] = useState(false);
  const [isPlayingUsTest, setIsPlayingUsTest] = useState(false);

  const ukDropdownRef = useRef<HTMLDivElement>(null);
  const usDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ukDropdownRef.current && !ukDropdownRef.current.contains(event.target as Node)) {
        setIsUkDropdownOpen(false);
      }
      if (usDropdownRef.current && !usDropdownRef.current.contains(event.target as Node)) {
        setIsUsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedUkVoice = UK_VOICES.find((v) => v.voiceURI === ukVoiceURI) || UK_VOICES[0];
  const selectedUsVoice = US_VOICES.find((v) => v.voiceURI === usVoiceURI) || US_VOICES[0];

  const handleTestUkVoice = () => {
    setIsPlayingUkTest(true);
    playAudio(null, 'Hello! This is a test of your UK voice model.', undefined, 'UK');
    setTimeout(() => {
      setIsPlayingUkTest(false);
    }, 2500);
  };

  const handleTestUsVoice = () => {
    setIsPlayingUsTest(true);
    playAudio(null, 'Hello! This is a test of your US voice model.', undefined, 'US');
    setTimeout(() => {
      setIsPlayingUsTest(false);
    }, 2500);
  };

  const speedPresets = [
    { label: '0.75x', value: 0.75 },
    { label: '0.9x', value: 0.9 },
    { label: '1.0x (Normal)', value: 1.0 },
    { label: '1.25x', value: 1.25 },
    { label: '1.5x', value: 1.5 },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={() => setIsOpen(false)} />

      {/* Sidebar Panel */}
      <div className="relative w-full max-w-md bg-slate-900/95 border-l border-white/10 text-white shadow-2xl h-full flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div>
          <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-purple-900/40 via-slate-900 to-blue-900/40">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-inner">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  Voice & Audio Settings
                </h2>
                <p className="text-xs text-slate-400">Configure UK & US speech voices, speed & volume</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Default Accent Selector */}
            <div className="space-y-2 pb-2 border-b border-white/10">
              <label className="text-sm font-semibold text-purple-300 flex items-center gap-2">
                <Globe className="w-4 h-4 text-purple-400" />
                Default Pronunciation Accent (Giọng mặc định)
              </label>
              <div className="grid grid-cols-2 gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setPreferredAccent('US')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    preferredAccent === 'US'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 border border-blue-400/40'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <FlagIcon country="US" />
                  <span>US English (Mỹ)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreferredAccent('UK')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    preferredAccent === 'UK'
                      ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/40 border border-rose-400/40'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <FlagIcon country="UK" />
                  <span>UK English (Anh)</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400 px-1">
                Used as default for games, warm-up mode & general pronunciation.
              </p>
            </div>

            {/* 1. UK Voice Model */}
            <div className="space-y-2 relative" ref={ukDropdownRef}>
              <label className="text-sm font-semibold text-rose-300 flex items-center gap-2">
                <Globe className="w-4 h-4 text-rose-400" />
                UK Voice Model (Anh - UK)
              </label>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsUkDropdownOpen(!isUkDropdownOpen);
                    setIsUsDropdownOpen(false);
                  }}
                  className="w-full bg-slate-800/90 hover:bg-slate-800 border border-white/15 hover:border-rose-500/50 rounded-2xl p-3.5 text-left flex items-center justify-between transition-all shadow-md group cursor-pointer"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span className="px-2 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 shrink-0 bg-rose-500/20 text-rose-300 border-rose-500/30">
                      <FlagIcon country="UK" />
                      <span>UK</span>
                    </span>
                    <div className="truncate">
                      <div className="text-sm font-bold text-white truncate">
                        {selectedUkVoice.cleanName}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {selectedUkVoice.regionBadge.label} • {selectedUkVoice.lang}
                      </div>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 group-hover:text-white transition-transform shrink-0 ${
                      isUkDropdownOpen ? 'rotate-180 text-rose-400' : ''
                    }`}
                  />
                </button>

                {isUkDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-slate-900/98 border border-white/15 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 p-1.5 space-y-1">
                    {UK_VOICES.map((v) => {
                      const isSelected = v.voiceURI === ukVoiceURI;
                      return (
                        <button
                          key={v.voiceURI}
                          type="button"
                          onClick={() => {
                            setUkVoiceURI(v.voiceURI);
                            setIsUkDropdownOpen(false);
                          }}
                          className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-rose-600/30 border border-rose-500/50 text-white shadow-sm'
                              : 'hover:bg-white/5 border border-transparent text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1.5 shrink-0 bg-rose-500/20 text-rose-300 border-rose-500/30">
                              <FlagIcon country="UK" />
                              <span>UK</span>
                            </span>
                            <div className="truncate">
                              <div className="text-xs font-semibold truncate">{v.cleanName}</div>
                              <div className="text-[10px] text-slate-400 truncate">{v.lang}</div>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-rose-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 2. US Voice Model */}
            <div className="space-y-2 relative" ref={usDropdownRef}>
              <label className="text-sm font-semibold text-blue-300 flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-400" />
                US Voice Model (Anh - US)
              </label>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsUsDropdownOpen(!isUsDropdownOpen);
                    setIsUkDropdownOpen(false);
                  }}
                  className="w-full bg-slate-800/90 hover:bg-slate-800 border border-white/15 hover:border-blue-500/50 rounded-2xl p-3.5 text-left flex items-center justify-between transition-all shadow-md group cursor-pointer"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span className="px-2 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 shrink-0 bg-blue-500/20 text-blue-300 border-blue-500/30">
                      <FlagIcon country="US" />
                      <span>US</span>
                    </span>
                    <div className="truncate">
                      <div className="text-sm font-bold text-white truncate">
                        {selectedUsVoice.cleanName}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {selectedUsVoice.regionBadge.label} • {selectedUsVoice.lang}
                      </div>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 group-hover:text-white transition-transform shrink-0 ${
                      isUsDropdownOpen ? 'rotate-180 text-blue-400' : ''
                    }`}
                  />
                </button>

                {isUsDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-slate-900/98 border border-white/15 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 p-1.5 space-y-1">
                    {US_VOICES.map((v) => {
                      const isSelected = v.voiceURI === usVoiceURI;
                      return (
                        <button
                          key={v.voiceURI}
                          type="button"
                          onClick={() => {
                            setUsVoiceURI(v.voiceURI);
                            setIsUsDropdownOpen(false);
                          }}
                          className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600/30 border border-blue-500/50 text-white shadow-sm'
                              : 'hover:bg-white/5 border border-transparent text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1.5 shrink-0 bg-blue-500/20 text-blue-300 border-blue-500/30">
                              <FlagIcon country="US" />
                              <span>US</span>
                            </span>
                            <div className="truncate">
                              <div className="text-xs font-semibold truncate">{v.cleanName}</div>
                              <div className="text-[10px] text-slate-400 truncate">{v.lang}</div>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-blue-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 3. Playback Speed */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-purple-300 flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-purple-400" />
                  Playback Speed
                </label>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {rate.toFixed(2)}x
                </span>
              </div>

              {/* Preset buttons */}
              <div className="grid grid-cols-5 gap-1.5">
                {speedPresets.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => setRate(preset.value)}
                    className={`py-1.5 px-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                      Math.abs(rate - preset.value) < 0.03
                        ? 'bg-purple-600 border-purple-400 text-white font-bold shadow-lg shadow-purple-500/20'
                        : 'bg-slate-800/80 border-white/10 text-slate-300 hover:bg-slate-700/80'
                    }`}
                  >
                    {preset.label.split(' ')[0]}
                  </button>
                ))}
              </div>

              {/* Slider */}
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.05"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 px-1">
                <span>0.5x (Slow)</span>
                <span>1.0x (Normal)</span>
                <span>1.5x (Fast)</span>
              </div>
            </div>

            {/* 4. Volume slider */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-purple-300 flex items-center gap-2">
                  {volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-purple-400" />
                  )}
                  Volume
                </label>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {Math.round(volume * 100)}%
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            {/* Test Audio Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-4">
              <button
                onClick={handleTestUkVoice}
                disabled={isPlayingUkTest}
                className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-900/30 active:scale-[0.98] transition-all border border-rose-400/30 disabled:opacity-50 cursor-pointer"
              >
                {isPlayingUkTest ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 animate-spin text-rose-200" />
                    <span>Testing UK...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current text-rose-200" />
                    <span>Test UK Audio</span>
                  </>
                )}
              </button>

              <button
                onClick={handleTestUsVoice}
                disabled={isPlayingUsTest}
                className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 active:scale-[0.98] transition-all border border-blue-400/30 disabled:opacity-50 cursor-pointer"
              >
                {isPlayingUsTest ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 animate-spin text-blue-200" />
                    <span>Testing US...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current text-rose-200" />
                    <span>Test US Audio</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-white/10 bg-slate-950/80 flex items-center justify-between gap-4">
          <button
            onClick={resetToDefault}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors py-2 px-3 rounded-lg hover:bg-white/5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Default
          </button>

          <button
            onClick={() => setIsOpen(false)}
            className="py-2.5 px-5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export function VoiceSettingsTriggerButton({ className = '' }: { className?: string }) {
  const { toggleIsOpen } = useVoiceStore();

  return (
    <button
      onClick={toggleIsOpen}
      title="Voice & Speed Settings"
      className={`p-2.5 rounded-xl bg-slate-800/80 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 hover:border-purple-400/60 backdrop-blur-md shadow-md transition-all flex items-center gap-2 group cursor-pointer ${className}`}
    >
      <SlidersHorizontal className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
      <span className="text-xs font-medium hidden sm:inline">Voice</span>
    </button>
  );
}
