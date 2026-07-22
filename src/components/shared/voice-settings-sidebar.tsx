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
  Search,
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

// UK Voices placed at the top of the list
const DISTINCT_VOICES: CustomVoiceInfo[] = [
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
    selectedVoiceURI,
    setSelectedVoiceURI,
    rate,
    setRate,
    volume,
    setVolume,
    resetToDefault,
  } = useVoiceStore();

  const [voices] = useState<CustomVoiceInfo[]>(DISTINCT_VOICES);
  const [isPlayingTest, setIsPlayingTest] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Default selection fallback to UK Female
  useEffect(() => {
    if (!selectedVoiceURI && DISTINCT_VOICES.length > 0) {
      setSelectedVoiceURI('uk_female');
    }
  }, [selectedVoiceURI, setSelectedVoiceURI]);

  const handleTestVoice = () => {
    setIsPlayingTest(true);
    playAudio(null, 'Hello! This is a test of your selected voice model and speed.');
    setTimeout(() => {
      setIsPlayingTest(false);
    }, 2800);
  };

  const speedPresets = [
    { label: '0.75x', value: 0.75 },
    { label: '0.9x', value: 0.9 },
    { label: '1.0x (Normal)', value: 1.0 },
    { label: '1.25x', value: 1.25 },
    { label: '1.5x', value: 1.5 },
  ];

  const selectedVoice = voices.find((v) => v.voiceURI === selectedVoiceURI) || voices[0];

  const filteredVoices = voices.filter(
    (v) =>
      v.cleanName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.regionBadge.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.lang.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                <p className="text-xs text-slate-400">Configure speech voice model, speed & volume</p>
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
            {/* 1. Voice Model Selector (Rich Custom Dropdown with SVG Flags) */}
            <div className="space-y-2 relative" ref={dropdownRef}>
              <label className="text-sm font-semibold text-purple-300 flex items-center gap-2">
                <Globe className="w-4 h-4 text-purple-400" />
                Voice Model
              </label>

              <div className="relative">
                {/* Dropdown Trigger Box */}
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full bg-slate-800/90 hover:bg-slate-800 border border-white/15 hover:border-purple-500/50 rounded-2xl p-3.5 text-left flex items-center justify-between transition-all shadow-md group cursor-pointer"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    {selectedVoice && (
                      <span
                        className={`px-2 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 shrink-0 ${selectedVoice.regionBadge.colorClass}`}
                      >
                        <FlagIcon country={selectedVoice.regionBadge.code} />
                        <span>{selectedVoice.regionBadge.code}</span>
                      </span>
                    )}
                    <div className="truncate">
                      <div className="text-sm font-bold text-white truncate flex items-center gap-2">
                        <span>{selectedVoice?.cleanName || 'Select Voice'}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {selectedVoice?.regionBadge.label} • {selectedVoice?.lang}
                      </div>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 group-hover:text-white transition-transform shrink-0 ${
                      isDropdownOpen ? 'rotate-180 text-purple-400' : ''
                    }`}
                  />
                </button>

                {/* Rich Dropdown Panel */}
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-slate-900/98 border border-white/15 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Search Bar */}
                    <div className="p-2.5 border-b border-white/10 bg-slate-950/60 flex items-center gap-2">
                      <Search className="w-4 h-4 text-slate-400 shrink-0" />
                      <input
                        type="text"
                        placeholder="Search voice model (UK, US, Male, Female...)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="text-slate-500 hover:text-white text-xs cursor-pointer"
                        >
                          ×
                        </button>
                      )}
                    </div>

                    {/* Voices List */}
                    <div className="max-h-64 overflow-y-auto p-1.5 space-y-1">
                      {filteredVoices.length === 0 ? (
                        <div className="p-4 text-xs text-slate-400 text-center">No matching voices found</div>
                      ) : (
                        filteredVoices.map((v) => {
                          const isSelected = v.voiceURI === selectedVoiceURI;
                          return (
                            <button
                              key={v.voiceURI}
                              type="button"
                              onClick={() => {
                                setSelectedVoiceURI(v.voiceURI);
                                setIsDropdownOpen(false);
                              }}
                              className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-purple-600/30 border border-purple-500/50 text-white shadow-sm'
                                  : 'hover:bg-white/5 border border-transparent text-slate-200'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 overflow-hidden">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1.5 shrink-0 ${v.regionBadge.colorClass}`}
                                >
                                  <FlagIcon country={v.regionBadge.code} />
                                  <span>{v.regionBadge.code}</span>
                                </span>
                                <div className="truncate">
                                  <div className="text-xs font-semibold truncate flex items-center gap-1.5">
                                    <span>{v.cleanName}</span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 truncate">
                                    {v.regionBadge.label} • {v.lang}
                                  </div>
                                </div>
                              </div>
                              {isSelected && (
                                <Check className="w-4 h-4 text-purple-400 shrink-0" />
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-slate-400 px-1">
                Select your preferred voice model for speech pronunciation in games.
              </p>
            </div>

            {/* 2. Playback Speed */}
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

            {/* 3. Volume slider */}
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

            {/* Test Audio Button */}
            <div className="pt-4">
              <button
                onClick={handleTestVoice}
                disabled={isPlayingTest}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-purple-900/30 active:scale-[0.98] transition-all border border-purple-400/30 disabled:opacity-50 cursor-pointer"
              >
                {isPlayingTest ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin text-purple-200" />
                    <span>Testing sample audio...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current text-purple-200" />
                    <span>Test Sample Audio</span>
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
