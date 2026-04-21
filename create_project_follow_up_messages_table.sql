CREATE TABLE IF NOT EXISTS public.project_follow_up_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    board_id TEXT NOT NULL,
    item_id TEXT NOT NULL,
    project_name TEXT NOT NULL DEFAULT '',
    sender_role TEXT NOT NULL CHECK (sender_role IN ('admin', 'editor')),
    sender_name TEXT NOT NULL DEFAULT '',
    sender_email TEXT NOT NULL DEFAULT '',
    recipient_email TEXT NOT NULL,
    message TEXT NOT NULL,
    progress_percent INTEGER NULL CHECK (progress_percent >= 0 AND progress_percent <= 100)
);

CREATE INDEX IF NOT EXISTS idx_project_followup_recipient_created
    ON public.project_follow_up_messages(recipient_email, created_at DESC);

ALTER TABLE public.project_follow_up_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_followup_anon_all" ON public.project_follow_up_messages;
DROP POLICY IF EXISTS "project_followup_auth_all" ON public.project_follow_up_messages;

CREATE POLICY "project_followup_anon_all" ON public.project_follow_up_messages
    FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "project_followup_auth_all" ON public.project_follow_up_messages
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

