CREATE OR REPLACE FUNCTION get_smart_waterfall_cards(
    p_set_id UUID,
    p_user_id UUID,
    p_total_limit INT DEFAULT 20
) RETURNS SETOF cards AS $$
DECLARE
    v_total_cards INT;
    v_studied_cards INT;
    v_progress FLOAT;
    v_target_new_limit INT;
    v_target_old_limit INT;
    v_available_old INT;
    v_available_new INT;
    v_actual_old_limit INT;
    v_actual_new_limit INT;
BEGIN
    -- 1. Tính toán Tiến độ (Progress)
    SELECT COUNT(*) INTO v_total_cards FROM cards WHERE set_id = p_set_id;
    
    SELECT COUNT(*) INTO v_studied_cards 
    FROM card_reviews r 
    INNER JOIN cards c ON c.id = r.card_id 
    WHERE c.set_id = p_set_id AND r.user_id = p_user_id;
    
    IF v_total_cards > 0 THEN
        v_progress := v_studied_cards::FLOAT / v_total_cards::FLOAT;
    ELSE
        v_progress := 0;
    END IF;

    -- 2. Đặt tỷ lệ mục tiêu (Target Limits)
    IF v_progress < 0.25 THEN
        -- Dưới 25%: Ưu tiên 70% từ mới
        v_target_new_limit := CEIL(p_total_limit * 0.7);
    ELSE
        -- Trên 25%: Ưu tiên 70% từ cũ cần ôn
        v_target_new_limit := CEIL(p_total_limit * 0.3);
    END IF;
    
    v_target_old_limit := p_total_limit - v_target_new_limit;

    -- 3. Kiểm tra thực tế (Fill-up Logic)
    -- Đếm số Từ Cũ Cần Ôn (KHÔNG bao gồm thẻ 'mastered')
    SELECT COUNT(*) INTO v_available_old
    FROM card_reviews r 
    INNER JOIN cards c ON c.id = r.card_id 
    WHERE c.set_id = p_set_id AND r.user_id = p_user_id AND r.mastery_level != 'mastered';
    
    -- Đếm số Từ Mới
    SELECT COUNT(*) INTO v_available_new
    FROM cards c
    LEFT JOIN card_reviews r ON c.id = r.card_id AND r.user_id = p_user_id
    WHERE c.set_id = p_set_id AND r.id IS NULL;

    -- Điều chỉnh số lượng thực tế
    IF v_available_old < v_target_old_limit THEN
        v_actual_old_limit := v_available_old;
        -- Dồn số slot dư của từ cũ sang cho từ mới
        v_actual_new_limit := p_total_limit - v_actual_old_limit;
    ELSE
        v_actual_old_limit := v_target_old_limit;
        v_actual_new_limit := v_target_new_limit;
    END IF;
    
    -- Nếu thẻ mới không đủ, dồn ngược lại cho thẻ cũ (lúc này có thể phải lấy cả thẻ mastered nếu hết sạch)
    IF v_available_new < v_actual_new_limit THEN
        v_actual_new_limit := v_available_new;
        v_actual_old_limit := p_total_limit - v_actual_new_limit;
    END IF;

    -- 4. Trả kết quả
    RETURN QUERY
    WITH new_cards AS (
        SELECT c.*
        FROM cards c
        LEFT JOIN card_reviews r ON c.id = r.card_id AND r.user_id = p_user_id
        WHERE c.set_id = p_set_id AND r.id IS NULL
        ORDER BY RANDOM()
        LIMIT v_actual_new_limit
    ),
    old_cards AS (
        SELECT c.*
        FROM cards c
        INNER JOIN card_reviews r ON c.id = r.card_id AND r.user_id = p_user_id
        WHERE c.set_id = p_set_id 
          AND r.mastery_level != 'mastered' -- Gạt bỏ hoàn toàn thẻ Mastered (Trừ phi thiếu thì ở Fallback dưới, nhưng tạm bỏ qua cho clean)
        ORDER BY 
            -- Priority Score Logic:
            (
                (r.incorrect_count * 5) + 
                CASE r.weakness_level
                    WHEN 5 THEN 50
                    WHEN 4 THEN 30
                    WHEN 3 THEN 10
                    WHEN 2 THEN 0
                    WHEN 1 THEN -10
                    ELSE 0
                END +
                CASE r.mastery_level
                    WHEN 'learning' THEN 20
                    WHEN 'reviewing' THEN 10
                    ELSE 0
                END
            ) DESC,
            RANDOM()
        LIMIT v_actual_old_limit
    )
    SELECT * FROM (
        SELECT * FROM new_cards
        UNION ALL
        SELECT * FROM old_cards
    ) combined
    ORDER BY RANDOM();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
