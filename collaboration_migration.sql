-- 1. Table for Saved Sets (Thư viện lưu trữ)
CREATE TABLE public.user_saved_sets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    set_id UUID REFERENCES public.sets(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, set_id)
);
ALTER TABLE public.user_saved_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own saved sets" ON public.user_saved_sets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own saved sets" ON public.user_saved_sets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own saved sets" ON public.user_saved_sets FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 2. Table for Set Collaborators (Người được cấp quyền)
CREATE TABLE public.set_collaborators (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    set_id UUID REFERENCES public.sets(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(set_id, user_id)
);
ALTER TABLE public.set_collaborators ENABLE ROW LEVEL SECURITY;
-- Collaborators can be viewed by anyone to see who can edit
CREATE POLICY "Collaborators are viewable by everyone" ON public.set_collaborators FOR SELECT USING (true);
-- Only the owner of the set can add or remove collaborators
CREATE POLICY "Only set owners can manage collaborators" ON public.set_collaborators 
    FOR ALL TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.sets WHERE sets.id = set_collaborators.set_id AND sets.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.sets WHERE sets.id = set_collaborators.set_id AND sets.user_id = auth.uid()
        )
    );

-- 3. Table for Notifications (Hệ thống thông báo)
CREATE TABLE public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    set_id UUID REFERENCES public.sets(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'EDIT_REQUEST', 'EDIT_ACCEPTED', 'EDIT_REJECTED'
    status TEXT DEFAULT 'pending', -- 'pending', 'read', 'accepted', 'rejected'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = recipient_id);
-- Any authenticated user can insert a notification (like requesting access)
CREATE POLICY "Users can send notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
-- Users can update notifications they received (to mark as read or accepted)
CREATE POLICY "Users can update received notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = recipient_id);


-- 4. Update RLS on sets and cards to allow collaborators to edit
-- For sets: drop the old update policy and recreate
DROP POLICY IF EXISTS "Users can update their own sets" ON public.sets;
CREATE POLICY "Users can update their own sets or if they are collaborators" ON public.sets
    FOR UPDATE TO authenticated
    USING (
        auth.uid() = user_id 
        OR 
        EXISTS (
            SELECT 1 FROM public.set_collaborators WHERE set_id = sets.id AND user_id = auth.uid()
        )
    );

-- For cards: drop old update/insert/delete and recreate
DROP POLICY IF EXISTS "Users can insert cards in their own sets" ON public.cards;
CREATE POLICY "Users can insert cards in their sets or as collaborators" ON public.cards
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.sets 
            WHERE sets.id = cards.set_id AND (sets.user_id = auth.uid() OR EXISTS (
                SELECT 1 FROM public.set_collaborators WHERE set_id = sets.id AND user_id = auth.uid()
            ))
        )
    );

DROP POLICY IF EXISTS "Users can update cards in their own sets" ON public.cards;
CREATE POLICY "Users can update cards in their sets or as collaborators" ON public.cards
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.sets 
            WHERE sets.id = cards.set_id AND (sets.user_id = auth.uid() OR EXISTS (
                SELECT 1 FROM public.set_collaborators WHERE set_id = sets.id AND user_id = auth.uid()
            ))
        )
    );

DROP POLICY IF EXISTS "Users can delete cards in their own sets" ON public.cards;
CREATE POLICY "Users can delete cards in their sets or as collaborators" ON public.cards
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.sets 
            WHERE sets.id = cards.set_id AND (sets.user_id = auth.uid() OR EXISTS (
                SELECT 1 FROM public.set_collaborators WHERE set_id = sets.id AND user_id = auth.uid()
            ))
        )
    );
