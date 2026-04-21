-- Run once in Supabase SQL Editor if you already created deployment_board_videos
-- before `name` and `deadline` existed.

ALTER TABLE public.deployment_board_videos
    ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '';

ALTER TABLE public.deployment_board_videos
    ADD COLUMN IF NOT EXISTS deadline DATE NULL;
