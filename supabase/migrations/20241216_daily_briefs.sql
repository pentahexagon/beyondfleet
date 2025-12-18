-- Daily Briefs 테이블 (AI 일일 리포트)
-- ============================================

CREATE TABLE IF NOT EXISTS daily_briefs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  full_content TEXT NOT NULL,
  market_sentiment TEXT CHECK (market_sentiment IN ('bullish', 'bearish', 'neutral')),
  btc_price DECIMAL(18, 2),
  eth_price DECIMAL(18, 2),
  btc_change_24h DECIMAL(8, 2),
  eth_change_24h DECIMAL(8, 2),
  fear_greed_index INTEGER,
  key_events JSONB DEFAULT '[]',
  predictions JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_daily_briefs_date ON daily_briefs(date DESC);

-- RLS 활성화
ALTER TABLE daily_briefs ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 조회 가능 (등급별 접근 제어는 API에서 처리)
CREATE POLICY "Anyone can view daily briefs"
  ON daily_briefs FOR SELECT
  USING (true);

-- Service role만 생성/수정 가능
CREATE POLICY "Service role can insert daily briefs"
  ON daily_briefs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update daily briefs"
  ON daily_briefs FOR UPDATE
  USING (true);

-- 권한 부여
GRANT SELECT ON daily_briefs TO anon;
GRANT SELECT ON daily_briefs TO authenticated;
