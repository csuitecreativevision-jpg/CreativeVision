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
    discord_thread_id TEXT,    -- The ID of the Discord thread for this editor
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

-- ============================================
-- Cache Tables for Monday.com Integration
-- ============================================

CREATE TABLE IF NOT EXISTS cache_monday_board_items (
    board_id TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cache_monday_meta (
    key TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for cache tables
CREATE INDEX IF NOT EXISTS idx_cache_monday_board_items_updated_at ON cache_monday_board_items(updated_at);
CREATE INDEX IF NOT EXISTS idx_cache_monday_meta_updated_at ON cache_monday_meta(updated_at);

-- RLS Policies for Cache Tables
ALTER TABLE cache_monday_board_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache_monday_meta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to cache_monday_board_items" ON cache_monday_board_items
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to cache_monday_meta" ON cache_monday_meta
    FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- Leave Requests Table
-- ============================================

CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    user_name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    leave_type TEXT NOT NULL DEFAULT 'vacation' CHECK (leave_type IN ('vacation', 'sick', 'personal', 'bereavement', 'unpaid', 'other')),
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leave_requests_user_email ON leave_requests(user_email);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);

ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to leave_requests" ON leave_requests
    FOR ALL USING (true) WITH CHECK (true);

COMMENT ON TABLE leave_requests IS 'Employee leave requests';