export interface ModeStatItem {
  correct: number;
  total: number;
}

export type GameModeType = 'flashcards' | 'listening' | 'speaking' | 'test' | 'match' | 'review' | 'typing';

export type ModeStats = Record<GameModeType, ModeStatItem>;

export const DEFAULT_MODE_STATS: ModeStats = {
  flashcards: { correct: 0, total: 0 },
  listening: { correct: 0, total: 0 },
  speaking: { correct: 0, total: 0 },
  test: { correct: 0, total: 0 },
  match: { correct: 0, total: 0 },
  review: { correct: 0, total: 0 },
  typing: { correct: 0, total: 0 },
};

export interface SM2Result {
  easinessFactor: number;
  repetitions: number;
  intervalDays: number;
  nextReviewDate: Date;
  nextReviewDateStr: string;
  masteryLevel: 'new' | 'learning' | 'reviewing' | 'mastered';
  weaknessLevel: number; // 1 to 5
  masteryScore: number;  // 0 to 100
  streakCorrect: number;
  streakIncorrect: number;
  modeStats: ModeStats;
}

export function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
  mode?: GameModeType,
  isReviewMode: boolean = false,
  prevNextReviewDateStr?: string | null
): SM2Result {
  const isCorrect = quality >= 3;
  let streakCorrect = isCorrect ? prevStreakCorrect + 1 : 0;
  let streakIncorrect = !isCorrect ? prevStreakIncorrect + 1 : 0;

  // Special Mode: 'typing' - Completely exempt from SM-2 calculation to protect review intervals!
  if (mode === 'typing') {
    const modeStats: ModeStats = {
      ...DEFAULT_MODE_STATS,
      ...prevModeStats
    };

    // Update both 'typing' and 'review' mode stats so accuracy is shared!
    modeStats.typing = {
      correct: (modeStats.typing?.correct || 0) + (isCorrect ? 1 : 0),
      total: (modeStats.typing?.total || 0) + 1
    };
    modeStats.review = {
      correct: (modeStats.review?.correct || 0) + (isCorrect ? 1 : 0),
      total: (modeStats.review?.total || 0) + 1
    };

    const nextReviewDateStr = prevNextReviewDateStr || formatDateToYYYYMMDD(new Date());
    const nextReviewDate = new Date(nextReviewDateStr);

    let weaknessLevel = 5;
    if (prevEF < 1.7) weaknessLevel = 5;
    else if (prevEF < 2.0) weaknessLevel = 4;
    else if (prevEF < 2.4) weaknessLevel = 3;
    else if (prevEF < 2.6) weaknessLevel = 2;
    else weaknessLevel = 1;

    const newTotalReviews = prevTotalReviews + 1;
    const newCorrectCount = prevCorrectCount + (isCorrect ? 1 : 0);
    const accuracy = newTotalReviews > 0 ? newCorrectCount / newTotalReviews : 0;

    let masteryLevel: 'new' | 'learning' | 'reviewing' | 'mastered' = 'learning';
    if (newTotalReviews === 0) {
      masteryLevel = 'learning';
    } else if (prevRepetitions >= 5 || (newTotalReviews >= 3 && accuracy >= 0.9)) {
      masteryLevel = 'mastered';
    } else if (prevRepetitions >= 3 || (newTotalReviews >= 2 && accuracy >= 0.75)) {
      masteryLevel = 'reviewing';
    } else {
      masteryLevel = 'learning';
    }

    const masteryScore = calculateMasteryScore({
      correctCount: newCorrectCount,
      totalReviews: newTotalReviews,
      easinessFactor: prevEF,
      streakCorrect,
      lastReviewedAt: new Date()
    });

    return {
      easinessFactor: prevEF,
      repetitions: prevRepetitions,
      intervalDays: prevIntervalDays,
      nextReviewDate,
      nextReviewDateStr,
      masteryLevel,
      weaknessLevel,
      masteryScore,
      streakCorrect,
      streakIncorrect,
      modeStats
    };
  }

  let easinessFactor = prevEF;
  let repetitions = prevRepetitions;
  let intervalDays = prevIntervalDays;

  // 1. Calculate Easiness Factor (EF)
  easinessFactor = prevEF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easinessFactor < 1.3) {
    easinessFactor = 1.3;
  }

  // 2. Calculate Repetitions and Interval (Two-Stage Immediate Review Queue System)
  let daysToAdd = 1;
  const inReviewSession = isReviewMode || mode === 'review';

  if (prevRepetitions === 0) {
    if (!inReviewSession) {
      repetitions = 0;
      intervalDays = 0;
      daysToAdd = 0; // TODAY
    } else {
      if (isCorrect) {
        repetitions = 1;
        intervalDays = 1;
        daysToAdd = 1; // TOMORROW (Pass queue)
      } else {
        repetitions = 0;
        intervalDays = 0;
        daysToAdd = 0; // TODAY (Stay in queue until correct)
      }
    }
  } else {
    if (!inReviewSession) {
      if (!isCorrect) {
        repetitions = 0;
        intervalDays = 1;
        daysToAdd = 1;
      }
    } else {
      if (isCorrect) {
        if (repetitions === 1) {
          intervalDays = 6;
        } else {
          intervalDays = Math.max(1, Math.round(prevIntervalDays * easinessFactor));
        }
        repetitions = repetitions + 1;
        daysToAdd = Math.max(1, intervalDays);
      } else {
        repetitions = 0;
        intervalDays = 1;
        daysToAdd = 1;
      }
    }
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
  
  const newTotalReviews = prevTotalReviews + 1;
  const newCorrectCount = prevCorrectCount + (isCorrect ? 1 : 0);
  const accuracy = newTotalReviews > 0 ? newCorrectCount / newTotalReviews : 0;

  if (newTotalReviews === 0) {
    masteryLevel = 'learning';
  } else if (repetitions >= 5 || (newTotalReviews >= 3 && accuracy >= 0.9)) {
    masteryLevel = 'mastered';
  } else if (repetitions >= 3 || (newTotalReviews >= 2 && accuracy >= 0.75)) {
    masteryLevel = 'reviewing';
  } else {
    masteryLevel = 'learning';
  }

  // 5. Calculate Next Review Date
  let nextReviewDate = new Date();
  let nextReviewDateStr = '';

  const shouldFreeze = !inReviewSession && isCorrect && prevRepetitions >= 1;

  if (shouldFreeze && prevNextReviewDateStr) {
    nextReviewDate = new Date(prevNextReviewDateStr);
    nextReviewDateStr = prevNextReviewDateStr;
  } else {
    nextReviewDate.setDate(nextReviewDate.getDate() + daysToAdd);
    nextReviewDate.setHours(0, 0, 0, 0);
    nextReviewDateStr = formatDateToYYYYMMDD(nextReviewDate);
  }

  // 6. Calculate Weakness Level (1 to 5)
  let weaknessLevel = 5;
  if (easinessFactor < 1.7) weaknessLevel = 5;
  else if (easinessFactor < 2.0) weaknessLevel = 4;
  else if (easinessFactor < 2.4) weaknessLevel = 3;
  else if (easinessFactor < 2.6) weaknessLevel = 2;
  else weaknessLevel = 1;

  // 7. Calculate Mastery Score (0 to 100)

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
    nextReviewDateStr,
    masteryLevel,
    weaknessLevel,
    masteryScore,
    streakCorrect,
    streakIncorrect,
    modeStats
  };
}
