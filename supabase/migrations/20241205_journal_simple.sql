-- Journal Entries table - SIMPLE VERSION (No RLS)
-- Run this in Supabase Studio SQL Editor
-- Use this for quick setup without RLS complexity

DROP TABLE IF EXISTS journal_entries;

CREATE TABLE journal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
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

-- Indexes
CREATE INDEX idx_journal_user_id ON journal_entries(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_journal_wallet ON journal_entries(wallet_address) WHERE wallet_address IS NOT NULL;
CREATE INDEX idx_journal_public ON journal_entries(is_public) WHERE is_public = true;
CREATE INDEX idx_journal_created_at ON journal_entries(created_at DESC);

-- Disable RLS completely for development
ALTER TABLE journal_entries DISABLE ROW LEVEL SECURITY;

-- Grant access to anon and authenticated roles
GRANT ALL ON journal_entries TO anon;
GRANT ALL ON journal_entries TO authenticated;
