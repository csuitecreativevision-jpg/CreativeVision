-- Admin video review notes with optional timestamps, keyed by Monday board + item (survives re-upload).
-- Run in Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.submission_video_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    board_id TEXT NOT NULL,
    item_id TEXT NOT NULL,
    author_email TEXT NOT NULL,
    author_name TEXT NOT NULL DEFAULT '',
    message TEXT NOT NULL,
    timestamp_seconds DOUBLE PRECISION NULL,
    resolved_at TIMESTAMPTZ NULL,
    resolved_by_email TEXT NULL,
    author_role TEXT NOT NULL DEFAULT 'admin' CHECK (author_role IN ('admin', 'client'))
);

CREATE INDEX IF NOT EXISTS idx_submission_video_feedback_board_item
    ON public.submission_video_feedback(board_id, item_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_submission_video_feedback_unresolved
    ON public.submission_video_feedback(board_id, item_id)
    WHERE resolved_at IS NULL;

ALTER TABLE public.submission_video_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "submission_video_feedback_anon_all" ON public.submission_video_feedback;
DROP POLICY IF EXISTS "submission_video_feedback_auth_all" ON public.submission_video_feedback;

CREATE POLICY "submission_video_feedback_anon_all" ON public.submission_video_feedback
    FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "submission_video_feedback_auth_all" ON public.submission_video_feedback
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
