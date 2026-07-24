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

export interface OxfordSetAnalytics {
  id: string;
  title: string;
  description: string;
  cefrLevel: string; // 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'General'
  totalCards: number;
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

export interface OxfordOverallAnalytics {
  isLoggedIn: boolean;
  userId?: string;
  userName?: string;
  userEmail?: string;
  totalOxfordSets: number;
  totalOxfordWords: number;
  totalMasteredWords: number;
  totalReviewingWords: number;
  totalLearningWords: number;
  totalUnstudiedWords: number;
  overallMasteryPercentage: number;
  totalReviews: number;
  totalCorrect: number;
  totalIncorrect: number;
  overallAccuracy: number;
  sets: OxfordSetAnalytics[];
  topWeakCards: OxfordWordStats[];
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

export async function getOxfordAnalytics(targetUserId?: string): Promise<OxfordOverallAnalytics> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let activeUserId = targetUserId || user?.id;
  let activeProfile: { full_name?: string; email?: string } | null = null;

  // 1. If activeUserId is missing, find the most active user in card_reviews
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

  // Fetch profile for display info
  if (activeUserId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', activeUserId)
      .maybeSingle();

    if (profile) {
      activeProfile = profile;
    }
  }

  // 2. Fetch all Oxford sets
  const { data: sets, error: setsError } = await supabase
    .from('sets')
    .select('id, title, description, created_at, is_public, user_id')
    .or('title.ilike.%Oxford%,description.ilike.%Oxford%')
    .order('created_at', { ascending: true });

  if (setsError || !sets || sets.length === 0) {
    return {
      isLoggedIn: !!user,
      userId: activeUserId,
      userName: activeProfile?.full_name || undefined,
      userEmail: activeProfile?.email || undefined,
      totalOxfordSets: 0,
      totalOxfordWords: 0,
      totalMasteredWords: 0,
      totalReviewingWords: 0,
      totalLearningWords: 0,
      totalUnstudiedWords: 0,
      overallMasteryPercentage: 0,
      totalReviews: 0,
      totalCorrect: 0,
      totalIncorrect: 0,
      overallAccuracy: 0,
      sets: [],
      topWeakCards: []
    };
  }

  const setIds = sets.map(s => s.id);

  // 3. Fetch cards for these Oxford sets (with pagination to bypass 1000 row limit)
  let allCards = [];
  let start = 0;
  const PAGE_SIZE = 1000;
  
  while (true) {
    const { data: cards, error: cardsError } = await supabase
      .from('cards')
      .select('id, set_id, term, definition, phonetic, audio_url, part_of_speech, cefr_level')
      .in('set_id', setIds)
      .range(start, start + PAGE_SIZE - 1);
      
    if (cardsError) {
      console.error('Error fetching cards chunk:', cardsError);
      break;
    }
    
    if (!cards || cards.length === 0) break;
    
    allCards.push(...cards);
    
    if (cards.length < PAGE_SIZE) break;
    start += PAGE_SIZE;
  }

  const cardList = allCards;
  const cardIds = cardList.map(c => c.id);

  // 4. Fetch card_reviews (by activeUserId if present, or all public card_reviews if activeUserId has none)
  let reviewsMap = new Map<string, any>();
  if (cardIds.length > 0) {
    const chunkSize = 100;
    for (let i = 0; i < cardIds.length; i += chunkSize) {
      const chunk = cardIds.slice(i, i + chunkSize);
      
      let query = supabase.from('card_reviews').select('*').in('card_id', chunk);
      if (activeUserId) {
        query = query.eq('user_id', activeUserId);
      }

      const { data: reviews, error } = await query;
      
      if (error) {
        console.error('Error fetching reviews chunk:', error);
      }

      if (reviews && reviews.length > 0) {
        reviews.forEach(r => reviewsMap.set(r.card_id, r));
      } 
    }
  }

  // 5. Map cards to sets and calculate analytics per set
  const cardsBySet = new Map<string, typeof cardList>();
  cardList.forEach(c => {
    const list = cardsBySet.get(c.set_id) || [];
    list.push(c);
    cardsBySet.set(c.set_id, list);
  });

  let globalTotalWords = 0;
  let globalMastered = 0;
  let globalReviewing = 0;
  let globalLearning = 0;
  let globalUnstudied = 0;
  let globalTotalReviews = 0;
  let globalCorrect = 0;
  let globalIncorrect = 0;
  const allWeakCards: OxfordWordStats[] = [];

  const analyzedSets: OxfordSetAnalytics[] = sets.map(s => {
    const setCards = cardsBySet.get(s.id) || [];
    const totalCards = setCards.length;
    
    let masteredCount = 0;
    let reviewingCount = 0;
    let learningCount = 0;
    let setTotalReviews = 0;
    let setCorrect = 0;
    let setIncorrect = 0;
    const setAllCardsStats: OxfordWordStats[] = [];
    const weakCardsInSet: OxfordWordStats[] = [];

    setCards.forEach(c => {
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
        setId: s.id,
        setTitle: s.title,
        term: c.term,
        definition: c.definition,
        phonetic: c.phonetic,
        audioUrl: c.audio_url,
        partOfSpeech: c.part_of_speech,
        cefrLevel: c.cefr_level || extractCefrLevel(s.title),
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
        allWeakCards.push(stats);
      }
    });

    const unstudiedCount = Math.max(0, totalCards - (masteredCount + reviewingCount + learningCount));
    const masteryPercentage = totalCards > 0 ? Math.round((masteredCount / totalCards) * 100) : 0;
    const setAccuracy = (setCorrect + setIncorrect) > 0 ? Math.round((setCorrect / (setCorrect + setIncorrect)) * 100) : 0;

    globalTotalWords += totalCards;
    globalMastered += masteredCount;
    globalReviewing += reviewingCount;
    globalLearning += learningCount;
    globalUnstudied += unstudiedCount;
    globalTotalReviews += setTotalReviews;
    globalCorrect += setCorrect;
    globalIncorrect += setIncorrect;

    // Sort set all cards: reviewed first (by totalReviews desc), then by term asc
    setAllCardsStats.sort((a, b) => (b.totalReviews - a.totalReviews) || a.term.localeCompare(b.term));

    // Sort weak cards by weaknessLevel desc then incorrectCount desc
    weakCardsInSet.sort((a, b) => (b.weaknessLevel - a.weaknessLevel) || (b.incorrectCount - a.incorrectCount));

    return {
      id: s.id,
      title: s.title,
      description: s.description || '',
      cefrLevel: extractCefrLevel(s.title),
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
  });

  // Sort sets by CEFR level order A1 -> C1
  analyzedSets.sort((a, b) => {
    const orderA = LEVEL_ORDER[a.cefrLevel] || 99;
    const orderB = LEVEL_ORDER[b.cefrLevel] || 99;
    return orderA - orderB;
  });

  // Sort top global weak cards
  allWeakCards.sort((a, b) => (b.weaknessLevel - a.weaknessLevel) || (b.incorrectCount - a.incorrectCount));

  const overallMasteryPercentage = globalTotalWords > 0 ? Math.round((globalMastered / globalTotalWords) * 100) : 0;
  const overallAccuracy = (globalCorrect + globalIncorrect) > 0 ? Math.round((globalCorrect / (globalCorrect + globalIncorrect)) * 100) : 0;

  return {
    isLoggedIn: !!user,
    userId: activeUserId,
    userName: activeProfile?.full_name || undefined,
    userEmail: activeProfile?.email || undefined,
    totalOxfordSets: analyzedSets.length,
    totalOxfordWords: globalTotalWords,
    totalMasteredWords: globalMastered,
    totalReviewingWords: globalReviewing,
    totalLearningWords: globalLearning,
    totalUnstudiedWords: globalUnstudied,
    overallMasteryPercentage,
    totalReviews: globalTotalReviews,
    totalCorrect: globalCorrect,
    totalIncorrect: globalIncorrect,
    overallAccuracy,
    sets: analyzedSets,
    topWeakCards: allWeakCards.slice(0, 50) // top 50 weak cards
  };
}
