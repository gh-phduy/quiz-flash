UPDATE card_reviews
SET mastery_level = CASE
    WHEN (correct_count::float / NULLIF(total_reviews, 0)) >= 0.9 AND total_reviews >= 3 THEN 'mastered'
    WHEN repetitions >= 5 THEN 'mastered'
    WHEN (correct_count::float / NULLIF(total_reviews, 0)) >= 0.75 AND total_reviews >= 2 THEN 'reviewing'
    WHEN repetitions >= 3 THEN 'reviewing'
    ELSE 'learning'
END
WHERE total_reviews > 0;
