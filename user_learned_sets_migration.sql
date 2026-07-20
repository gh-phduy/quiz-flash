-- Create a table to track which sets a user has already completed/learned
CREATE TABLE public.user_learned_sets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    set_id UUID REFERENCES public.sets(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, set_id)
);

-- Enable RLS
ALTER TABLE public.user_learned_sets ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies
CREATE POLICY "Users can view their own learned sets" ON public.user_learned_sets
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own learned sets" ON public.user_learned_sets
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
