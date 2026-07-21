-- Tối ưu hóa Database: Sử dụng Stored Procedures (RPC) để gộp các truy vấn
-- Hàm này thay thế cho việc gọi 6 lần từ Next.js Server Actions trong `recordStudyActivity`

CREATE OR REPLACE FUNCTION public.record_study_activity(
  p_user_id UUID,
  p_set_id UUID,
  p_points_to_add INT,
  p_words_in_set INT,
  p_mode TEXT
) RETURNS json AS $$
DECLARE
  v_learned_exists BOOLEAN;
  v_words_to_add INT := 0;
  v_profile RECORD;
  v_current_points INT;
  v_current_words INT;
  v_new_rank TEXT;
  v_today DATE := current_date;
  v_yesterday DATE := current_date - 1;
  v_current_streak INT;
  v_highest_streak INT;
  v_activity RECORD;
  v_is_new_set BOOLEAN;
BEGIN
  -- 1. Check if user has already learned this set before
  SELECT EXISTS(
    SELECT 1 FROM public.user_learned_sets WHERE user_id = p_user_id AND set_id = p_set_id
  ) INTO v_learned_exists;

  v_is_new_set := NOT v_learned_exists;

  IF v_is_new_set AND p_mode = 'learn' THEN
    v_words_to_add := p_words_in_set;
    INSERT INTO public.user_learned_sets(user_id, set_id) VALUES (p_user_id, p_set_id);
  END IF;

  -- 2. Get profile and lock for update
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  
  v_current_points := COALESCE(v_profile.points, 0) + p_points_to_add;
  v_current_words := COALESCE(v_profile.words_learned, 0) + v_words_to_add;
  
  -- Calculate rank
  IF v_current_points < 500 THEN v_new_rank := 'Iron';
  ELSIF v_current_points < 1200 THEN v_new_rank := 'Bronze';
  ELSIF v_current_points < 2500 THEN v_new_rank := 'Silver';
  ELSIF v_current_points < 5000 THEN v_new_rank := 'Gold';
  ELSIF v_current_points < 10000 THEN v_new_rank := 'Platinum';
  ELSIF v_current_points < 15000 THEN v_new_rank := 'Emerald';
  ELSIF v_current_points < 25000 THEN v_new_rank := 'Diamond';
  ELSIF v_current_points < 50000 THEN v_new_rank := 'Master';
  ELSIF v_current_points < 100000 THEN v_new_rank := 'Grandmaster';
  ELSE v_new_rank := 'Challenger';
  END IF;

  v_current_streak := COALESCE(v_profile.current_streak, 0);
  v_highest_streak := COALESCE(v_profile.highest_streak, 0);

  IF v_profile.last_active_date IS NULL OR v_profile.last_active_date::DATE <> v_today THEN
    IF v_profile.last_active_date::DATE = v_yesterday THEN
      v_current_streak := v_current_streak + 1;
    ELSE
      v_current_streak := 1;
    END IF;
    IF v_current_streak > v_highest_streak THEN
      v_highest_streak := v_current_streak;
    END IF;
  END IF;

  UPDATE public.profiles SET
    points = v_current_points,
    words_learned = v_current_words,
    current_rank = v_new_rank,
    current_streak = v_current_streak,
    highest_streak = v_highest_streak,
    last_active_date = v_today::timestamp
  WHERE id = p_user_id;

  -- 3. Update today's study activity
  SELECT * INTO v_activity FROM public.study_activity WHERE user_id = p_user_id AND study_date = v_today;

  IF FOUND THEN
    UPDATE public.study_activity SET
      points_earned = points_earned + p_points_to_add,
      words_learned = words_learned + v_words_to_add
    WHERE id = v_activity.id;
  ELSE
    INSERT INTO public.study_activity(user_id, study_date, points_earned, words_learned)
    VALUES (p_user_id, v_today, p_points_to_add, v_words_to_add);
  END IF;

  RETURN json_build_object(
    'success', true,
    'newRank', v_new_rank,
    'newPoints', v_current_points,
    'wordsLearnedAdded', v_words_to_add,
    'isNewSet', v_is_new_set,
    'currentStreak', v_current_streak
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
