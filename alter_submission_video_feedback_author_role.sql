-- Run once if you created the table before author_role existed.
ALTER TABLE public.submission_video_feedback
    ADD COLUMN IF NOT EXISTS author_role TEXT DEFAULT 'admin';

UPDATE public.submission_video_feedback SET author_role = 'admin' WHERE author_role IS NULL;
