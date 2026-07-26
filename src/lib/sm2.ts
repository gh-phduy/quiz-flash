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
