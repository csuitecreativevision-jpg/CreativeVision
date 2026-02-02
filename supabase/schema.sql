-- Supabase Schema: boards table
-- Run this in your Supabase SQL Editor

-- Create boards table
CREATE TABLE IF NOT EXISTS boards (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'board',
    workspace_id TEXT,
    items_count INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_boards_name ON boards(name);
CREATE INDEX IF NOT EXISTS idx_boards_workspace ON boards(workspace_id);

COMMENT ON TABLE boards IS 'Cached Monday.com boards for role-based dashboard access';

-- ============================================
-- Users Table (for role-based access testing)
-- ============================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'client')),
    workspace_id TEXT,  -- The user's assigned main workspace from Monday.com
    allowed_board_ids TEXT[], -- Optional: Specific boards the user is allowed to access
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Enable RLS with open policy for testing
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to users" ON users
    FOR ALL USING (true) WITH CHECK (true);

COMMENT ON TABLE users IS 'Test users for role-based dashboard access';
