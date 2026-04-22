-- Run once in Supabase SQL Editor if your deployment_board_mains table
-- was created before archive support.

ALTER TABLE public.deployment_board_mains
    ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ NULL;

