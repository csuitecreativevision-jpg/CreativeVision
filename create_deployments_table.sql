-- Supabase SQL Script: Create Deployments Table
-- Paste this into your Supabase SQL Editor and click "Run"

-- 1. Create the `deployments` table
CREATE TABLE IF NOT EXISTS public.deployments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    client_name TEXT NOT NULL,
    instructions TEXT,
    raw_video_link TEXT,
    video_type TEXT,
    price TEXT,
    deadline TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'Ready for Deployment'::text NOT NULL
);

-- 2. Enable Row Level Security (RLS)
-- This ensures your table is secure by default
ALTER TABLE public.deployments ENABLE ROW LEVEL SECURITY;

-- 3. Create a policy that allows authenticated users to read/write/update/delete
-- (Assuming your admins are authenticated users, or you are using the service_role key)
-- If you need public access for testing, you can change this policy, but for an admin tool, authenticated is best.
CREATE POLICY "Allow authenticated users full access" ON public.deployments
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow public read access if needed (Optional, uncomment if you want anyone to see them)
-- CREATE POLICY "Allow public read access" ON public.deployments FOR SELECT USING (true);
