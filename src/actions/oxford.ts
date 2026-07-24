'use server';

import { createClient } from '@/utils/supabase/server';

export interface OxfordWordStats {
  id: string;
  setId: string;
  setTitle: string;
  term: string;
  definition: string;
  phonetic?: string | null;
  audioUrl?: string | null;
  partOfSpeech?: string | null;
  cefrLevel?: string | null;
  masteryLevel: 'new' | 'learning' | 'reviewing' | 'mastered';
  weaknessLevel: number;
  totalReviews: number;
  correctCount: number;
  incorrectCount: number;
  accuracy: number;
  repetitions: number;
  intervalDays: number;
  nextReviewDate?: string | null;
  lastReviewedAt?: string | null;
  modeStats?: Record<string, { total: number; correct: number }>;
}

export interface OxfordSetSummary {
  id: string;
  title: string;
  description: string;
  cefrLevel: string;
  totalCards: number;
  masteredCount?: number;
  reviewingCount?: number;
  learningCount?: number;
  unstudiedCount?: number;
  masteryPercentage?: number;
  totalReviews?: number;
  correctCount?: number;
  incorrectCount?: number;
  accuracy?: number;
  weakCount?: number;
}

export interface OxfordSetAnalytics extends OxfordSetSummary {
  masteredCount: number;
  reviewingCount: number;
  learningCount: number;
  unstudiedCount: number;
  masteryPercentage: number;
  totalReviews: number;
  correctCount: number;
  incorrectCount: number;
  accuracy: number;
  weakCount: number;
  allCards: OxfordWordStats[];
  weakCards: OxfordWordStats[];
}

export interface OxfordSummaryAnalytics {
  isLoggedIn: boolean;
  userId?: string;
  userName?: string;
  userEmail?: string;
  totalOxfordSets: number;
  totalOxfordWords: number;
  sets: OxfordSetSummary[];
}

// Order helper for CEFR levels
const LEVEL_ORDER: Record<string, number> = {
  'A1': 1,
  'A2': 2,
  'B1': 3,
  'B2': 4,
  'B2 (Mở rộng)': 5,
  'C1': 6,
  'C2': 7,
};

function extractCefrLevel(title: string): string {
  const upper = title.toUpperCase();
  if (upper.includes('C1')) return 'C1';
  if (upper.includes('B2 (MỞ RỘNG)') || upper.includes('B2 EXTENDED') || (upper.includes('B2') && upper.includes('MỞ RỘNG'))) return 'B2 (Mở rộng)';
  if (upper.includes('B2')) return 'B2';
  if (upper.includes('B1')) return 'B1';
  if (upper.includes('A2')) return 'A2';
  if (upper.includes('A1')) return 'A1';
  return 'Oxford';
}

/**
 * 1. Fast Initial Page Fetch (< 15ms)
 * ONLY fetches Oxford sets metadata and total word counts.
 */
export async function getOxfordSetsSummary(targetUserId?: string): Promise<OxfordSummaryAnalytics> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let activeUserId = targetUserId || user?.id;

  if (!activeUserId) {
    const { data: topUserReview } = await supabase
      .from('card_reviews')
      .select('user_id')
      .order('created_at', { ascending: false })
      .limit(1);

    if (topUserReview && topUserReview.length > 0) {
      activeUserId = topUserReview[0].user_id;
    }
  }

  // 1. Fetch Oxford Sets
  const { data: sets, error: setsError } = await supabase
    .from('sets')
    .select('id, title, description, created_at, is_public, user_id')
    .or('title.ilike.%Oxford%,description.ilike.%Oxford%')
    .order('created_at', { ascending: true });

  if (setsError || !sets || sets.length === 0) {
    return {
      isLoggedIn: !!user,
      userId: activeUserId,
      totalOxfordSets: 0,
      totalOxfordWords: 0,
      sets: []
    };
  }

  const setIds = sets.map(s => s.id);

  // 2. Fetch lightweight card count mapping (only id, set_id)
  const { data: cardsMapping } = await supabase
    .from('cards')
    .select('id, set_id')
    .in('set_id', setIds);

  const cardList = cardsMapping || [];
  const setCardCountMap = new Map<string, number>();

  cardList.forEach(c => {
    setCardCountMap.set(c.set_id, (setCardCountMap.get(c.set_id) || 0) + 1);
  });

  let globalTotalWords = 0;

  const analyzedSets: OxfordSetSummary[] = sets.map(s => {
    const totalCards = setCardCountMap.get(s.id) || 0;
    globalTotalWords += totalCards;

    return {
      id: s.id,
      title: s.title,
      description: s.description || '',
      cefrLevel: extractCefrLevel(s.title),
      totalCards
    };
  });

  analyzedSets.sort((a, b) => {
    const orderA = LEVEL_ORDER[a.cefrLevel] || 99;
    const orderB = LEVEL_ORDER[b.cefrLevel] || 99;
    return orderA - orderB;
  });

  return {
    isLoggedIn: !!user,
    userId: activeUserId,
    totalOxfordSets: analyzedSets.length,
    totalOxfordWords: globalTotalWords,
    sets: analyzedSets
  };
}

/**
 * 2. On-Demand Fetch for Set Details & Card Review Table (< 150ms)
 * Triggered ONLY when user clicks to inspect a set card.
 */
export async function getSetDetailsAnalytics(setId: string, targetUserId?: string): Promise<OxfordSetAnalytics | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let activeUserId = targetUserId || user?.id;

  if (!activeUserId) {
    const { data: topUserReview } = await supabase
      .from('card_reviews')
      .select('user_id')
      .order('created_at', { ascending: false })
      .limit(1);

    if (topUserReview && topUserReview.length > 0) {
      activeUserId = topUserReview[0].user_id;
    }
  }

  // 1. Fetch Target Set Info
  const { data: setInfo, error: setError } = await supabase
    .from('sets')
    .select('id, title, description, created_at')
    .eq('id', setId)
    .single();

  if (setError || !setInfo) return null;

  // 2. Fetch Cards for this Set
  const { data: cards, error: cardsError } = await supabase
    .from('cards')
    .select('id, set_id, term, definition, phonetic, audio_url, part_of_speech, cefr_level')
    .eq('set_id', setId)
    .order('term', { ascending: true });

  if (cardsError || !cards) return null;

  const cardIds = cards.map(c => c.id);

  // 3. Fetch Reviews for active user for these card IDs (with fallback to all card reviews if activeUserId has no reviews for this set)
  // Use inner join on cards!inner(set_id) to avoid PostgREST Bad Request (URL too long) from passing 900+ card UUIDs in an .in() clause
  let reviewsMap = new Map<string, any>();
  if (cardIds.length > 0) {
    if (activeUserId) {
      const { data: userReviews } = await supabase
        .from('card_reviews')
        .select('*, cards!inner(set_id)')
        .eq('user_id', activeUserId)
        .eq('cards.set_id', setId);

      if (userReviews && userReviews.length > 0) {
        userReviews.forEach(r => reviewsMap.set(r.card_id, r));
      } else {
        // Fallback: If activeUserId has 0 reviews in this set, load any reviews for these cards
        const { data: allReviews } = await supabase
          .from('card_reviews')
          .select('*, cards!inner(set_id)')
          .eq('cards.set_id', setId);

        if (allReviews) {
          allReviews.forEach(r => reviewsMap.set(r.card_id, r));
        }
      }
    } else {
      const { data: allReviews } = await supabase
        .from('card_reviews')
        .select('*, cards!inner(set_id)')
        .eq('cards.set_id', setId);

      if (allReviews) {
        allReviews.forEach(r => reviewsMap.set(r.card_id, r));
      }
    }
  }

  // 4. Build Detailed Analytics
  let masteredCount = 0;
  let reviewingCount = 0;
  let learningCount = 0;
  let setTotalReviews = 0;
  let setCorrect = 0;
  let setIncorrect = 0;

  const setAllCardsStats: OxfordWordStats[] = [];
  const weakCardsInSet: OxfordWordStats[] = [];

  cards.forEach(c => {
    const review = reviewsMap.get(c.id);
    const masteryLevel: 'new' | 'learning' | 'reviewing' | 'mastered' = review?.mastery_level || 'new';
    const weaknessLevel: number = review?.weakness_level ?? 1;
    const totalRev = review?.total_reviews ?? 0;
    const correct = review?.correct_count ?? 0;
    const incorrect = review?.incorrect_count ?? 0;
    const accuracy = (correct + incorrect) > 0 ? Math.round((correct / (correct + incorrect)) * 100) : 0;
    const repetitions = review?.repetitions ?? 0;
    const intervalDays = review?.interval_days ?? 0;
    const nextReviewDate = review?.next_review_date || null;
    const modeStats = review?.mode_stats || undefined;

    if (masteryLevel === 'mastered') {
      masteredCount++;
    } else if (masteryLevel === 'reviewing') {
      reviewingCount++;
    } else if (masteryLevel === 'learning') {
      learningCount++;
    }

    setTotalReviews += totalRev;
    setCorrect += correct;
    setIncorrect += incorrect;

    const stats: OxfordWordStats = {
      id: c.id,
      setId: setInfo.id,
      setTitle: setInfo.title,
      term: c.term,
      definition: c.definition,
      phonetic: c.phonetic,
      audioUrl: c.audio_url,
      partOfSpeech: c.part_of_speech,
      cefrLevel: c.cefr_level || extractCefrLevel(setInfo.title),
      masteryLevel,
      weaknessLevel,
      totalReviews: totalRev,
      correctCount: correct,
      incorrectCount: incorrect,
      accuracy,
      repetitions,
      intervalDays,
      nextReviewDate,
      lastReviewedAt: review?.last_reviewed_at || null,
      modeStats
    };

    setAllCardsStats.push(stats);

    const isWeak = (weaknessLevel >= 2) || (incorrect > 0 && incorrect >= correct) || (review?.last_quality !== undefined && review.last_quality <= 2);
    if (isWeak && totalRev > 0) {
      weakCardsInSet.push(stats);
    }
  });

  const totalCards = cards.length;
  const unstudiedCount = Math.max(0, totalCards - (masteredCount + reviewingCount + learningCount));
  const masteryPercentage = totalCards > 0 ? Math.round((masteredCount / totalCards) * 100) : 0;
  const setAccuracy = (setCorrect + setIncorrect) > 0 ? Math.round((setCorrect / (setCorrect + setIncorrect)) * 100) : 0;

  // Sort default cards in set by totalReviews desc then term asc
  setAllCardsStats.sort((a, b) => (b.totalReviews - a.totalReviews) || a.term.localeCompare(b.term));
  weakCardsInSet.sort((a, b) => (b.weaknessLevel - a.weaknessLevel) || (b.incorrectCount - a.incorrectCount));

  return {
    id: setInfo.id,
    title: setInfo.title,
    description: setInfo.description || '',
    cefrLevel: extractCefrLevel(setInfo.title),
    totalCards,
    masteredCount,
    reviewingCount,
    learningCount,
    unstudiedCount,
    masteryPercentage,
    totalReviews: setTotalReviews,
    correctCount: setCorrect,
    incorrectCount: setIncorrect,
    accuracy: setAccuracy,
    weakCount: weakCardsInSet.length,
    allCards: setAllCardsStats,
    weakCards: weakCardsInSet
  };
}

// Backward compatibility wrapper
export async function getOxfordAnalytics(targetUserId?: string): Promise<any> {
  return getOxfordSetsSummary(targetUserId);
}
