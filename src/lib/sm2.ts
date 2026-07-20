export interface SM2Result {
  easinessFactor: number;
  repetitions: number;
  intervalDays: number;
  nextReviewDate: Date;
  masteryLevel: 'new' | 'learning' | 'reviewing' | 'mastered';
  weaknessLevel: number; // 1 to 5
}

export function calculateSM2(
  quality: number, // 0 to 5
  prevEF: number, // default 2.5
  prevRepetitions: number, // default 0
  prevIntervalDays: number // default 0
): SM2Result {
  let easinessFactor = prevEF;
  let repetitions = prevRepetitions;
  let intervalDays = prevIntervalDays;

  // 1. Calculate Easiness Factor (EF)
  // Formula: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  easinessFactor = prevEF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  
  // EF cannot be less than 1.3
  if (easinessFactor < 1.3) {
    easinessFactor = 1.3;
  }

  // 2. Calculate Repetitions and Interval
  if (quality >= 3) {
    // Correct recall
    if (repetitions === 0) {
      intervalDays = 1;
    } else if (repetitions === 1) {
      intervalDays = 6;
    } else {
      intervalDays = Math.round(prevIntervalDays * easinessFactor);
    }
    repetitions = repetitions + 1;
  } else {
    // Incorrect recall / Forgot
    repetitions = 0;
    intervalDays = 1;
  }

  // 3. Determine Mastery Level
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

  // 4. Calculate Next Review Date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + intervalDays);
  // Reset time to start of day for cleaner DATE handling in DB
  nextReviewDate.setHours(0, 0, 0, 0);

  // 5. Calculate Weakness Level (1 to 5)
  let weaknessLevel = 5;
  if (easinessFactor < 1.7) weaknessLevel = 5;
  else if (easinessFactor < 2.0) weaknessLevel = 4;
  else if (easinessFactor < 2.4) weaknessLevel = 3;
  else if (easinessFactor < 2.6) weaknessLevel = 2;
  else weaknessLevel = 1;

  return {
    easinessFactor,
    repetitions,
    intervalDays,
    nextReviewDate,
    masteryLevel,
    weaknessLevel,
  };
}
