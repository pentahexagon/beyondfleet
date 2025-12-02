-- NFT System Tables

-- NFTs table
CREATE TABLE IF NOT EXISTS nfts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  tier VARCHAR(50) NOT NULL CHECK (tier IN ('cadet', 'navigator', 'pilot', 'commander', 'admiral')),
  owner_id UUID REFERENCES auth.users(id),
  is_listed BOOLEAN DEFAULT false,
  price DECIMAL(18, 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auctions table
CREATE TABLE IF NOT EXISTS auctions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nft_id UUID REFERENCES nfts(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES auth.users(id),
  start_price DECIMAL(18, 8) NOT NULL,
  current_bid DECIMAL(18, 8),
  highest_bidder UUID REFERENCES auth.users(id),
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'ended', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bids table
CREATE TABLE IF NOT EXISTS bids (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auction_id UUID REFERENCES auctions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  amount DECIMAL(18, 8) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Randombox history table
CREATE TABLE IF NOT EXISTS randombox_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  box_type VARCHAR(20) NOT NULL CHECK (box_type IN ('basic', 'premium', 'legendary')),
  result_nft_id UUID REFERENCES nfts(id),
  sol_amount DECIMAL(18, 8) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gifts table
CREATE TABLE IF NOT EXISTS gifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user UUID REFERENCES auth.users(id),
  to_wallet VARCHAR(255) NOT NULL,
  nft_id UUID REFERENCES nfts(id),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_nfts_owner ON nfts(owner_id);
CREATE INDEX IF NOT EXISTS idx_nfts_tier ON nfts(tier);
CREATE INDEX IF NOT EXISTS idx_nfts_listed ON nfts(is_listed);
CREATE INDEX IF NOT EXISTS idx_auctions_status ON auctions(status);
CREATE INDEX IF NOT EXISTS idx_auctions_end_time ON auctions(end_time);
CREATE INDEX IF NOT EXISTS idx_bids_auction ON bids(auction_id);
CREATE INDEX IF NOT EXISTS idx_randombox_user ON randombox_history(user_id);
CREATE INDEX IF NOT EXISTS idx_gifts_from ON gifts(from_user);

-- Enable RLS
ALTER TABLE nfts ENABLE ROW LEVEL SECURITY;
ALTER TABLE auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE randombox_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE gifts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view NFTs" ON nfts FOR SELECT USING (true);
CREATE POLICY "Owners can update their NFTs" ON nfts FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Anyone can view auctions" ON auctions FOR SELECT USING (true);
CREATE POLICY "Sellers can manage their auctions" ON auctions FOR ALL USING (auth.uid() = seller_id);

CREATE POLICY "Anyone can view bids" ON bids FOR SELECT USING (true);
CREATE POLICY "Users can create bids" ON bids FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their randombox history" ON randombox_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create randombox history" ON randombox_history FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view gifts they sent" ON gifts FOR SELECT USING (auth.uid() = from_user);
CREATE POLICY "Users can send gifts" ON gifts FOR INSERT WITH CHECK (auth.uid() = from_user);
