-- Smart Waterfall V5 (50/50 Game-Specific Accuracy)
-- Goal: 50% New/Unplayed cards, 50% Old cards (prioritizing lowest Game Accuracy)
-- Note: Temp-table-free implementation to avoid PL/pgSQL cached plan errors.

CREATE OR REPLACE FUNCTION get_smart_waterfall_cards_v5(
    p_set_id uuid,
    p_user_id uuid,
    p_total_limit integer,
    p_game_mode text DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    term text,
    definition text,
    image_url text,
    audio_url text,
    phonetic text,
    phonetic_uk text,
    part_of_speech text,
    cefr_level text,
    order_index integer,
    is_new boolean,
    game_total_reviews integer,
    game_correct_count integer,
    game_incorrect_count integer,
    game_accuracy double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_pool_a_limit integer; -- Quota for Globally New + Game Unplayed
    v_pool_b_limit integer; -- Quota for Game Weak
    v_new_count integer;
    v_unplayed_count integer;
    v_weak_count integer;
BEGIN
    -- Base 50/50 split
    v_pool_a_limit := CEIL(p_total_limit * 0.5);
    v_pool_b_limit := FLOOR(p_total_limit * 0.5);

    -- 1. Count Globally New cards (review_id IS NULL or total_reviews = 0)
    SELECT count(*) INTO v_new_count
    FROM cards c
    LEFT JOIN card_reviews cr ON cr.card_id = c.id AND cr.user_id = p_user_id
    WHERE c.set_id = p_set_id AND (cr.id IS NULL OR COALESCE(cr.total_reviews, 0) = 0);

    -- 2. Count Game Unplayed cards (reviewed globally, but g_total = 0)
    SELECT count(*) INTO v_unplayed_count
    FROM cards c
    LEFT JOIN card_reviews cr ON cr.card_id = c.id AND cr.user_id = p_user_id
    WHERE c.set_id = p_set_id 
      AND cr.id IS NOT NULL 
      AND COALESCE(cr.total_reviews, 0) > 0 
      AND COALESCE((cr.mode_stats->p_game_mode->>'total')::integer, 0) = 0;

    -- 3. Count Game Weak cards (played in this mode, and g_accuracy < 1.0)
    SELECT count(*) INTO v_weak_count
    FROM cards c
    LEFT JOIN card_reviews cr ON cr.card_id = c.id AND cr.user_id = p_user_id
    WHERE c.set_id = p_set_id 
      AND cr.id IS NOT NULL 
      AND COALESCE(cr.total_reviews, 0) > 0 
      AND COALESCE((cr.mode_stats->p_game_mode->>'total')::integer, 0) > 0
      AND (
          COALESCE((cr.mode_stats->p_game_mode->>'correct')::integer, 0)::float / 
          COALESCE((cr.mode_stats->p_game_mode->>'total')::integer, 1)
      ) < 1.0;

    -- Adjust limits (Fill-up logic)
    IF (v_new_count + v_unplayed_count) < v_pool_a_limit THEN
        -- Not enough new + unplayed cards, give extra slots to weak cards
        v_pool_b_limit := p_total_limit - (v_new_count + v_unplayed_count);
        v_pool_a_limit := v_new_count + v_unplayed_count;
    ELSIF v_weak_count < v_pool_b_limit THEN
        -- Not enough weak cards, give extra slots to new + unplayed cards
        v_pool_a_limit := p_total_limit - v_weak_count;
        v_pool_b_limit := v_weak_count;
    END IF;

    RETURN QUERY
    WITH tmp_card_stats_ctes AS (
        SELECT 
            c.id as card_id, 
            c.term, 
            c.definition, 
            c.image_url, 
            c.audio_url, 
            c.phonetic, 
            c.phonetic_uk, 
            c.part_of_speech, 
            c.cefr_level, 
            c.order_index,
            cr.id as review_id,
            cr.mode_stats,
            COALESCE(cr.total_reviews, 0) as global_total,
            COALESCE((cr.mode_stats->p_game_mode->>'total')::integer, 0) as g_total,
            COALESCE((cr.mode_stats->p_game_mode->>'correct')::integer, 0) as g_correct,
            COALESCE((cr.mode_stats->p_game_mode->>'incorrect')::integer, 0) as g_incorrect,
            CASE 
                WHEN COALESCE((cr.mode_stats->p_game_mode->>'total')::integer, 0) = 0 THEN 0.0
                ELSE COALESCE((cr.mode_stats->p_game_mode->>'correct')::integer, 0)::float / COALESCE((cr.mode_stats->p_game_mode->>'total')::integer, 1)
            END as g_accuracy
        FROM cards c
        LEFT JOIN card_reviews cr ON c.id = cr.card_id AND cr.user_id = p_user_id
        WHERE c.set_id = p_set_id
    ),
    new_cards AS (
        SELECT 
            t.card_id, t.term, t.definition, t.image_url, t.audio_url, t.phonetic, t.phonetic_uk, t.part_of_speech, t.cefr_level, t.order_index,
            TRUE as is_new_flag,
            t.g_total as game_total_reviews,
            t.g_correct as game_correct_count,
            t.g_incorrect as game_incorrect_count,
            t.g_accuracy as game_accuracy,
            1 as pool_priority,
            random() as sort_value
        FROM tmp_card_stats_ctes t
        WHERE t.review_id IS NULL OR t.global_total = 0
        ORDER BY random()
        LIMIT v_pool_a_limit
    ),
    unplayed_cards AS (
        SELECT 
            t.card_id, t.term, t.definition, t.image_url, t.audio_url, t.phonetic, t.phonetic_uk, t.part_of_speech, t.cefr_level, t.order_index,
            FALSE as is_new_flag,
            t.g_total as game_total_reviews,
            t.g_correct as game_correct_count,
            t.g_incorrect as game_incorrect_count,
            t.g_accuracy as game_accuracy,
            2 as pool_priority,
            random() as sort_value
        FROM tmp_card_stats_ctes t
        WHERE t.review_id IS NOT NULL AND t.global_total > 0 AND t.g_total = 0
        ORDER BY random()
        LIMIT v_pool_a_limit
    ),
    pool_a AS (
        SELECT * FROM (
            SELECT * FROM new_cards
            UNION ALL
            SELECT * FROM unplayed_cards
        ) ua
        ORDER BY pool_priority ASC, sort_value ASC
        LIMIT v_pool_a_limit
    ),
    weak_cards AS (
        SELECT 
            t.card_id, t.term, t.definition, t.image_url, t.audio_url, t.phonetic, t.phonetic_uk, t.part_of_speech, t.cefr_level, t.order_index,
            FALSE as is_new_flag,
            t.g_total as game_total_reviews,
            t.g_correct as game_correct_count,
            t.g_incorrect as game_incorrect_count,
            t.g_accuracy as game_accuracy,
            3 as pool_priority,
            (t.g_accuracy * 10000 - t.g_total) as sort_value
        FROM tmp_card_stats_ctes t
        WHERE t.review_id IS NOT NULL AND t.global_total > 0 AND t.g_total > 0 AND t.g_accuracy < 1.0
        ORDER BY t.g_accuracy ASC, t.g_total DESC
        LIMIT v_pool_b_limit
    ),
    mastered_cards AS (
        SELECT 
            t.card_id, t.term, t.definition, t.image_url, t.audio_url, t.phonetic, t.phonetic_uk, t.part_of_speech, t.cefr_level, t.order_index,
            FALSE as is_new_flag,
            t.g_total as game_total_reviews,
            t.g_correct as game_correct_count,
            t.g_incorrect as game_incorrect_count,
            t.g_accuracy as game_accuracy,
            4 as pool_priority,
            random() as sort_value
        FROM tmp_card_stats_ctes t
        WHERE t.review_id IS NOT NULL AND t.global_total > 0 AND t.g_total > 0 AND t.g_accuracy = 1.0
        ORDER BY random()
        LIMIT p_total_limit
    ),
    combined AS (
        SELECT *, 1 as final_priority FROM pool_a
        UNION ALL
        SELECT *, 2 as final_priority FROM weak_cards
        UNION ALL
        SELECT *, 3 as final_priority FROM mastered_cards
    )
    SELECT 
        c.card_id as id,
        c.term,
        c.definition,
        c.image_url,
        c.audio_url,
        c.phonetic,
        c.phonetic_uk,
        c.part_of_speech,
        c.cefr_level,
        c.order_index,
        c.is_new_flag as is_new,
        c.game_total_reviews,
        c.game_correct_count,
        c.game_incorrect_count,
        c.game_accuracy
    FROM combined c
    ORDER BY c.final_priority ASC, c.sort_value ASC
    LIMIT p_total_limit;
END;
$$;
