'use server';

import { createClient } from '@/utils/supabase/server';
import { GameModeType } from '@/lib/sm2';

export async function generateGameSession(setId: string, totalCardsToLearn: number = 20) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Try calling new Smart Waterfall RPC first
    const { data: cards, error: rpcError } = await supabase.rpc('get_smart_waterfall_cards', {
      p_set_id: setId,
      p_user_id: user.id,
      p_total_limit: totalCardsToLearn
    });

    if (!rpcError && cards && cards.length > 0) {
      return { success: true, cards };
    }

    // Fallback: If RPC error or 0 cards returned (e.g. migration not run yet), fetch directly from cards table
    const { data: fallbackCards, error: fetchError } = await supabase
      .from('cards')
      .select('*')
      .eq('set_id', setId)
      .limit(totalCardsToLearn);

    if (fetchError) {
      return { success: false, error: fetchError.message };
    }

    const shuffled = (fallbackCards || []).sort(() => 0.5 - Math.random());
    return { success: true, cards: shuffled };

  } catch (error: any) {
    console.error('Failed to generate game session:', error);
    return { success: false, error: error.message };
  }
}

export async function checkNewCardsForSession(cardIds: string[]) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !cardIds || cardIds.length === 0) return [];

    const { data: reviews } = await supabase
      .from('card_reviews')
      .select('card_id')
      .eq('user_id', user.id)
      .in('card_id', cardIds);

    const reviewedSet = new Set((reviews || []).map(r => r.card_id));
    const newCardIds = cardIds.filter(id => !reviewedSet.has(id));

    if (newCardIds.length === 0) return [];

    const { data: newCards } = await supabase
      .from('cards')
      .select('*')
      .in('id', newCardIds);

    return newCards || [];
  } catch (error) {
    console.error('Error checking new cards for session:', error);
    return [];
  }
}

export async function updateGameScores(correctCardIds: string[], incorrectCardIds: string[] = []) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    if (correctCardIds.length === 0 && incorrectCardIds.length === 0) {
      return { success: true };
    }

    const { error } = await supabase.rpc('update_game_scores', {
      p_user_id: user.id,
      p_correct_card_ids: correctCardIds,
      p_incorrect_card_ids: incorrectCardIds
    });

    if (error) {
      console.error('Failed to update game scores:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Failed to update game scores (exception):', error);
    return { success: false, error: error.message };
  }
}

export async function logGameSession(params: {
  setId: string;
  mode: GameModeType;
  totalCards: number;
  correctCount: number;
  incorrectCount: number;
  durationSeconds?: number;
  newCardsCount?: number;
  reviewCardsCount?: number;
  pointsEarned?: number;
}) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    const accuracyPercent = params.totalCards > 0 
      ? Math.round((params.correctCount / params.totalCards) * 100)
      : 0;

    // 1. Insert into game_sessions table
    const { error: sessionError } = await supabase
      .from('game_sessions')
      .insert({
        user_id: user.id,
        set_id: params.setId,
        mode: params.mode,
        total_cards: params.totalCards,
        correct_count: params.correctCount,
        incorrect_count: params.incorrectCount,
        accuracy_percent: accuracyPercent,
        duration_seconds: params.durationSeconds || 0,
        new_cards_count: params.newCardsCount || 0,
        review_cards_count: params.reviewCardsCount || 0,
        points_earned: params.pointsEarned || 0
      });

    if (sessionError) {
      console.error('Failed to log game session:', sessionError);
    }

    // 2. Upsert into daily_goals table for today
    const todayStr = new Date().toISOString().split('T')[0];
    
    const { data: existingGoal } = await supabase
      .from('daily_goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('goal_date', todayStr)
      .maybeSingle();

    let incNew = params.newCardsCount || 0;
    let incReview = params.reviewCardsCount || 0;

    if (incNew === 0 && incReview === 0 && params.totalCards > 0) {
      const todayISO = new Date().toISOString().split('T')[0];
      const { count: newCount } = await supabase
        .from('card_reviews')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', todayISO);

      incNew = Math.min(params.totalCards, newCount || 0);
      incReview = Math.max(0, params.totalCards - incNew);
      if (incNew === 0 && incReview === 0) {
        incReview = params.totalCards;
      }
    }

    const actualNew = (existingGoal?.actual_new_words || 0) + incNew;
    const actualReview = (existingGoal?.actual_review_words || 0) + incReview;
    const sessionsComp = (existingGoal?.sessions_completed || 0) + 1;
    const studySecs = (existingGoal?.total_study_seconds || 0) + (params.durationSeconds || 0);

    const { error: goalError } = await supabase
      .from('daily_goals')
      .upsert({
        user_id: user.id,
        goal_date: todayStr,
        target_new_words: 167,
        target_review_words: 100,
        actual_new_words: actualNew,
        actual_review_words: actualReview,
        sessions_completed: sessionsComp,
        total_study_seconds: studySecs
      }, {
        onConflict: 'user_id,goal_date'
      });

    if (goalError) {
      console.error('Failed to update daily goals:', goalError);
    }

    return { success: true };

  } catch (error: any) {
    console.error('Exception in logGameSession:', error);
    return { success: false, error: error.message };
  }
}
