'use server';

import { createClient } from '@/utils/supabase/server';
import { calculateSM2 } from '@/lib/sm2';

export async function recordCardReview(cardId: string, quality: number) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // 1. Fetch current review state for this card
    const { data: currentReview } = await supabase
      .from('card_reviews')
      .select('*')
      .eq('user_id', user.id)
      .eq('card_id', cardId)
      .maybeSingle();

    const prevEF = currentReview?.easiness_factor ?? 2.5;
    const prevRepetitions = currentReview?.repetitions ?? 0;
    const prevIntervalDays = currentReview?.interval_days ?? 0;
    const totalReviews = (currentReview?.total_reviews ?? 0) + 1;
    const correctCount = (currentReview?.correct_count ?? 0) + (quality >= 3 ? 1 : 0);
    const incorrectCount = (currentReview?.incorrect_count ?? 0) + (quality < 3 ? 1 : 0);

    // 2. Calculate new SM-2 state
    const sm2 = calculateSM2(quality, prevEF, prevRepetitions, prevIntervalDays);

    // 3. Upsert review record
    const todayStr = new Date().toISOString().split('T')[0];
    const { error: upsertError } = await supabase
      .from('card_reviews')
      .upsert({
        user_id: user.id,
        card_id: cardId,
        easiness_factor: sm2.easinessFactor,
        repetitions: sm2.repetitions,
        interval_days: sm2.intervalDays,
        next_review_date: sm2.nextReviewDate.toISOString().split('T')[0],
        total_reviews: totalReviews,
        correct_count: correctCount,
        incorrect_count: incorrectCount,
        last_quality: quality,
        mastery_level: sm2.masteryLevel,
        weakness_level: sm2.weaknessLevel,
        last_reviewed_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,card_id'
      });

    if (upsertError) {
      console.error('Error upserting card review:', upsertError);
      return { success: false, error: 'Database update failed' };
    }

    return { success: true, sm2 };
  } catch (error) {
    console.error('Error in recordCardReview:', error);
    return { success: false, error: 'Internal server error' };
  }
}

export async function recordBulkCardReviews(reviews: { cardId: string, quality: number }[]) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    if (!reviews || reviews.length === 0) {
      return { success: true, count: 0 };
    }

    const cardIds = reviews.map(r => r.cardId);

    // Fetch current review states for all cards in one go
    const { data: currentReviews, error: fetchError } = await supabase
      .from('card_reviews')
      .select('*')
      .eq('user_id', user.id)
      .in('card_id', cardIds);

    if (fetchError) {
      console.error('Error fetching bulk card reviews:', fetchError);
      return { success: false, error: 'Failed to fetch current states' };
    }

    const currentMap = new Map((currentReviews || []).map(r => [r.card_id, r]));
    const todayStr = new Date().toISOString().split('T')[0];
    const nowIso = new Date().toISOString();

    const upsertPayload = reviews.map(review => {
      const current = currentMap.get(review.cardId);
      
      const prevEF = current?.easiness_factor ?? 2.5;
      const prevRepetitions = current?.repetitions ?? 0;
      const prevIntervalDays = current?.interval_days ?? 0;
      const totalReviews = (current?.total_reviews ?? 0) + 1;
      const correctCount = (current?.correct_count ?? 0) + (review.quality >= 3 ? 1 : 0);
      const incorrectCount = (current?.incorrect_count ?? 0) + (review.quality < 3 ? 1 : 0);

      const sm2 = calculateSM2(review.quality, prevEF, prevRepetitions, prevIntervalDays);

      return {
        user_id: user.id,
        card_id: review.cardId,
        easiness_factor: sm2.easinessFactor,
        repetitions: sm2.repetitions,
        interval_days: sm2.intervalDays,
        next_review_date: sm2.nextReviewDate.toISOString().split('T')[0],
        total_reviews: totalReviews,
        correct_count: correctCount,
        incorrect_count: incorrectCount,
        last_quality: review.quality,
        mastery_level: sm2.masteryLevel,
        weakness_level: sm2.weaknessLevel,
        last_reviewed_at: nowIso
      };
    });

    const { error: upsertError } = await supabase
      .from('card_reviews')
      .upsert(upsertPayload, {
        onConflict: 'user_id,card_id'
      });

    if (upsertError) {
      console.error('Error in bulk upsert card reviews:', upsertError);
      return { success: false, error: 'Database update failed' };
    }

    return { success: true, count: upsertPayload.length };
  } catch (error) {
    console.error('Error in recordBulkCardReviews:', error);
    return { success: false, error: 'Internal server error' };
  }
}

export async function getStatusDashboard(targetUserId?: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const targetId = targetUserId || user?.id;
    if (!targetId) {
      return null;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Parallel fetch dashboard metrics
    const [
      reviewsResult,
      profileResult,
      streakResult,
      hardestResult,
      dueCountResult
    ] = await Promise.all([
      // A. Get count of cards by mastery level and overall stats
      supabase
        .from('card_reviews')
        .select('mastery_level, correct_count, incorrect_count, total_reviews, weakness_level')
        .eq('user_id', targetId),
        
      // B. User profile streak & points
      supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url, points, words_learned, current_rank, current_streak, highest_streak, last_active_date, created_at')
        .eq('id', targetId)
        .maybeSingle(),

      // C. Streak history from study_activity for heatmap (last 365 days)
      supabase
        .from('study_activity')
        .select('study_date, points_earned, words_learned')
        .eq('user_id', targetId)
        .order('study_date', { ascending: true }),

      // D. Top 10 hardest cards (lowest EF, must have been reviewed at least once)
      supabase
        .from('card_reviews')
        .select(`
          easiness_factor,
          correct_count,
          incorrect_count,
          total_reviews,
          mastery_level,
          card:cards (
            term,
            definition,
            phonetic
          )
        `)
        .eq('user_id', targetId)
        .gt('total_reviews', 0)
        .order('easiness_factor', { ascending: true })
        .limit(10),

      // E. Number of due cards (next_review_date <= today)
      supabase
        .from('card_reviews')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', targetId)
        .lte('next_review_date', todayStr)
    ]);

    // 1. Calculate mastery levels
    if (reviewsResult.error) {
      console.error('Error fetching card_reviews:', reviewsResult.error);
    }
    const reviews = reviewsResult.data || [];
    const masteryBreakdown = {
      new: 0,
      learning: 0,
      reviewing: 0,
      mastered: 0
    };
    
    const weaknessBreakdown = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0
    };
    
    let totalCorrect = 0;
    let totalReviewsCount = 0;

    reviews.forEach(r => {
      const level = r.mastery_level as keyof typeof masteryBreakdown;
      if (masteryBreakdown[level] !== undefined) {
        masteryBreakdown[level]++;
      }
      
      const wLevel = (r.weakness_level || 5) as keyof typeof weaknessBreakdown;
      if (weaknessBreakdown[wLevel] !== undefined) {
        weaknessBreakdown[wLevel]++;
      }

      totalCorrect += r.correct_count;
      totalReviewsCount += r.total_reviews;
    });

    const accuracyRate = totalReviewsCount > 0 
      ? Math.round((totalCorrect / totalReviewsCount) * 100) 
      : 0;

    // 2. Fetch all cards to see if there are cards that are not in card_reviews (which are "new")
    // Get sets created by user
    const { data: userSets } = await supabase
      .from('sets')
      .select('id')
      .eq('user_id', targetId);
      
    // Get sets learned by user
    const { data: learnedSets } = await supabase
      .from('user_learned_sets')
      .select('set_id')
      .eq('user_id', targetId);

    const setIds = new Set<string>();
    if (userSets) userSets.forEach(s => setIds.add(s.id));
    if (learnedSets) learnedSets.forEach(s => setIds.add(s.set_id));
    
    let totalUserCards = 0;
    if (setIds.size > 0) {
      const { count } = await supabase
        .from('cards')
        .select('id', { count: 'exact', head: true })
        .in('set_id', Array.from(setIds));
      totalUserCards = count || 0;
    }

    // Unreviewed cards count as "new" and "weakness level 5"
    const reviewedCardIds = new Set(reviews.map((r: any) => r.card_id));
    const unreviewedCount = Math.max(0, totalUserCards - reviewedCardIds.size);
    masteryBreakdown.new += unreviewedCount;
    weaknessBreakdown[5] += unreviewedCount;

    return {
      profile: profileResult.data,
      masteryBreakdown,
      weaknessBreakdown,
      accuracyRate,
      totalReviewedCards: reviews.length,
      dueCount: dueCountResult.count || 0,
      streakHistory: streakResult.data || [],
      hardestCards: (hardestResult.data || []).map((h: any) => ({
        easinessFactor: h.easiness_factor,
        correctCount: h.correct_count,
        incorrectCount: h.incorrect_count,
        totalReviews: h.total_reviews,
        masteryLevel: h.mastery_level,
        term: h.card?.term || 'Unknown',
        definition: h.card?.definition || 'Unknown',
        phonetic: h.card?.phonetic || ''
      })),
    };
  } catch (error) {
    console.error('Error in getStatusDashboard:', error);
    return null;
  }
}

export async function getUpcomingReviews(targetUserId?: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const targetId = targetUserId || user?.id;
    if (!targetId) return [];

    const today = new Date();
    const dates: string[] = [];
    
    // Generate dates for the next 7 days
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }

    // Query card reviews due in the next 7 days
    const { data } = await supabase
      .from('card_reviews')
      .select('next_review_date')
      .eq('user_id', targetId)
      .in('next_review_date', dates);

    const counts: Record<string, number> = {};
    dates.forEach(d => {
      counts[d] = 0;
    });

    if (data) {
      data.forEach(r => {
        if (counts[r.next_review_date] !== undefined) {
          counts[r.next_review_date]++;
        }
      });
    }

    return dates.map(d => ({
      date: d,
      count: counts[d]
    }));
  } catch (error) {
    console.error('Error in getUpcomingReviews:', error);
    return [];
  }
}

export async function getDueCardsToReview() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const todayStr = new Date().toISOString().split('T')[0];

    const { data } = await supabase
      .from('card_reviews')
      .select(`
        id,
        card_id,
        easiness_factor,
        repetitions,
        interval_days,
        next_review_date,
        card:cards (
          id,
          set_id,
          term,
          definition,
          phonetic
        )
      `)
      .eq('user_id', user.id)
      .lte('next_review_date', todayStr);

    if (!data) return [];
    
    // Format the response
    return data.map((r: any) => ({
      ...r,
      card: Array.isArray(r.card) ? r.card[0] : r.card
    })).filter((r: any) => r.card);
  } catch (error) {
    console.error('Error fetching due cards to review:', error);
    return [];
  }
}
