-- Project feedback thread between client/editor/admin, keyed by board + item.
-- Run in Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.project_feedback_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    board_id TEXT NOT NULL,
    item_id TEXT NOT NULL,
    project_name TEXT NOT NULL DEFAULT '',
    sender_email TEXT NOT NULL,
    sender_name TEXT NOT NULL DEFAULT '',
    sender_role TEXT NOT NULL CHECK (sender_role IN ('client', 'editor', 'admin')),
    message TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_project_feedback_board_item
    ON public.project_feedback_messages(board_id, item_id, created_at DESC);

ALTER TABLE public.project_feedback_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_feedback_anon_all" ON public.project_feedback_messages;
DROP POLICY IF EXISTS "project_feedback_auth_all" ON public.project_feedback_messages;

CREATE POLICY "project_feedback_anon_all" ON public.project_feedback_messages
    FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "project_feedback_auth_all" ON public.project_feedback_messages
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

