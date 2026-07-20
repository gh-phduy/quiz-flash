'use server';

import { createClient } from '@/utils/supabase/server';

const calculateRank = (points: number): string => {
  if (points < 500) return 'Iron';
  if (points < 1200) return 'Bronze';
  if (points < 2500) return 'Silver';
  if (points < 5000) return 'Gold';
  if (points < 10000) return 'Platinum';
  if (points < 15000) return 'Emerald';
  if (points < 25000) return 'Diamond';
  if (points < 50000) return 'Master';
  if (points < 100000) return 'Grandmaster';
  return 'Challenger';
};

export async function recordStudyActivity(setId: string, pointsToAdd: number, wordsInSet: number = 0) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // 1. Check if user has already learned this set before
    const { data: learnedSet } = await supabase
      .from('user_learned_sets')
      .select('id')
      .eq('user_id', user.id)
      .eq('set_id', setId)
      .maybeSingle();

    const isNewSet = !learnedSet;
    const wordsToAdd = isNewSet ? wordsInSet : 0;

    if (isNewSet) {
      // Mark as learned/mastered
      await supabase
        .from('user_learned_sets')
        .insert({
          user_id: user.id,
          set_id: setId
        });
    }

    // 2. Get current profile to update points and rank
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('points, words_learned, current_streak, highest_streak, last_active_date')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching profile:', profileError);
    }

    const currentPoints = (profile?.points || 0) + pointsToAdd;
    const currentWords = (profile?.words_learned || 0) + wordsToAdd;
    const newRank = calculateRank(currentPoints);

    // Tính toán Streak (chuỗi ngày học)
    const today = new Date().toISOString().split('T')[0];
    let currentStreak = profile?.current_streak || 0;
    let highestStreak = profile?.highest_streak || 0;

    if (profile?.last_active_date !== today) {
      // Nếu hôm qua có học -> tăng chuỗi, nếu không -> reset về 1
      const yesterdayDate = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (profile?.last_active_date === yesterdayDate) {
        currentStreak += 1;
      } else {
        currentStreak = 1; // Học ngày đầu tiên sau một khoảng nghỉ
      }
      
      if (currentStreak > highestStreak) {
        highestStreak = currentStreak;
      }
    }

    // Update profile
    await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        points: currentPoints,
        words_learned: currentWords,
        current_rank: newRank,
        current_streak: currentStreak,
        highest_streak: highestStreak,
        last_active_date: today,
      });

    // 3. Update today's study activity
    
    // Check if record exists for today
    const { data: activity } = await supabase
      .from('study_activity')
      .select('*')
      .eq('user_id', user.id)
      .eq('study_date', today)
      .single();

    if (activity) {
      // Update
      await supabase
        .from('study_activity')
        .update({
          points_earned: activity.points_earned + pointsToAdd,
          words_learned: activity.words_learned + wordsToAdd,
        })
        .eq('id', activity.id);
    } else {
      // Insert
      await supabase
        .from('study_activity')
        .insert({
          user_id: user.id,
          study_date: today,
          points_earned: pointsToAdd,
          words_learned: wordsToAdd,
        });
    }

    return { success: true, newRank, newPoints: currentPoints, wordsLearnedAdded: wordsToAdd, isNewSet };
  } catch (error) {
    console.error('Error recording study activity:', error);
    return { success: false, error: 'Internal server error' };
  }
}
