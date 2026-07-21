-- =========================================================================
-- MIGRATION: Smart Spaced Repetition v2 & High-Intensity Learning System
-- =========================================================================

-- 1. Nâng cấp bảng card_reviews
ALTER TABLE public.card_reviews
ADD COLUMN IF NOT EXISTS mastery_score INT DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS streak_correct INT DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS streak_incorrect INT DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS mode_stats JSONB DEFAULT '{
  "flashcards": {"correct": 0, "total": 0},
  "listening":  {"correct": 0, "total": 0},
  "speaking":   {"correct": 0, "total": 0},
  "test":       {"correct": 0, "total": 0},
  "match":      {"correct": 0, "total": 0}
}'::jsonb NOT NULL;

-- Create index on mastery_score for fast waterfall queries
CREATE INDEX IF NOT EXISTS idx_card_reviews_mastery_score ON public.card_reviews(mastery_score);

-- 2. Tạo bảng game_sessions (Lịch sử các phiên học)
CREATE TABLE IF NOT EXISTS public.game_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    set_id UUID REFERENCES public.sets(id) ON DELETE CASCADE NOT NULL,
    mode TEXT NOT NULL,
    total_cards INT NOT NULL,
    correct_count INT DEFAULT 0 NOT NULL,
    incorrect_count INT DEFAULT 0 NOT NULL,
    accuracy_percent FLOAT DEFAULT 0,
    duration_seconds INT DEFAULT 0,
    new_cards_count INT DEFAULT 0,
    review_cards_count INT DEFAULT 0,
    points_earned INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for game_sessions
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own game sessions" ON public.game_sessions
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own game sessions" ON public.game_sessions
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 3. Tạo bảng daily_goals (Mục tiêu học tập hàng ngày)
CREATE TABLE IF NOT EXISTS public.daily_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    goal_date DATE NOT NULL,
    target_new_words INT DEFAULT 167 NOT NULL,
    target_review_words INT DEFAULT 100 NOT NULL,
    actual_new_words INT DEFAULT 0 NOT NULL,
    actual_review_words INT DEFAULT 0 NOT NULL,
    sessions_completed INT DEFAULT 0 NOT NULL,
    total_study_seconds INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, goal_date)
);

-- Enable RLS for daily_goals
ALTER TABLE public.daily_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own daily goals" ON public.daily_goals
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily goals" ON public.daily_goals
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily goals" ON public.daily_goals
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- 4. RPC: Smart Waterfall Card Selector (30% NEW, 35% WEAK, 20% DUE, 10% MEDIUM, 5% STRONG)
CREATE OR REPLACE FUNCTION get_smart_waterfall_cards(
  p_set_id UUID,
  p_user_id UUID,
  p_total_limit INT DEFAULT 20
)
RETURNS SETOF public.cards AS $$
DECLARE
  v_new_target INT;
  v_weak_target INT;
  v_due_target INT;
  v_medium_target INT;
  v_strong_target INT;
  v_selected_ids UUID[] := '{}';
  v_rollover INT := 0;
  v_cur_limit INT;
  v_rec RECORD;
BEGIN
  -- Target allocation: 30% new, 35% weak, 20% due, 10% medium, 5% strong
  v_new_target    := FLOOR(p_total_limit * 0.30);
  v_weak_target   := FLOOR(p_total_limit * 0.35);
  v_due_target    := FLOOR(p_total_limit * 0.20);
  v_medium_target := FLOOR(p_total_limit * 0.10);
  v_strong_target := p_total_limit - (v_new_target + v_weak_target + v_due_target + v_medium_target);

  -- 1. POOL NEW (cards not yet reviewed by this user)
  v_cur_limit := v_new_target + v_rollover;
  FOR v_rec IN 
    SELECT c.id FROM public.cards c
    LEFT JOIN public.card_reviews cr ON c.id = cr.card_id AND cr.user_id = p_user_id
    WHERE c.set_id = p_set_id AND cr.id IS NULL
    ORDER BY random()
    LIMIT v_cur_limit
  LOOP
    v_selected_ids := array_append(v_selected_ids, v_rec.id);
  END LOOP;
  v_rollover := v_cur_limit - COALESCE(array_length(v_selected_ids, 1), 0);

  -- 2. POOL WEAK (mastery_score 1-40)
  v_cur_limit := v_weak_target + GREATEST(v_rollover, 0);
  FOR v_rec IN 
    SELECT c.id FROM public.cards c
    JOIN public.card_reviews cr ON c.id = cr.card_id AND cr.user_id = p_user_id
    WHERE c.set_id = p_set_id 
      AND NOT (c.id = ANY(v_selected_ids))
      AND cr.mastery_score BETWEEN 1 AND 40
    ORDER BY cr.mastery_score ASC, cr.last_reviewed_at ASC NULLS FIRST, random()
    LIMIT v_cur_limit
  LOOP
    v_selected_ids := array_append(v_selected_ids, v_rec.id);
  END LOOP;
  v_rollover := (v_new_target + v_weak_target) - COALESCE(array_length(v_selected_ids, 1), 0);

  -- 3. POOL DUE (next_review_date <= current_date)
  v_cur_limit := v_due_target + GREATEST(v_rollover, 0);
  FOR v_rec IN 
    SELECT c.id FROM public.cards c
    JOIN public.card_reviews cr ON c.id = cr.card_id AND cr.user_id = p_user_id
    WHERE c.set_id = p_set_id 
      AND NOT (c.id = ANY(v_selected_ids))
      AND cr.next_review_date <= CURRENT_DATE
    ORDER BY cr.next_review_date ASC, random()
    LIMIT v_cur_limit
  LOOP
    v_selected_ids := array_append(v_selected_ids, v_rec.id);
  END LOOP;
  v_rollover := (v_new_target + v_weak_target + v_due_target) - COALESCE(array_length(v_selected_ids, 1), 0);

  -- 4. POOL MEDIUM (mastery_score 41-70)
  v_cur_limit := v_medium_target + GREATEST(v_rollover, 0);
  FOR v_rec IN 
    SELECT c.id FROM public.cards c
    JOIN public.card_reviews cr ON c.id = cr.card_id AND cr.user_id = p_user_id
    WHERE c.set_id = p_set_id 
      AND NOT (c.id = ANY(v_selected_ids))
      AND cr.mastery_score BETWEEN 41 AND 70
    ORDER BY cr.mastery_score ASC, random()
    LIMIT v_cur_limit
  LOOP
    v_selected_ids := array_append(v_selected_ids, v_rec.id);
  END LOOP;
  v_rollover := (v_new_target + v_weak_target + v_due_target + v_medium_target) - COALESCE(array_length(v_selected_ids, 1), 0);

  -- 5. POOL STRONG / REMAINING (any remaining cards in set)
  v_cur_limit := p_total_limit - COALESCE(array_length(v_selected_ids, 1), 0);
  IF v_cur_limit > 0 THEN
    FOR v_rec IN 
      SELECT c.id FROM public.cards c
      LEFT JOIN public.card_reviews cr ON c.id = cr.card_id AND cr.user_id = p_user_id
      WHERE c.set_id = p_set_id 
        AND NOT (c.id = ANY(v_selected_ids))
      ORDER BY COALESCE(cr.mastery_score, 0) ASC, random()
      LIMIT v_cur_limit
    LOOP
      v_selected_ids := array_append(v_selected_ids, v_rec.id);
    END LOOP;
  END IF;

  -- Return final set of cards in random order
  RETURN QUERY
  SELECT c.* FROM public.cards c
  JOIN unnest(v_selected_ids) WITH ORDINALITY AS u(id, ord) ON c.id = u.id
  ORDER BY random();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Helper RPC to reset test data for user
CREATE OR REPLACE FUNCTION reset_user_study_progress(p_user_id UUID)
RETURNS void AS $$
BEGIN
  DELETE FROM public.card_reviews WHERE user_id = p_user_id;
  DELETE FROM public.game_sessions WHERE user_id = p_user_id;
  DELETE FROM public.daily_goals WHERE user_id = p_user_id;
  DELETE FROM public.user_learned_sets WHERE user_id = p_user_id;
  DELETE FROM public.study_activity WHERE user_id = p_user_id;
  UPDATE public.profiles SET words_learned = 0, points = 0, current_streak = 0, highest_streak = 0 WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
