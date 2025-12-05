-- Premium News Automation System Tables

-- Daily AI Reports table
CREATE TABLE IF NOT EXISTS daily_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('cadet', 'navigator', 'pilot', 'commander', 'admiral')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  market_sentiment TEXT CHECK (market_sentiment IN ('bullish', 'bearish', 'neutral')),
  key_events JSONB DEFAULT '[]',
  price_prediction JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, tier)
);

-- Whale Transactions table
CREATE TABLE IF NOT EXISTS whale_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coin TEXT NOT NULL,
  amount DECIMAL(30, 8) NOT NULL,
  amount_usd DECIMAL(20, 2),
  from_address TEXT,
  to_address TEXT,
  from_label TEXT,
  to_label TEXT,
  tx_type TEXT CHECK (tx_type IN ('exchange_deposit', 'exchange_withdrawal', 'transfer', 'unknown')),
  tx_hash TEXT,
  blockchain TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  is_significant BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Analysis Jobs table (for tracking cron jobs)
CREATE TABLE IF NOT EXISTS ai_analysis_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_type TEXT NOT NULL CHECK (job_type IN ('daily_report', 'whale_analysis', 'market_summary')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON daily_reports(date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_reports_tier ON daily_reports(tier);
CREATE INDEX IF NOT EXISTS idx_whale_transactions_timestamp ON whale_transactions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_whale_transactions_coin ON whale_transactions(coin);
CREATE INDEX IF NOT EXISTS idx_whale_transactions_significant ON whale_transactions(is_significant) WHERE is_significant = true;
CREATE INDEX IF NOT EXISTS idx_ai_jobs_status ON ai_analysis_jobs(status);

-- Enable RLS
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE whale_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analysis_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily_reports
CREATE POLICY "Anyone can view cadet reports" ON daily_reports
  FOR SELECT USING (tier = 'cadet');

CREATE POLICY "Authenticated users can view based on tier" ON daily_reports
  FOR SELECT USING (true); -- App handles tier filtering

-- RLS Policies for whale_transactions
CREATE POLICY "Anyone can view whale transactions" ON whale_transactions
  FOR SELECT USING (true);

-- Admin policies
CREATE POLICY "Admins can manage daily_reports" ON daily_reports
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

CREATE POLICY "Admins can manage whale_transactions" ON whale_transactions
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

CREATE POLICY "Admins can manage ai_analysis_jobs" ON ai_analysis_jobs
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- Service role bypass for cron jobs
CREATE POLICY "Service role can insert daily_reports" ON daily_reports
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can insert whale_transactions" ON whale_transactions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can manage ai_analysis_jobs" ON ai_analysis_jobs
  FOR ALL USING (true);
