-- In-app Deployment Board (main items + video subitems).
-- HOW TO RUN: Open this file in your editor, select ALL text (Ctrl+A), copy, paste into
-- Supabase → SQL Editor → New query. Do NOT type the filename into Supabase; paste the SQL below.

CREATE TABLE IF NOT EXISTS public.deployment_board_mains (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT NOT NULL DEFAULT 'Untitled batch',
    instructions TEXT DEFAULT '',
    drive_folder_link TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'Working on it'
        CHECK (status IN ('Working on it', 'Deployed'))
);

CREATE TABLE IF NOT EXISTS public.deployment_board_videos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    main_id UUID NOT NULL REFERENCES public.deployment_board_mains(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT '',
    video_link TEXT DEFAULT '',
    deadline DATE NULL,
    status TEXT NOT NULL DEFAULT 'Ready for Deployment'
        CHECK (status IN ('Ready for Deployment', 'Deployed')),
    sort_order INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_deployment_board_videos_main_id ON public.deployment_board_videos(main_id);

ALTER TABLE public.deployment_board_mains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deployment_board_videos ENABLE ROW LEVEL SECURITY;

-- Match existing deployment tables (anon client from admin portal). Drop first so this script is safe to re-run.
DROP POLICY IF EXISTS "deployment_board_mains_anon_all" ON public.deployment_board_mains;
DROP POLICY IF EXISTS "deployment_board_videos_anon_all" ON public.deployment_board_videos;
DROP POLICY IF EXISTS "deployment_board_mains_auth_all" ON public.deployment_board_mains;
DROP POLICY IF EXISTS "deployment_board_videos_auth_all" ON public.deployment_board_videos;

CREATE POLICY "deployment_board_mains_anon_all" ON public.deployment_board_mains
    FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "deployment_board_videos_anon_all" ON public.deployment_board_videos
    FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "deployment_board_mains_auth_all" ON public.deployment_board_mains
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "deployment_board_videos_auth_all" ON public.deployment_board_videos
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
