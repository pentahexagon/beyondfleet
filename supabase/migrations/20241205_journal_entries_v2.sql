-- Journal Entries table for Challenge Journal feature (v2)
-- Run this in Supabase Studio SQL Editor
-- This version removes the foreign key constraint for wallet-only users

-- Drop existing table if exists
DROP TABLE IF EXISTS journal_entries;

-- Create table without foreign key constraint for flexibility
CREATE TABLE journal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,  -- No foreign key constraint for wallet-only users
  wallet_address TEXT,
  author_name TEXT DEFAULT '익명',
  title TEXT NOT NULL,
  content TEXT,
  goal_amount DECIMAL(20, 2),
  current_amount DECIMAL(20, 2),
  target_date DATE,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'paused')),
  is_public BOOLEAN DEFAULT false,
  likes INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_journal_user_id ON journal_entries(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_journal_wallet ON journal_entries(wallet_address) WHERE wallet_address IS NOT NULL;
CREATE INDEX idx_journal_status ON journal_entries(status);
CREATE INDEX idx_journal_public ON journal_entries(is_public) WHERE is_public = true;
CREATE INDEX idx_journal_created_at ON journal_entries(created_at DESC);
CREATE INDEX idx_journal_likes ON journal_entries(likes DESC) WHERE is_public = true;

-- Enable RLS but allow all operations for now
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read public entries
CREATE POLICY "Public entries are viewable by everyone"
  ON journal_entries
  FOR SELECT
  USING (is_public = true);

-- Policy: Users can read their own entries (by user_id)
CREATE POLICY "Users can view own entries by user_id"
  ON journal_entries
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own entries
CREATE POLICY "Users can insert own entries"
  ON journal_entries
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR (user_id IS NULL AND wallet_address IS NOT NULL)
  );

-- Policy: Users can update their own entries
CREATE POLICY "Users can update own entries"
  ON journal_entries
  FOR UPDATE
  USING (
    auth.uid() = user_id
    OR (user_id IS NULL AND wallet_address IS NOT NULL)
  );

-- Policy: Users can delete their own entries
CREATE POLICY "Users can delete own entries"
  ON journal_entries
  FOR DELETE
  USING (
    auth.uid() = user_id
    OR (user_id IS NULL AND wallet_address IS NOT NULL)
  );

-- For simplicity during development, allow anonymous access too
-- Remove these in production!
CREATE POLICY "Allow anonymous insert for development"
  ON journal_entries
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow anonymous select for development"
  ON journal_entries
  FOR SELECT
  USING (true);

CREATE POLICY "Allow anonymous update for development"
  ON journal_entries
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow anonymous delete for development"
  ON journal_entries
  FOR DELETE
  USING (true);
