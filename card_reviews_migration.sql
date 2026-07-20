-- Create card_reviews table to track card-level SM-2 repetition data
CREATE TABLE public.card_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE NOT NULL,
    -- SM-2 algorithm state
    easiness_factor FLOAT DEFAULT 2.5 NOT NULL,        -- EF, min 1.3
    repetitions INT DEFAULT 0 NOT NULL,                -- n (successful reps)
    interval_days INT DEFAULT 0 NOT NULL,              -- current interval in days
    next_review_date DATE NOT NULL,                    -- when to review next
    -- Tracking stats
    total_reviews INT DEFAULT 0 NOT NULL,              -- total times reviewed
    correct_count INT DEFAULT 0 NOT NULL,              -- times answered correctly
    incorrect_count INT DEFAULT 0 NOT NULL,            -- times answered incorrectly
    last_quality INT,                                  -- last q score (0-5)
    mastery_level TEXT DEFAULT 'new' NOT NULL,          -- 'new', 'learning', 'reviewing', 'mastered'
    -- Timestamps
    last_reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, card_id)
);

-- Enable Row Level Security
ALTER TABLE public.card_reviews ENABLE ROW LEVEL SECURITY;

-- Enable SELECT/INSERT/UPDATE for authenticated users matching user_id
CREATE POLICY "Users can view their own card reviews" ON public.card_reviews
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own card reviews" ON public.card_reviews
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own card reviews" ON public.card_reviews
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own card reviews" ON public.card_reviews
    FOR DELETE TO authenticated USING (auth.uid() = user_id);
