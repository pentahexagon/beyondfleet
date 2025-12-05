-- Drop existing table if exists (for fresh start)
DROP TABLE IF EXISTS watchlist;

-- Watchlist table - supports both user_id and wallet_address
CREATE TABLE watchlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address TEXT,
  coin_id TEXT NOT NULL,
  coin_name TEXT NOT NULL,
  coin_symbol TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Either user_id or wallet_address must be present
  CONSTRAINT user_or_wallet CHECK (user_id IS NOT NULL OR wallet_address IS NOT NULL),
  -- Unique per user_id + coin
  CONSTRAINT unique_user_coin UNIQUE (user_id, coin_id),
  -- Unique per wallet + coin
  CONSTRAINT unique_wallet_coin UNIQUE (wallet_address, coin_id)
);

-- Indexes
CREATE INDEX idx_watchlist_user_id ON watchlist(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_watchlist_wallet ON watchlist(wallet_address) WHERE wallet_address IS NOT NULL;
CREATE INDEX idx_watchlist_coin_id ON watchlist(coin_id);

-- Disable RLS for simplicity (or enable with proper policies)
ALTER TABLE watchlist DISABLE ROW LEVEL SECURITY;
