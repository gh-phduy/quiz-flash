-- Tối ưu hóa Database: Thêm Indexes cho các bảng để tăng tốc độ truy vấn

-- 1. Bảng sets
CREATE INDEX IF NOT EXISTS idx_sets_user_id ON public.sets (user_id);
CREATE INDEX IF NOT EXISTS idx_sets_is_public ON public.sets (is_public);

-- 2. Bảng cards
CREATE INDEX IF NOT EXISTS idx_cards_set_id ON public.cards (set_id);

-- 3. Bảng card_reviews
CREATE INDEX IF NOT EXISTS idx_card_reviews_user_id ON public.card_reviews (user_id);
CREATE INDEX IF NOT EXISTS idx_card_reviews_next_review_date ON public.card_reviews (next_review_date);
CREATE INDEX IF NOT EXISTS idx_card_reviews_card_id ON public.card_reviews (card_id);

-- 4. Bảng user_saved_sets (được suy đoán qua queries)
CREATE INDEX IF NOT EXISTS idx_user_saved_sets_user_id ON public.user_saved_sets (user_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_sets_set_id ON public.user_saved_sets (set_id);

-- 5. Bảng study_activity (được suy đoán qua queries)
CREATE INDEX IF NOT EXISTS idx_study_activity_user_id_date ON public.study_activity (user_id, study_date);

-- 6. Bảng user_learned_sets
CREATE INDEX IF NOT EXISTS idx_user_learned_sets_user_id_set_id ON public.user_learned_sets (user_id, set_id);
