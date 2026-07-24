export interface ModeStatItem {
  correct: number;
  total: number;
}

export type GameModeType = 'flashcards' | 'listening' | 'speaking' | 'test' | 'match' | 'review';

export type ModeStats = Record<GameModeType, ModeStatItem>;

export const DEFAULT_MODE_STATS: ModeStats = {
  flashcards: { correct: 0, total: 0 },
  listening: { correct: 0, total: 0 },
  speaking: { correct: 0, total: 0 },
  test: { correct: 0, total: 0 },
  match: { correct: 0, total: 0 },
  review: { correct: 0, total: 0 },
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
  isReviewMode: boolean = false
): SM2Result {
  let easinessFactor = prevEF;
  let repetitions = prevRepetitions;
  let intervalDays = prevIntervalDays;

  // 1. Calculate Easiness Factor (EF)
  easinessFactor = prevEF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easinessFactor < 1.3) {
    easinessFactor = 1.3;
  }

  // 2. Calculate Repetitions and Interval (Two-Stage Immediate Review Queue System)
  const isCorrect = quality >= 3;
  let streakCorrect = isCorrect ? prevStreakCorrect + 1 : 0;
  let streakIncorrect = !isCorrect ? prevStreakIncorrect + 1 : 0;

  let daysToAdd = 1;
  const inReviewSession = isReviewMode || mode === 'review';

  if (prevRepetitions === 0) {
    // STAGE 1 & 2 FOR NEW CARDS:
    // If playing in a Game Mode (not explicit Review Mode):
    //   -> Queue IMMEDIATELY for TODAY (daysToAdd = 0, repetitions = 0) so the user can review it in the Review Queue today.
    // If reviewing in Review Mode:
    //   -> If Correct: promote to repetitions = 1, interval = 1 day, schedule for TOMORROW (daysToAdd = 1) -> Pass queue!
    //   -> If Incorrect: keep repetitions = 0, interval = 0 days, stay in TODAY queue (daysToAdd = 0) until answered correctly, while recording total_reviews & error stats!
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
    // STAGE 3+: Standard SM-2 Spaced Repetition for established cards (repetitions >= 1)
    if (isCorrect) {
      if (repetitions === 1) {
        intervalDays = 6; // 6 days interval on second consecutive correct answer!
      } else {
        intervalDays = Math.max(1, Math.round(prevIntervalDays * easinessFactor));
      }
      repetitions = repetitions + 1;
      daysToAdd = Math.max(1, intervalDays);
    } else {
      // Incorrect answer on an established card: reset repetitions to 0, push to TOMORROW for re-learning
      repetitions = 0;
      intervalDays = 1;
      daysToAdd = 1;
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
  if (prevTotalReviews === 0 && repetitions === 0 && daysToAdd === 0) {
    masteryLevel = 'learning';
  } else if (repetitions <= 2) {
    masteryLevel = 'learning';
  } else if (repetitions <= 5) {
    masteryLevel = 'reviewing';
  } else {
    masteryLevel = 'mastered';
  }

  // 5. Calculate Next Review Date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + daysToAdd);
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
    nextReviewDateStr: formatDateToYYYYMMDD(nextReviewDate),
    masteryLevel,
    weaknessLevel,
    masteryScore,
    streakCorrect,
    streakIncorrect,
    modeStats
  };
}
