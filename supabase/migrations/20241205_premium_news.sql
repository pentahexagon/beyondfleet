-- Premium News System Migration
-- Add premium columns to news table

-- Add premium columns
ALTER TABLE news ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;
ALTER TABLE news ADD COLUMN IF NOT EXISTS premium_category TEXT CHECK (premium_category IN ('institution', 'whale', 'analysis', 'prediction', 'etf'));
ALTER TABLE news ADD COLUMN IF NOT EXISTS required_tier TEXT CHECK (required_tier IN ('navigator', 'pilot', 'commander', 'admiral'));

-- Create indexes for premium news filtering
CREATE INDEX IF NOT EXISTS idx_news_premium ON news(is_premium) WHERE is_premium = true;
CREATE INDEX IF NOT EXISTS idx_news_premium_category ON news(premium_category) WHERE premium_category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_news_required_tier ON news(required_tier) WHERE required_tier IS NOT NULL;

-- Update RLS policy to allow viewing premium news metadata (but content will be filtered in app)
-- Keep existing policy - premium filtering will be done at application level
