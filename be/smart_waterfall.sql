CREATE OR REPLACE FUNCTION get_smart_waterfall_cards(
    p_set_id UUID,
    p_user_id UUID,
    p_total_limit INT DEFAULT 20
) RETURNS SETOF cards AS $$
DECLARE
    v_new_limit INT;
    v_old_limit INT;
    v_new_count INT;
BEGIN
    -- Tính toán số lượng cần lấy
    v_new_limit := CEIL(p_total_limit * 0.3);
    
    -- Kiểm tra xem còn bao nhiêu thẻ mới thực sự
    SELECT COUNT(*) INTO v_new_count
    FROM cards c
    LEFT JOIN card_reviews r ON c.id = r.card_id AND r.user_id = p_user_id
    WHERE c.set_id = p_set_id AND r.id IS NULL;
    
    -- Nếu không đủ thẻ mới, dồn số lượng còn thiếu cho thẻ cũ
    IF v_new_count < v_new_limit THEN
        v_new_limit := v_new_count;
    END IF;
    
    v_old_limit := p_total_limit - v_new_limit;

    RETURN QUERY
    WITH new_cards AS (
        SELECT c.*
        FROM cards c
        LEFT JOIN card_reviews r ON c.id = r.card_id AND r.user_id = p_user_id
        WHERE c.set_id = p_set_id AND r.id IS NULL
        ORDER BY RANDOM()
        LIMIT v_new_limit
    ),
    old_cards AS (
        SELECT c.*
        FROM cards c
        INNER JOIN card_reviews r ON c.id = r.card_id AND r.user_id = p_user_id
        WHERE c.set_id = p_set_id
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
                    WHEN 'mastered' THEN -50
                    ELSE 0
                END
            ) DESC,
            -- Tie breaker để các lần chơi không lặp lại y xì nhau
            RANDOM()
        LIMIT v_old_limit
    )
    SELECT * FROM (
        SELECT * FROM new_cards
        UNION ALL
        SELECT * FROM old_cards
    ) combined
    ORDER BY RANDOM(); -- Xáo trộn kết quả cuối cùng để thẻ cũ và thẻ mới xen kẽ nhau
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
