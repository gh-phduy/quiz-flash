import React from 'react';

interface FlagIconProps {
  country: string; // 'US' | 'UK' | 'AU' | 'CA' | 'IN' | 'VN' | string
  className?: string;
}

export function FlagIcon({ country, className = 'w-5 h-3.5' }: FlagIconProps) {
  const code = country.toUpperCase();

  switch (code) {
    case 'US':
      return (
        <svg className={`${className} rounded-sm shadow-sm inline-block shrink-0`} viewBox="0 0 640 480">
          <path fill="#bd3d44" d="M0 0h640v480H0z"/>
          <path stroke="#fff" strokeWidth="37" d="M0 55.4h640M0 129.2h640M0 203h640M0 277h640M0 350.8h640M0 424.6h640"/>
          <path fill="#192f5d" d="M0 0h284.8v258.5H0z"/>
          <circle fill="#fff" cx="23.7" cy="21.5" r="7"/>
          <circle fill="#fff" cx="71" cy="21.5" r="7"/>
          <circle fill="#fff" cx="118.5" cy="21.5" r="7"/>
          <circle fill="#fff" cx="165.8" cy="21.5" r="7"/>
          <circle fill="#fff" cx="213" cy="21.5" r="7"/>
          <circle fill="#fff" cx="260.5" cy="21.5" r="7"/>
          <circle fill="#fff" cx="47.3" cy="50" r="7"/>
          <circle fill="#fff" cx="94.7" cy="50" r="7"/>
          <circle fill="#fff" cx="142" cy="50" r="7"/>
          <circle fill="#fff" cx="189.4" cy="50" r="7"/>
          <circle fill="#fff" cx="236.7" cy="50" r="7"/>
          <circle fill="#fff" cx="23.7" cy="78.5" r="7"/>
          <circle fill="#fff" cx="71" cy="78.5" r="7"/>
          <circle fill="#fff" cx="118.5" cy="78.5" r="7"/>
          <circle fill="#fff" cx="165.8" cy="78.5" r="7"/>
          <circle fill="#fff" cx="213" cy="78.5" r="7"/>
          <circle fill="#fff" cx="260.5" cy="78.5" r="7"/>
          <circle fill="#fff" cx="47.3" cy="107" r="7"/>
          <circle fill="#fff" cx="94.7" cy="107" r="7"/>
          <circle fill="#fff" cx="142" cy="107" r="7"/>
          <circle fill="#fff" cx="189.4" cy="107" r="7"/>
          <circle fill="#fff" cx="236.7" cy="107" r="7"/>
          <circle fill="#fff" cx="23.7" cy="135.5" r="7"/>
          <circle fill="#fff" cx="71" cy="135.5" r="7"/>
          <circle fill="#fff" cx="118.5" cy="135.5" r="7"/>
          <circle fill="#fff" cx="165.8" cy="135.5" r="7"/>
          <circle fill="#fff" cx="213" cy="135.5" r="7"/>
          <circle fill="#fff" cx="260.5" cy="135.5" r="7"/>
          <circle fill="#fff" cx="47.3" cy="164" r="7"/>
          <circle fill="#fff" cx="94.7" cy="164" r="7"/>
          <circle fill="#fff" cx="142" cy="164" r="7"/>
          <circle fill="#fff" cx="189.4" cy="164" r="7"/>
          <circle fill="#fff" cx="236.7" cy="164" r="7"/>
          <circle fill="#fff" cx="23.7" cy="192.5" r="7"/>
          <circle fill="#fff" cx="71" cy="192.5" r="7"/>
          <circle fill="#fff" cx="118.5" cy="192.5" r="7"/>
          <circle fill="#fff" cx="165.8" cy="192.5" r="7"/>
          <circle fill="#fff" cx="213" cy="192.5" r="7"/>
          <circle fill="#fff" cx="260.5" cy="192.5" r="7"/>
          <circle fill="#fff" cx="47.3" cy="221" r="7"/>
          <circle fill="#fff" cx="94.7" cy="221" r="7"/>
          <circle fill="#fff" cx="142" cy="221" r="7"/>
          <circle fill="#fff" cx="189.4" cy="221" r="7"/>
          <circle fill="#fff" cx="236.7" cy="221" r="7"/>
        </svg>
      );
    case 'UK':
    case 'GB':
      return (
        <svg className={`${className} rounded-sm shadow-sm inline-block shrink-0`} viewBox="0 0 640 480">
          <path fill="#012169" d="M0 0h640v480H0z"/>
          <path fill="#FFF" d="m0 0 640 480M640 0 0 480" stroke="#FFF" strokeWidth="60"/>
          <path fill="#C8102E" d="m0 0 640 480M640 0 0 480" stroke="#C8102E" strokeWidth="40"/>
          <path fill="#FFF" d="M320 0v480M0 240h640" stroke="#FFF" strokeWidth="100"/>
          <path fill="#C8102E" d="M320 0v480M0 240h640" stroke="#C8102E" strokeWidth="60"/>
        </svg>
      );
    case 'AU':
      return (
        <svg className={`${className} rounded-sm shadow-sm inline-block shrink-0`} viewBox="0 0 640 480">
          <path fill="#00008b" d="M0 0h640v480H0z"/>
          <path fill="#FFF" d="m0 0 320 240M320 0 0 240" stroke="#FFF" strokeWidth="30"/>
          <path fill="#C8102E" d="m0 0 320 240M320 0 0 240" stroke="#C8102E" strokeWidth="20"/>
          <path fill="#FFF" d="M160 0v240M0 120h320" stroke="#FFF" strokeWidth="50"/>
          <path fill="#C8102E" d="M160 0v240M0 120h320" stroke="#C8102E" strokeWidth="30"/>
          <circle fill="#FFF" cx="480" cy="120" r="16"/>
          <circle fill="#FFF" cx="540" cy="200" r="14"/>
          <circle fill="#FFF" cx="420" cy="240" r="14"/>
          <circle fill="#FFF" cx="500" cy="340" r="14"/>
          <circle fill="#FFF" cx="160" cy="360" r="28"/>
        </svg>
      );
    case 'CA':
      return (
        <svg className={`${className} rounded-sm shadow-sm inline-block shrink-0`} viewBox="0 0 640 480">
          <path fill="#ff0000" d="M0 0h160v480H0zm480 0h160v480H480z"/>
          <path fill="#fff" d="M160 0h320v480H160z"/>
          <path fill="#ff0000" d="M320 72l20 60 50-20-20 60 60 20-50 40 30 50-60-20v60h-20v-60l-60 20 30-50-50-40 60-20-20-60 50 20z"/>
        </svg>
      );
    case 'IN':
      return (
        <svg className={`${className} rounded-sm shadow-sm inline-block shrink-0`} viewBox="0 0 640 480">
          <path fill="#f93" d="M0 0h640v160H0z"/>
          <path fill="#fff" d="M0 160h640v160H0z"/>
          <path fill="#128807" d="M0 320h640v160H0z"/>
          <circle fill="none" stroke="#000080" strokeWidth="8" cx="320" cy="240" r="50"/>
        </svg>
      );
    case 'VN':
      return (
        <svg className={`${className} rounded-sm shadow-sm inline-block shrink-0`} viewBox="0 0 640 480">
          <path fill="#da251d" d="M0 0h640v480H0z"/>
          <path fill="#ffff00" d="M320 100l47 145h153l-124 90 47 145-123-90-123 90 47-145-124-90h153z"/>
        </svg>
      );
    default:
      return (
        <span className="w-5 h-3.5 bg-slate-700 text-[9px] font-bold text-white rounded flex items-center justify-center shrink-0 border border-white/20">
          {code.slice(0, 2)}
        </span>
      );
  }
}
