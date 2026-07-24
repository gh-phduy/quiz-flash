'use server';

import { createClient } from '@/utils/supabase/server';
import { calculateSM2, formatDateToYYYYMMDD, GameModeType } from '@/lib/sm2';
import { revalidatePath } from 'next/cache';

export async function recordCardReview(
  cardId: string, 
  quality: number, 
  mode?: GameModeType
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // 1. Fetch current review state for this card (by card_id OR by review id)
    const { data: currentReview } = await supabase
      .from('card_reviews')
      .select('*')
      .eq('user_id', user.id)
      .or(`card_id.eq.${cardId},id.eq.${cardId}`)
      .maybeSingle();

    const actualCardId = currentReview ? currentReview.card_id : cardId;

    if (!currentReview) {
      const { data: validCard } = await supabase
        .from('cards')
        .select('id')
        .eq('id', actualCardId)
        .maybeSingle();

      if (!validCard) {
        return {
          success: false,
          error: `Card ID '${cardId}' does not exist in cards table. Please use a valid card_id (e.g. 57cb6727-7512-494a-a5e7-53...)`
        };
      }
    }

    const prevEF = currentReview?.easiness_factor ?? 2.5;
    const prevRepetitions = currentReview?.repetitions ?? 0;
    const prevIntervalDays = currentReview?.interval_days ?? 0;
    const prevCorrectCount = currentReview?.correct_count ?? 0;
    const prevTotalReviews = currentReview?.total_reviews ?? 0;
    const prevStreakCorrect = currentReview?.streak_correct ?? 0;
    const prevStreakIncorrect = currentReview?.streak_incorrect ?? 0;
    const prevLastReviewedAt = currentReview?.last_reviewed_at ? new Date(currentReview.last_reviewed_at) : null;
    const prevModeStats = currentReview?.mode_stats ?? {};

    const totalReviews = prevTotalReviews + 1;
    const correctCount = prevCorrectCount + (quality >= 3 ? 1 : 0);
    const incorrectCount = (currentReview?.incorrect_count ?? 0) + (quality < 3 ? 1 : 0);
    const prevNextReviewDateStr = currentReview?.next_review_date ?? null;

    // 2. Calculate new SM-2 state with mastery_score & mode_stats
    const sm2 = calculateSM2(
      quality,
      prevEF,
      prevRepetitions,
      prevIntervalDays,
      prevCorrectCount,
      prevTotalReviews,
      prevStreakCorrect,
      prevStreakIncorrect,
      prevLastReviewedAt,
      prevModeStats,
      mode,
      false,
      prevNextReviewDateStr
    );

    let updatePayload: any = {
      easiness_factor: sm2.easinessFactor,
      repetitions: sm2.repetitions,
      interval_days: sm2.intervalDays,
      next_review_date: sm2.nextReviewDateStr,
      total_reviews: totalReviews,
      correct_count: correctCount,
      incorrect_count: incorrectCount,
      last_quality: quality,
      mastery_level: sm2.masteryLevel,
      weakness_level: sm2.weaknessLevel,
      mastery_score: sm2.masteryScore,
      streak_correct: sm2.streakCorrect,
      streak_incorrect: sm2.streakIncorrect,
      mode_stats: sm2.modeStats,
      last_reviewed_at: new Date().toISOString()
    };

    // 3. Update or Insert review record based on currentReview presence
    let resultError: any = null;
    let resultData: any = null;

    if (currentReview?.id) {
      const { data: updateData, error: updateErr } = await supabase
        .from('card_reviews')
        .update(updatePayload)
        .eq('id', currentReview.id)
        .select('*');

      console.log('recordCardReview UPDATE RESULT:', {
        userId: user.id,
        cardId,
        currentReviewId: currentReview.id,
        updateData,
        updateErr
      });

      resultError = updateErr;
      resultData = updateData;

      if (updateErr) {
        console.error('Update failed in recordCardReview, attempting safe fallback:', updateErr);
        const safePayload = {
          easiness_factor: sm2.easinessFactor,
          repetitions: sm2.repetitions,
          interval_days: sm2.intervalDays,
          next_review_date: sm2.nextReviewDateStr,
          last_reviewed_at: updatePayload.last_reviewed_at
        };
        const retry = await supabase
          .from('card_reviews')
          .update(safePayload)
          .eq('id', currentReview.id)
          .select('*');

        console.log('recordCardReview FALLBACK UPDATE RESULT:', retry);
        resultError = retry.error;
        resultData = retry.data;
      }
    } else {
      const { data: insertData, error: insertErr } = await supabase
        .from('card_reviews')
        .insert({
          user_id: user.id,
          card_id: actualCardId,
          ...updatePayload
        })
        .select('*');

      console.log('recordCardReview INSERT RESULT:', {
        userId: user.id,
        cardId: actualCardId,
        insertData,
        insertErr
      });

      resultError = insertErr;
      resultData = insertData;

      if (insertErr) {
        console.error('Insert failed in recordCardReview, attempting safe fallback:', insertErr);
        const safePayload = {
          user_id: user.id,
          card_id: actualCardId,
          easiness_factor: sm2.easinessFactor,
          repetitions: sm2.repetitions,
          interval_days: sm2.intervalDays,
          next_review_date: sm2.nextReviewDateStr,
          last_reviewed_at: updatePayload.last_reviewed_at
        };
        const retry = await supabase.from('card_reviews').insert(safePayload).select('*');
        console.log('recordCardReview FALLBACK INSERT RESULT:', retry);
        resultError = retry.error;
        resultData = retry.data;
      }
    }

    if (resultError) {
      return { success: false, error: resultError.message || JSON.stringify(resultError), sm2 };
    }

    return { success: true, data: resultData, sm2 };
  } catch (error: any) {
    console.error('Error in recordCardReview:', error);
    return { success: false, error: error.message || 'Internal server error' };
  }
}

export async function recordBulkCardReviews(
  reviews: { cardId: string; quality: number }[],
  mode?: GameModeType
) {
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
    const nowIso = new Date().toISOString();

    const upsertPayload = reviews.map(review => {
      const current = currentMap.get(review.cardId);
      
      const prevEF = current?.easiness_factor ?? 2.5;
      const prevRepetitions = current?.repetitions ?? 0;
      const prevIntervalDays = current?.interval_days ?? 0;
      const prevCorrectCount = current?.correct_count ?? 0;
      const prevTotalReviews = current?.total_reviews ?? 0;
      const prevStreakCorrect = current?.streak_correct ?? 0;
      const prevStreakIncorrect = current?.streak_incorrect ?? 0;
      const prevLastReviewedAt = current?.last_reviewed_at ? new Date(current.last_reviewed_at) : null;
      const prevModeStats = current?.mode_stats ?? {};
      const prevNextReviewDateStr = current?.next_review_date ?? null;

      const totalReviews = prevTotalReviews + 1;
      const correctCount = prevCorrectCount + (review.quality >= 3 ? 1 : 0);
      const incorrectCount = (current?.incorrect_count ?? 0) + (review.quality < 3 ? 1 : 0);

      const sm2 = calculateSM2(
        review.quality,
        prevEF,
        prevRepetitions,
        prevIntervalDays,
        prevCorrectCount,
        prevTotalReviews,
        prevStreakCorrect,
        prevStreakIncorrect,
        prevLastReviewedAt,
        prevModeStats,
        mode,
        false,
        prevNextReviewDateStr
      );

      return {
        user_id: user.id,
        card_id: review.cardId,
        easiness_factor: sm2.easinessFactor,
        repetitions: sm2.repetitions,
        interval_days: sm2.intervalDays,
        next_review_date: sm2.nextReviewDateStr,
        total_reviews: totalReviews,
        correct_count: correctCount,
        incorrect_count: incorrectCount,
        last_quality: review.quality,
        mastery_level: sm2.masteryLevel,
        weakness_level: sm2.weaknessLevel,
        mastery_score: sm2.masteryScore,
        streak_correct: sm2.streakCorrect,
        streak_incorrect: sm2.streakIncorrect,
        mode_stats: sm2.modeStats,
        last_reviewed_at: nowIso
      };
    });

    const updatePromises = upsertPayload.map(async (item) => {
      const current = currentMap.get(item.card_id);

      if (current?.id) {
        const { error: updateErr } = await supabase
          .from('card_reviews')
          .update(item)
          .eq('id', current.id);

        if (updateErr) {
          console.error('Bulk update failed for card_reviews id:', current.id, updateErr);
          const safeItem = {
            easiness_factor: item.easiness_factor,
            repetitions: item.repetitions,
            interval_days: item.interval_days,
            next_review_date: item.next_review_date,
            last_reviewed_at: item.last_reviewed_at
          };
          await supabase
            .from('card_reviews')
            .update(safeItem)
            .eq('id', current.id);
        }
      } else {
        const { error: insertErr } = await supabase
          .from('card_reviews')
          .insert(item);

        if (insertErr) {
          console.error('Bulk insert failed for card_id:', item.card_id, insertErr);
          const safeItem = {
            user_id: item.user_id,
            card_id: item.card_id,
            easiness_factor: item.easiness_factor,
            repetitions: item.repetitions,
            interval_days: item.interval_days,
            next_review_date: item.next_review_date,
            last_reviewed_at: item.last_reviewed_at
          };
          await supabase.from('card_reviews').insert(safeItem);
        }
      }
    });

    await Promise.all(updatePromises);

    // Sync words_learned count in profiles
    supabase
      .from('card_reviews')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .then(({ count }) => {
        if (count && count > 0) {
          supabase.from('profiles').update({ words_learned: count }).eq('id', user.id).then(() => {});
        }
      });

    // Purge Next.js router cache so home dashboard and status page re-fetch updated dueCount
    revalidatePath('/', 'layout');

    return { success: true, count: upsertPayload.length };
  } catch (error) {
    console.error('Error in recordBulkCardReviews:', error);
    return { success: false, error: 'Internal server error' };
  }
}

export async function resetUserProgress() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { error } = await supabase.rpc('reset_user_study_progress', {
      p_user_id: user.id
    });

    if (error) {
      console.error('Error resetting user progress:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in resetUserProgress:', error);
    return { success: false, error: error.message };
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
      dueCountResult,
      gameSessionsResult,
      dailyGoalResult
    ] = await Promise.all([
      // A. Get count of cards by mastery level and overall stats
      supabase
        .from('card_reviews')
        .select('mastery_level, correct_count, incorrect_count, total_reviews, weakness_level, mastery_score, mode_stats')
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

      // D. Top 10 hardest cards (lowest mastery_score)
      supabase
        .from('card_reviews')
        .select(`
          easiness_factor,
          mastery_score,
          correct_count,
          incorrect_count,
          total_reviews,
          mastery_level,
          card:cards (
            term,
            definition,
            phonetic,
            phonetic_uk,
            part_of_speech,
            cefr_level
          )
        `)
        .eq('user_id', targetId)
        .gt('total_reviews', 0)
        .order('mastery_score', { ascending: true })
        .limit(10),

      // E. Number of due cards (next_review_date <= today)
      supabase
        .from('card_reviews')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', targetId)
        .lte('next_review_date', todayStr),

      // F. Recent Game Sessions (last 20)
      supabase
        .from('game_sessions')
        .select('*')
        .eq('user_id', targetId)
        .order('created_at', { ascending: false })
        .limit(20),

      // G. Today's Daily Goal progress
      supabase
        .from('daily_goals')
        .select('*')
        .eq('user_id', targetId)
        .eq('goal_date', todayStr)
        .maybeSingle()
    ]);

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

    // Mode-specific accuracy breakdown across all cards
    const modePerformance: Record<string, { correct: number; total: number; accuracy: number }> = {
      flashcards: { correct: 0, total: 0, accuracy: 0 },
      listening: { correct: 0, total: 0, accuracy: 0 },
      speaking: { correct: 0, total: 0, accuracy: 0 },
      test: { correct: 0, total: 0, accuracy: 0 },
      match: { correct: 0, total: 0, accuracy: 0 },
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

      // Aggregate mode stats from card_reviews
      if (r.mode_stats && typeof r.mode_stats === 'object') {
        Object.entries(r.mode_stats).forEach(([modeKey, stats]: [string, any]) => {
          if (modePerformance[modeKey] && stats) {
            modePerformance[modeKey].correct += stats.correct || 0;
            modePerformance[modeKey].total += stats.total || 0;
          }
        });
      }
    });

    const gameSessions = gameSessionsResult.data || [];

    // Aggregate mode performance from game_sessions table
    gameSessions.forEach((session: any) => {
      const modeKey = session.mode?.toLowerCase();
      if (modePerformance[modeKey]) {
        const correct = session.correct_count || 0;
        const total = session.total_cards || (session.correct_count + session.incorrect_count) || 0;
        modePerformance[modeKey].correct += correct;
        modePerformance[modeKey].total += total;
      }
    });

    // Calculate accuracy percentages for modes
    Object.keys(modePerformance).forEach(modeKey => {
      const item = modePerformance[modeKey];
      item.accuracy = item.total > 0 ? Math.round((item.correct / item.total) * 100) : 0;
    });

    const accuracyRate = totalReviewsCount > 0 
      ? Math.round((totalCorrect / totalReviewsCount) * 100) 
      : 0;

    // Fetch total cards across sets
    const { data: userSets } = await supabase
      .from('sets')
      .select('id')
      .eq('user_id', targetId);
      
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

    const reviewedCardIds = new Set(reviews.map((r: any) => r.card_id));
    const unreviewedCount = Math.max(0, totalUserCards - reviewedCardIds.size);
    masteryBreakdown.new += unreviewedCount;
    weaknessBreakdown[5] += unreviewedCount;

    // Daily Goals Calculation & Fallbacks
    const goalDb = dailyGoalResult.data || {};
    const todayStartIso = new Date().toISOString().split('T')[0];

    let todaySessions = 0;
    let todayStudySecs = 0;
    let todayNewCards = 0;
    let todayReviewCards = 0;
    let todayTotalPlayed = 0;

    gameSessions.forEach((session: any) => {
      if (session.created_at && session.created_at.startsWith(todayStartIso)) {
        todaySessions++;
        todayStudySecs += session.duration_seconds || 0;
        todayTotalPlayed += session.total_cards || 0;
        todayNewCards += session.new_cards_count || 0;
        todayReviewCards += session.review_cards_count || 0;
      }
    });

    // Query real today card_reviews count
    const { count: realReviewedTodayCount } = await supabase
      .from('card_reviews')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', targetId)
      .gte('last_reviewed_at', todayStartIso);

    const { count: realNewTodayCount } = await supabase
      .from('card_reviews')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', targetId)
      .gte('created_at', todayStartIso);

    const actualReviewedCardsToday = realReviewedTodayCount || 0;
    const actualNewCardsToday = realNewTodayCount || 0;

    let finalActualNew = Math.max(goalDb.actual_new_words || 0, Math.max(todayNewCards, actualNewCardsToday));
    let finalActualReview = Math.max(goalDb.actual_review_words || 0, Math.max(todayReviewCards, Math.max(0, actualReviewedCardsToday - actualNewCardsToday)));

    const finalSessions = Math.max(goalDb.sessions_completed || 0, todaySessions);
    const finalStudySecs = Math.max(goalDb.total_study_seconds || 0, todayStudySecs);

    const totalReviewedCards = reviews.length;
    const effectiveWordsLearned = Math.max(profileResult.data?.words_learned || 0, totalReviewedCards);

    const profileData = profileResult.data ? {
      ...profileResult.data,
      words_learned: effectiveWordsLearned
    } : null;

    if (profileResult.data && profileResult.data.words_learned !== effectiveWordsLearned) {
      supabase
        .from('profiles')
        .update({ words_learned: effectiveWordsLearned })
        .eq('id', targetId)
        .then(() => {});
    }

    return {
      profile: profileData,
      masteryBreakdown,
      weaknessBreakdown,
      modePerformance,
      accuracyRate,
      totalReviewedCards,
      totalUserCards,
      dueCount: dueCountResult.count || 0,
      streakHistory: streakResult.data || [],
      recentSessions: gameSessions.slice(0, 20),
      dailyGoal: {
        target_new_words: goalDb.target_new_words || 167,
        target_review_words: goalDb.target_review_words || 100,
        actual_new_words: finalActualNew,
        actual_review_words: finalActualReview,
        sessions_completed: finalSessions,
        total_study_seconds: finalStudySecs
      },
      hardestCards: (hardestResult.data || []).map((h: any) => ({
        easinessFactor: h.easiness_factor,
        masteryScore: h.mastery_score ?? 0,
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
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }

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

    const todayStr = formatDateToYYYYMMDD(new Date());

    const { data } = await supabase
      .from('card_reviews')
      .select(`
        id,
        card_id,
        easiness_factor,
        repetitions,
        interval_days,
        next_review_date,
        mastery_score,
        card:cards (
          id,
          set_id,
          term,
          definition,
          phonetic,
          phonetic_uk,
          part_of_speech,
          cefr_level
        )
      `)
      .eq('user_id', user.id)
      .lte('next_review_date', todayStr);

    if (!data) return [];
    
    return data.map((r: any) => ({
      ...r,
      card: Array.isArray(r.card) ? r.card[0] : r.card
    })).filter((r: any) => r.card);
  } catch (error) {
    console.error('Error fetching due cards to review:', error);
    return [];
  }
}

export async function testReviewSingleCard(targetCardId?: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    let cardIdToReview = targetCardId?.trim();

    if (!cardIdToReview) {
      const todayStr = formatDateToYYYYMMDD(new Date());
      const { data: dueCards } = await supabase
        .from('card_reviews')
        .select('card_id')
        .eq('user_id', user.id)
        .lte('next_review_date', todayStr)
        .limit(1);

      if (dueCards && dueCards.length > 0) {
        cardIdToReview = dueCards[0].card_id;
      }
    }

    if (!cardIdToReview) {
      return { success: false, error: 'No due card found to test review' };
    }

    const res = await recordCardReview(cardIdToReview, 4, 'test');
    
    if (!res.success) {
      return { success: false, error: res.error || 'Failed to update card review' };
    }

    revalidatePath('/');
    revalidatePath('/review');

    return {
      success: true,
      cardId: cardIdToReview,
      nextReviewDate: res.sm2?.nextReviewDateStr,
      message: `Updated card ${cardIdToReview} to review date: ${res.sm2?.nextReviewDateStr}`
    };
  } catch (err: any) {
    console.error('Error in testReviewSingleCard:', err);
    return { success: false, error: err.message || 'Server error' };
  }
}

export async function testUpdateRepetitionsToTwo() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const cardId = '57cb6727-7512-494a-a5e7-539918b3da0b';

    // 1. Fetch current review state for this card
    const { data: currentReview } = await supabase
      .from('card_reviews')
      .select('*')
      .eq('user_id', user.id)
      .eq('card_id', cardId)
      .maybeSingle();

    if (!currentReview) {
      return {
        success: false,
        error: `Bản ghi của thẻ trong card_reviews không tìm thấy! Hãy ôn tập thẻ này trước để hệ thống khởi tạo hàng trong DB.`
      };
    }

    // 2. Tính toán ngày ôn tiếp theo (hôm nay + 6 ngày theo SM-2 khi repetitions = 2)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 6);
    const nextReviewDateStr = formatDateToYYYYMMDD(futureDate);

    // 3. Thực hiện UPDATE
    const { data: updatedRows, error: updateErr } = await supabase
      .from('card_reviews')
      .update({
        repetitions: 2,
        interval_days: 6,
        next_review_date: nextReviewDateStr,
        last_reviewed_at: new Date().toISOString()
      })
      .eq('id', currentReview.id)
      .select('*');

    console.log('testUpdateRepetitionsToTwo UPDATE RESULT:', { updatedRows, updateErr });

    if (updateErr) {
      return { success: false, error: `Supabase Error: ${updateErr.message} (Code: ${updateErr.code})` };
    }

    if (!updatedRows || updatedRows.length === 0) {
      // Return full debug info to the UI
      return { 
        success: false, 
        error: `Không có dòng nào được cập nhật. Debug: user_id=${user.id}, review_id=${currentReview.id}, updatedRows=${JSON.stringify(updatedRows)}, updateErr=${JSON.stringify(updateErr)}` 
      };
    }

    const finalRepetitions = updatedRows[0].repetitions;

    if (finalRepetitions === 2) {
      revalidatePath('/');
      return {
        success: true,
        message: `Thành công! Repetitions của thẻ đã tăng lên 2. (next_review_date: ${nextReviewDateStr})`
      };
    } else {
      return {
        success: false,
        error: `Lỗi: Giá trị repetitions trong DB là ${finalRepetitions}, không phải 2.`
      };
    }
  } catch (err: any) {
    console.error('Error in testUpdateRepetitionsToTwo:', err);
    return { success: false, error: err.message || 'Server error' };
  }
}


