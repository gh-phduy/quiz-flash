export interface ModeStatItem {
  correct: number;
  total: number;
}

export type GameModeType = 'flashcards' | 'listening' | 'speaking' | 'test' | 'match';

export type ModeStats = Record<GameModeType, ModeStatItem>;

export const DEFAULT_MODE_STATS: ModeStats = {
  flashcards: { correct: 0, total: 0 },
  listening: { correct: 0, total: 0 },
  speaking: { correct: 0, total: 0 },
  test: { correct: 0, total: 0 },
  match: { correct: 0, total: 0 },
};

export interface SM2Result {
  easinessFactor: number;
  repetitions: number;
  intervalDays: number;
  nextReviewDate: Date;
  masteryLevel: 'new' | 'learning' | 'reviewing' | 'mastered';
  weaknessLevel: number; // 1 to 5
  masteryScore: number;  // 0 to 100
  streakCorrect: number;
  streakIncorrect: number;
  modeStats: ModeStats;
}

export function calculateMasteryScore(params: {
  correctCount: number;
  totalReviews: number;
  easinessFactor: number;
  streakCorrect: number;
  lastReviewedAt: Date | null;
}): number {
  if (params.totalReviews === 0) return 0;

  // 1. Accuracy ratio: max 40 points
  const accuracyRatio = (params.correctCount / params.totalReviews) * 40;

  // 2. EF Normalized (1.3 -> 2.5): max 30 points
  const efNorm = Math.min(30, Math.max(0, ((params.easinessFactor - 1.3) / 1.2) * 30));

  // 3. Streak bonus: max 15 points
  const streakBonus = Math.min(15, params.streakCorrect * 3);

  // 4. Recency bonus: max 15 points
  let recencyBonus = 15;
  if (params.lastReviewedAt) {
    const daysSince = (Date.now() - new Date(params.lastReviewedAt).getTime()) / (1000 * 60 * 60 * 24);
    recencyBonus = Math.max(0, 15 - Math.floor(daysSince) * 2);
  }

  const score = Math.round(accuracyRatio + efNorm + streakBonus + recencyBonus);
  return Math.min(100, Math.max(0, score));
}

export function calculateSM2(
  quality: number, // 0 to 5
  prevEF: number = 2.5,
  prevRepetitions: number = 0,
  prevIntervalDays: number = 0,
  prevCorrectCount: number = 0,
  prevTotalReviews: number = 0,
  prevStreakCorrect: number = 0,
  prevStreakIncorrect: number = 0,
  prevLastReviewedAt: Date | null = null,
  prevModeStats: Partial<ModeStats> = {},
  mode?: GameModeType
): SM2Result {
  let easinessFactor = prevEF;
  let repetitions = prevRepetitions;
  let intervalDays = prevIntervalDays;

  // 1. Calculate Easiness Factor (EF)
  easinessFactor = prevEF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easinessFactor < 1.3) {
    easinessFactor = 1.3;
  }

  // 2. Calculate Repetitions and Interval
  const isCorrect = quality >= 3;
  let streakCorrect = isCorrect ? prevStreakCorrect + 1 : 0;
  let streakIncorrect = !isCorrect ? prevStreakIncorrect + 1 : 0;

  if (isCorrect) {
    if (repetitions === 0) {
      intervalDays = 1;
    } else if (repetitions === 1) {
      intervalDays = 6;
    } else {
      intervalDays = Math.round(prevIntervalDays * easinessFactor);
    }
    repetitions = repetitions + 1;
  } else {
    repetitions = 0;
    intervalDays = 1;
  }

  // 3. Update Mode Stats
  const modeStats: ModeStats = {
    ...DEFAULT_MODE_STATS,
    ...prevModeStats
  };

  if (mode && modeStats[mode]) {
    modeStats[mode] = {
      correct: modeStats[mode].correct + (isCorrect ? 1 : 0),
      total: modeStats[mode].total + 1
    };
  }

  // 4. Determine Mastery Level
  let masteryLevel: 'new' | 'learning' | 'reviewing' | 'mastered' = 'learning';
  if (repetitions === 0) {
    masteryLevel = 'new';
  } else if (repetitions <= 2) {
    masteryLevel = 'learning';
  } else if (repetitions <= 5) {
    masteryLevel = 'reviewing';
  } else {
    masteryLevel = 'mastered';
  }

  // 5. Calculate Next Review Date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + intervalDays);
  nextReviewDate.setHours(0, 0, 0, 0);

  // 6. Calculate Weakness Level (1 to 5)
  let weaknessLevel = 5;
  if (easinessFactor < 1.7) weaknessLevel = 5;
  else if (easinessFactor < 2.0) weaknessLevel = 4;
  else if (easinessFactor < 2.4) weaknessLevel = 3;
  else if (easinessFactor < 2.6) weaknessLevel = 2;
  else weaknessLevel = 1;

  // 7. Calculate Mastery Score (0 to 100)
  const newTotalReviews = prevTotalReviews + 1;
  const newCorrectCount = prevCorrectCount + (isCorrect ? 1 : 0);

  const masteryScore = calculateMasteryScore({
    correctCount: newCorrectCount,
    totalReviews: newTotalReviews,
    easinessFactor,
    streakCorrect,
    lastReviewedAt: new Date()
  });

  return {
    easinessFactor,
    repetitions,
    intervalDays,
    nextReviewDate,
    masteryLevel,
    weaknessLevel,
    masteryScore,
    streakCorrect,
    streakIncorrect,
    modeStats
  };
}
