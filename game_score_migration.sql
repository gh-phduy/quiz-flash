-- 1. Thêm cột score vào bảng card_reviews
ALTER TABLE public.card_reviews
ADD COLUMN IF NOT EXISTS score INT DEFAULT 0 NOT NULL;

-- 2. Cập nhật hàm lấy thẻ random để ưu tiên thẻ có score thấp nhất
CREATE OR REPLACE FUNCTION get_random_cards_by_weakness(
  p_set_id UUID,
  p_user_id UUID,
  p_weakness_level INT,
  p_limit INT
)
RETURNS SETOF public.cards AS $$
BEGIN
  RETURN QUERY
  SELECT c.*
  FROM public.cards c
  LEFT JOIN public.card_reviews cr ON c.id = cr.card_id AND cr.user_id = p_user_id
  WHERE c.set_id = p_set_id
    AND (cr.weakness_level = p_weakness_level OR (cr.weakness_level IS NULL AND p_weakness_level = 5))
  ORDER BY cr.score ASC NULLS FIRST, random()
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Hàm tiện ích để cập nhật điểm từ các game (cộng 1 nếu đúng, trừ 1 nếu sai)
CREATE OR REPLACE FUNCTION update_game_scores(
  p_user_id UUID,
  p_correct_card_ids UUID[],
  p_incorrect_card_ids UUID[]
)
RETURNS void AS $$
BEGIN
  -- Cập nhật cho câu đúng (+1)
  IF array_length(p_correct_card_ids, 1) > 0 THEN
    INSERT INTO public.card_reviews (user_id, card_id, next_review_date, score, mastery_level, weakness_level)
    SELECT p_user_id, unnest(p_correct_card_ids), CURRENT_DATE, 1, 'new', 5
    ON CONFLICT (user_id, card_id) 
    DO UPDATE SET score = public.card_reviews.score + 1;
  END IF;

  -- Cập nhật cho câu sai (-1)
  IF array_length(p_incorrect_card_ids, 1) > 0 THEN
    INSERT INTO public.card_reviews (user_id, card_id, next_review_date, score, mastery_level, weakness_level)
    SELECT p_user_id, unnest(p_incorrect_card_ids), CURRENT_DATE, -1, 'new', 5
    ON CONFLICT (user_id, card_id) 
    DO UPDATE SET score = public.card_reviews.score - 1;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
