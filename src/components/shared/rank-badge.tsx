import React from 'react';
import { 
  Shield, 
  Award, 
  Flame, 
  Zap, 
  Crown, 
  Sparkles, 
  Gem, 
  Swords, 
  Star,
  Target
} from 'lucide-react';

export interface RankConfig {
  name: string;      // e.g. "Gold III", "Challenger"
  tier: string;      // e.g. "Gold", "Challenger"
  division?: string; // e.g. "III", "IV"
  minPoints: number;
  maxPoints: number;
  gradient: string;
  border: string;
  textColor: string;
  glow: string;
  badgeBg: string;
  icon: React.ElementType;
}

const COMMON_TIER_STYLES: Record<string, Omit<RankConfig, 'name' | 'minPoints' | 'maxPoints' | 'division'>> = {
  Iron: {
    tier: 'Iron',
    gradient: 'from-slate-600 via-slate-500 to-slate-700',
    border: 'border-slate-400/40',
    textColor: 'text-slate-300',
    glow: 'shadow-[0_0_12px_rgba(148,163,184,0.2)]',
    badgeBg: 'bg-slate-500/10',
    icon: Shield
  },
  Bronze: {
    tier: 'Bronze',
    gradient: 'from-amber-700 via-amber-600 to-amber-800',
    border: 'border-amber-600/40',
    textColor: 'text-amber-400',
    glow: 'shadow-[0_0_12px_rgba(217,119,6,0.25)]',
    badgeBg: 'bg-amber-600/10',
    icon: Target
  },
  Silver: {
    tier: 'Silver',
    gradient: 'from-slate-400 via-slate-300 to-slate-500',
    border: 'border-slate-300/40',
    textColor: 'text-slate-200',
    glow: 'shadow-[0_0_12px_rgba(203,213,225,0.3)]',
    badgeBg: 'bg-slate-300/10',
    icon: Award
  },
  Gold: {
    tier: 'Gold',
    gradient: 'from-yellow-400 via-amber-400 to-yellow-500',
    border: 'border-yellow-400/50',
    textColor: 'text-yellow-400',
    glow: 'shadow-[0_0_15px_rgba(250,204,21,0.35)]',
    badgeBg: 'bg-yellow-400/10',
    icon: Star
  },
  Platinum: {
    tier: 'Platinum',
    gradient: 'from-cyan-400 via-teal-400 to-cyan-500',
    border: 'border-cyan-400/40',
    textColor: 'text-cyan-300',
    glow: 'shadow-[0_0_15px_rgba(34,211,238,0.35)]',
    badgeBg: 'bg-cyan-400/10',
    icon: Flame
  },
  Emerald: {
    tier: 'Emerald',
    gradient: 'from-emerald-400 via-green-400 to-emerald-500',
    border: 'border-emerald-400/40',
    textColor: 'text-emerald-400',
    glow: 'shadow-[0_0_15px_rgba(52,211,153,0.35)]',
    badgeBg: 'bg-emerald-400/10',
    icon: Zap
  },
  Diamond: {
    tier: 'Diamond',
    gradient: 'from-blue-400 via-indigo-400 to-blue-500',
    border: 'border-blue-400/50',
    textColor: 'text-blue-400',
    glow: 'shadow-[0_0_18px_rgba(96,165,250,0.4)]',
    badgeBg: 'bg-blue-400/10',
    icon: Gem
  },
  Master: {
    tier: 'Master',
    gradient: 'from-purple-400 via-fuchsia-400 to-purple-600',
    border: 'border-purple-400/50',
    textColor: 'text-purple-400',
    glow: 'shadow-[0_0_20px_rgba(192,132,252,0.45)]',
    badgeBg: 'bg-purple-400/10',
    icon: Swords
  },
  Grandmaster: {
    tier: 'Grandmaster',
    gradient: 'from-rose-500 via-red-500 to-rose-600',
    border: 'border-rose-500/50',
    textColor: 'text-rose-400',
    glow: 'shadow-[0_0_22px_rgba(244,63,94,0.5)]',
    badgeBg: 'bg-rose-500/10',
    icon: Sparkles
  },
  Challenger: {
    tier: 'Challenger',
    gradient: 'from-sky-400 via-indigo-400 to-purple-400',
    border: 'border-sky-400/60',
    textColor: 'text-sky-300',
    glow: 'shadow-[0_0_25px_rgba(56,189,248,0.6)] animate-pulse',
    badgeBg: 'bg-sky-400/15',
    icon: Crown
  }
};

export const LOL_RANKS_LIST: RankConfig[] = [
  // Iron (0 - 9,999)
  { ...COMMON_TIER_STYLES.Iron, name: 'Iron IV', division: 'IV', minPoints: 0, maxPoints: 2499 },
  { ...COMMON_TIER_STYLES.Iron, name: 'Iron III', division: 'III', minPoints: 2500, maxPoints: 4999 },
  { ...COMMON_TIER_STYLES.Iron, name: 'Iron II', division: 'II', minPoints: 5000, maxPoints: 7499 },
  { ...COMMON_TIER_STYLES.Iron, name: 'Iron I', division: 'I', minPoints: 7500, maxPoints: 9999 },

  // Bronze (10,000 - 29,999)
  { ...COMMON_TIER_STYLES.Bronze, name: 'Bronze IV', division: 'IV', minPoints: 10000, maxPoints: 14999 },
  { ...COMMON_TIER_STYLES.Bronze, name: 'Bronze III', division: 'III', minPoints: 15000, maxPoints: 19999 },
  { ...COMMON_TIER_STYLES.Bronze, name: 'Bronze II', division: 'II', minPoints: 20000, maxPoints: 24999 },
  { ...COMMON_TIER_STYLES.Bronze, name: 'Bronze I', division: 'I', minPoints: 25000, maxPoints: 29999 },

  // Silver (30,000 - 59,999)
  { ...COMMON_TIER_STYLES.Silver, name: 'Silver IV', division: 'IV', minPoints: 30000, maxPoints: 36999 },
  { ...COMMON_TIER_STYLES.Silver, name: 'Silver III', division: 'III', minPoints: 37000, maxPoints: 43999 },
  { ...COMMON_TIER_STYLES.Silver, name: 'Silver II', division: 'II', minPoints: 44000, maxPoints: 51999 },
  { ...COMMON_TIER_STYLES.Silver, name: 'Silver I', division: 'I', minPoints: 52000, maxPoints: 59999 },

  // Gold (60,000 - 119,999)
  { ...COMMON_TIER_STYLES.Gold, name: 'Gold IV', division: 'IV', minPoints: 60000, maxPoints: 74999 },
  { ...COMMON_TIER_STYLES.Gold, name: 'Gold III', division: 'III', minPoints: 75000, maxPoints: 89999 },
  { ...COMMON_TIER_STYLES.Gold, name: 'Gold II', division: 'II', minPoints: 90000, maxPoints: 104999 },
  { ...COMMON_TIER_STYLES.Gold, name: 'Gold I', division: 'I', minPoints: 105000, maxPoints: 119999 },

  // Platinum (120,000 - 199,999)
  { ...COMMON_TIER_STYLES.Platinum, name: 'Platinum IV', division: 'IV', minPoints: 120000, maxPoints: 139999 },
  { ...COMMON_TIER_STYLES.Platinum, name: 'Platinum III', division: 'III', minPoints: 140000, maxPoints: 159999 },
  { ...COMMON_TIER_STYLES.Platinum, name: 'Platinum II', division: 'II', minPoints: 160000, maxPoints: 179999 },
  { ...COMMON_TIER_STYLES.Platinum, name: 'Platinum I', division: 'I', minPoints: 180000, maxPoints: 199999 },

  // Emerald (200,000 - 319,999)
  { ...COMMON_TIER_STYLES.Emerald, name: 'Emerald IV', division: 'IV', minPoints: 200000, maxPoints: 229999 },
  { ...COMMON_TIER_STYLES.Emerald, name: 'Emerald III', division: 'III', minPoints: 230000, maxPoints: 259999 },
  { ...COMMON_TIER_STYLES.Emerald, name: 'Emerald II', division: 'II', minPoints: 260000, maxPoints: 289999 },
  { ...COMMON_TIER_STYLES.Emerald, name: 'Emerald I', division: 'I', minPoints: 290000, maxPoints: 319999 },

  // Diamond (320,000 - 499,999)
  { ...COMMON_TIER_STYLES.Diamond, name: 'Diamond IV', division: 'IV', minPoints: 320000, maxPoints: 359999 },
  { ...COMMON_TIER_STYLES.Diamond, name: 'Diamond III', division: 'III', minPoints: 360000, maxPoints: 399999 },
  { ...COMMON_TIER_STYLES.Diamond, name: 'Diamond II', division: 'II', minPoints: 400000, maxPoints: 449999 },
  { ...COMMON_TIER_STYLES.Diamond, name: 'Diamond I', division: 'I', minPoints: 450000, maxPoints: 499999 },

  // Apex Ranks (500,000 - 1,000,000+)
  { ...COMMON_TIER_STYLES.Master, name: 'Master', minPoints: 500000, maxPoints: 699999 },
  { ...COMMON_TIER_STYLES.Grandmaster, name: 'Grandmaster', minPoints: 700000, maxPoints: 999999 },
  { ...COMMON_TIER_STYLES.Challenger, name: 'Challenger', minPoints: 1000000, maxPoints: 99999999 }
];

export function getRankFromPoints(points: number = 0): RankConfig {
  for (let i = LOL_RANKS_LIST.length - 1; i >= 0; i--) {
    if (points >= LOL_RANKS_LIST[i].minPoints) {
      return LOL_RANKS_LIST[i];
    }
  }
  return LOL_RANKS_LIST[0];
}

export function getRankConfig(rankStr?: string | null, points?: number): RankConfig {
  if (points !== undefined) {
    return getRankFromPoints(points);
  }
  if (!rankStr) return LOL_RANKS_LIST[0];
  const query = rankStr.toLowerCase().trim();
  
  // Exact match e.g. "gold iii"
  const exactMatch = LOL_RANKS_LIST.find(r => r.name.toLowerCase() === query);
  if (exactMatch) return exactMatch;

  // Tier match e.g. "gold" -> Gold IV
  const tierMatch = LOL_RANKS_LIST.find(r => r.tier.toLowerCase() === query);
  if (tierMatch) return tierMatch;

  return LOL_RANKS_LIST[0];
}

export interface RankBadgeProps {
  rank?: string | null;
  points?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showIcon?: boolean;
  showProgress?: boolean;
  className?: string;
}

export function RankBadge({
  rank,
  points,
  size = 'md',
  showIcon = true,
  showProgress = false,
  className = ''
}: RankBadgeProps) {
  const config = points !== undefined ? getRankFromPoints(points) : getRankConfig(rank, points);
  const IconComponent = config.icon;

  // Size styles
  const sizeStyles = {
    xs: 'px-2 py-0.5 text-[9px] gap-1 rounded-md',
    sm: 'px-2.5 py-1 text-[10px] sm:text-[11px] gap-1.5 rounded-lg',
    md: 'px-3 py-1.5 text-xs gap-1.5 rounded-xl',
    lg: 'px-4 py-2 text-sm gap-2 rounded-2xl',
    xl: 'px-5 py-2.5 text-base gap-2.5 rounded-2xl'
  };

  const iconSizes = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
    xl: 'w-5 h-5'
  };

  // Calculate progress to next rank division
  let progressPercent = 100;
  let pointsNeeded = 0;
  if (showProgress && points !== undefined) {
    const currentMin = config.minPoints;
    const currentMax = config.maxPoints;
    if (currentMax < 9999999) {
      const range = currentMax - currentMin;
      const progress = points - currentMin;
      progressPercent = Math.min(100, Math.max(0, Math.round((progress / range) * 100)));
      pointsNeeded = (currentMax + 1) - points;
    }
  }

  return (
    <div className={`inline-flex flex-col gap-1.5 ${className}`}>
      <div 
        className={`inline-flex items-center font-extrabold uppercase tracking-wider backdrop-blur-md border ${config.border} ${config.badgeBg} ${config.textColor} ${config.glow} ${sizeStyles[size]} transition-all duration-200`}
      >
        {showIcon && <IconComponent className={`${iconSizes[size]} shrink-0 fill-current`} />}
        <span>{config.name}</span>
      </div>

      {showProgress && points !== undefined && config.maxPoints < 9999999 && (
        <div className="w-full space-y-1">
          <div className="flex justify-between items-center text-[10px] text-muted-foreground font-semibold">
            <span>{points.toLocaleString()} / {(config.maxPoints + 1).toLocaleString()} pts</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/5">
            <div 
              className={`h-full rounded-full bg-gradient-to-r ${config.gradient} transition-all duration-500`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {pointsNeeded > 0 && (
            <p className="text-[9px] text-slate-400 font-mono text-right">
              +{pointsNeeded.toLocaleString()} pts to next division
            </p>
          )}
        </div>
      )}
    </div>
  );
}
