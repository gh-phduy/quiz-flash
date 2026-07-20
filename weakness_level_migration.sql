-- Thêm cột weakness_level vào bảng card_reviews
ALTER TABLE public.card_reviews
ADD COLUMN weakness_level INT DEFAULT 5 NOT NULL;

-- Cập nhật lại weakness_level cho các records đã tồn tại dựa vào EF và mastery_level hiện có
UPDATE public.card_reviews
SET weakness_level = CASE
    WHEN easiness_factor < 1.7 THEN 5
    WHEN easiness_factor >= 1.7 AND easiness_factor < 2.0 THEN 4
    WHEN easiness_factor >= 2.0 AND easiness_factor < 2.4 THEN 3
    WHEN easiness_factor >= 2.4 AND easiness_factor < 2.6 THEN 2
    WHEN easiness_factor >= 2.6 THEN 1
    ELSE 5
END;

-- Tạo index để truy vấn nhanh hơn khi lấy thẻ random theo mức độ
CREATE INDEX idx_card_reviews_weakness ON public.card_reviews (weakness_level);

-- Tạo một function RPC để query thẻ ngẫu nhiên theo weakness_level cho chế độ Cường độ cao
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
  ORDER BY random()
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
