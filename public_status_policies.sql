-- Cho phép tất cả mọi người có thể xem dữ liệu review của người khác (phục vụ cho tính năng chia sẻ Status Dashboard)
CREATE POLICY "Anyone can view card reviews" ON public.card_reviews
    FOR SELECT USING (true);

-- Cho phép tất cả mọi người có thể xem lịch sử học tập (streak/heatmap) của người khác
CREATE POLICY "Anyone can view study activity" ON public.study_activity
    FOR SELECT USING (true);
