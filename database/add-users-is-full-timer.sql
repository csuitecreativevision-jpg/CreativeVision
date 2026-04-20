-- Run in Supabase SQL editor (or your migration pipeline) so Time Tracker can read editor full-timer flag.
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_full_timer boolean NOT NULL DEFAULT false;
