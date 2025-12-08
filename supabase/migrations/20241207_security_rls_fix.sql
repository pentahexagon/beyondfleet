-- Security Fix: Enable RLS on tables that had it disabled
-- Run this migration to enable proper Row Level Security

-- ============================================
-- 1. Watchlist Table - Enable RLS
-- ============================================
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own watchlist" ON watchlist;
DROP POLICY IF EXISTS "Users can manage their own watchlist" ON watchlist;

-- Create policies for user_id based access
CREATE POLICY "Users can view own watchlist by user_id"
  ON watchlist FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watchlist by user_id"
  ON watchlist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own watchlist by user_id"
  ON watchlist FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for wallet_address based access (for non-authenticated wallet users)
CREATE POLICY "Anyone can view watchlist by wallet_address"
  ON watchlist FOR SELECT
  USING (wallet_address IS NOT NULL);

CREATE POLICY "Anyone can insert watchlist by wallet_address"
  ON watchlist FOR INSERT
  WITH CHECK (wallet_address IS NOT NULL AND user_id IS NULL);

CREATE POLICY "Anyone can delete own watchlist by wallet_address"
  ON watchlist FOR DELETE
  USING (wallet_address IS NOT NULL);

-- ============================================
-- 2. Journal Entries Table - Enable RLS
-- ============================================
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can manage own journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Public entries viewable by all" ON journal_entries;

-- Public entries can be viewed by anyone
CREATE POLICY "Public journal entries viewable by all"
  ON journal_entries FOR SELECT
  USING (is_public = true);

-- Users can view their own entries (including private)
CREATE POLICY "Users can view own journal entries"
  ON journal_entries FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own entries
CREATE POLICY "Users can insert own journal entries"
  ON journal_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own entries
CREATE POLICY "Users can update own journal entries"
  ON journal_entries FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own entries
CREATE POLICY "Users can delete own journal entries"
  ON journal_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Wallet-based access for non-authenticated users
CREATE POLICY "Wallet users can view own journal entries"
  ON journal_entries FOR SELECT
  USING (wallet_address IS NOT NULL);

CREATE POLICY "Wallet users can insert journal entries"
  ON journal_entries FOR INSERT
  WITH CHECK (wallet_address IS NOT NULL AND user_id IS NULL);

CREATE POLICY "Wallet users can update own journal entries"
  ON journal_entries FOR UPDATE
  USING (wallet_address IS NOT NULL AND user_id IS NULL);

CREATE POLICY "Wallet users can delete own journal entries"
  ON journal_entries FOR DELETE
  USING (wallet_address IS NOT NULL AND user_id IS NULL);

-- ============================================
-- 3. Revoke direct table access from anon/authenticated
-- (RLS will handle access control)
-- ============================================
REVOKE ALL ON watchlist FROM anon;
REVOKE ALL ON watchlist FROM authenticated;
GRANT SELECT, INSERT, DELETE ON watchlist TO anon;
GRANT SELECT, INSERT, DELETE ON watchlist TO authenticated;

REVOKE ALL ON journal_entries FROM anon;
REVOKE ALL ON journal_entries FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON journal_entries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON journal_entries TO authenticated;

-- ============================================
-- 4. Add audit columns if not exists
-- ============================================
ALTER TABLE watchlist ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- ============================================
-- 5. Create trigger for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_watchlist_updated_at ON watchlist;
CREATE TRIGGER update_watchlist_updated_at
  BEFORE UPDATE ON watchlist
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_journal_entries_updated_at ON journal_entries;
CREATE TRIGGER update_journal_entries_updated_at
  BEFORE UPDATE ON journal_entries
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
