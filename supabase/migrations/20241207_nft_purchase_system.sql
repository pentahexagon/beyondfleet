-- NFT 구매 시스템 마이그레이션
-- Metaplex Auction House 연동을 위한 스키마 확장

-- ============================================
-- 1. NFTs 테이블 확장
-- ============================================
ALTER TABLE nfts ADD COLUMN IF NOT EXISTS mint_address TEXT;
ALTER TABLE nfts ADD COLUMN IF NOT EXISTS owner_wallet TEXT;
ALTER TABLE nfts ADD COLUMN IF NOT EXISTS metadata_uri TEXT;
ALTER TABLE nfts ADD COLUMN IF NOT EXISTS collection_address TEXT;

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_nfts_mint_address ON nfts(mint_address) WHERE mint_address IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_nfts_owner_wallet ON nfts(owner_wallet) WHERE owner_wallet IS NOT NULL;

-- ============================================
-- 2. Auctions 테이블 확장 (스나이핑 방지)
-- ============================================
ALTER TABLE auctions ADD COLUMN IF NOT EXISTS original_end_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE auctions ADD COLUMN IF NOT EXISTS extension_count INTEGER DEFAULT 0;
ALTER TABLE auctions ADD COLUMN IF NOT EXISTS max_extensions INTEGER DEFAULT 12;
ALTER TABLE auctions ADD COLUMN IF NOT EXISTS seller_wallet TEXT;
ALTER TABLE auctions ADD COLUMN IF NOT EXISTS auction_house_address TEXT;
ALTER TABLE auctions ADD COLUMN IF NOT EXISTS listing_receipt TEXT;
ALTER TABLE auctions ADD COLUMN IF NOT EXISTS settled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE auctions ADD COLUMN IF NOT EXISTS settlement_tx TEXT;

-- original_end_time이 없으면 end_time으로 채우기
UPDATE auctions SET original_end_time = end_time WHERE original_end_time IS NULL;

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_auctions_seller_wallet ON auctions(seller_wallet) WHERE seller_wallet IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_auctions_end_time_active ON auctions(end_time) WHERE status = 'active';

-- ============================================
-- 3. Bids 테이블 확장
-- ============================================
ALTER TABLE bids ADD COLUMN IF NOT EXISTS bidder_wallet TEXT;
ALTER TABLE bids ADD COLUMN IF NOT EXISTS tx_signature TEXT;
ALTER TABLE bids ADD COLUMN IF NOT EXISTS is_refunded BOOLEAN DEFAULT FALSE;
ALTER TABLE bids ADD COLUMN IF NOT EXISTS refund_tx TEXT;

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_bids_bidder_wallet ON bids(bidder_wallet) WHERE bidder_wallet IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bids_tx_signature ON bids(tx_signature) WHERE tx_signature IS NOT NULL;

-- ============================================
-- 4. NFT 구매 기록 테이블 (신규)
-- ============================================
CREATE TABLE IF NOT EXISTS nft_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nft_id UUID REFERENCES nfts(id) ON DELETE SET NULL,
  buyer_wallet TEXT NOT NULL,
  seller_wallet TEXT NOT NULL,
  price DECIMAL(18, 8) NOT NULL,
  tx_signature TEXT NOT NULL UNIQUE,
  purchase_type TEXT NOT NULL CHECK (purchase_type IN ('fixed', 'auction', 'randombox')),
  fee_amount DECIMAL(18, 8) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_purchases_buyer ON nft_purchases(buyer_wallet);
CREATE INDEX IF NOT EXISTS idx_purchases_seller ON nft_purchases(seller_wallet);
CREATE INDEX IF NOT EXISTS idx_purchases_nft ON nft_purchases(nft_id);
CREATE INDEX IF NOT EXISTS idx_purchases_created ON nft_purchases(created_at DESC);

-- RLS
ALTER TABLE nft_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view purchases"
  ON nft_purchases FOR SELECT
  USING (true);

CREATE POLICY "System can insert purchases"
  ON nft_purchases FOR INSERT
  WITH CHECK (true);

-- ============================================
-- 5. 경매 정산 예약 함수 (Cron용)
-- ============================================
CREATE OR REPLACE FUNCTION get_pending_auction_settlements()
RETURNS TABLE (
  auction_id UUID,
  nft_id UUID,
  nft_name TEXT,
  winner_wallet TEXT,
  final_price DECIMAL,
  seller_wallet TEXT,
  end_time TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id as auction_id,
    a.nft_id,
    n.name as nft_name,
    a.highest_bidder as winner_wallet,
    a.current_bid as final_price,
    a.seller_wallet,
    a.end_time
  FROM auctions a
  JOIN nfts n ON a.nft_id = n.id
  WHERE a.status = 'active'
    AND a.end_time < NOW()
    AND a.highest_bidder IS NOT NULL
  ORDER BY a.end_time ASC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. 스나이핑 방지 트리거 함수
-- ============================================
CREATE OR REPLACE FUNCTION check_auction_extension()
RETURNS TRIGGER AS $$
DECLARE
  five_minutes INTERVAL := '5 minutes';
  time_until_end INTERVAL;
BEGIN
  -- 새 입찰이 들어왔을 때만 실행
  IF TG_OP = 'UPDATE' AND NEW.current_bid > OLD.current_bid THEN
    -- 종료까지 남은 시간 계산
    time_until_end := NEW.end_time - NOW();

    -- 5분 이하이고, 최대 연장 횟수 미만인 경우
    IF time_until_end <= five_minutes
       AND time_until_end > '0 seconds'
       AND NEW.extension_count < NEW.max_extensions THEN
      -- 5분 연장
      NEW.end_time := NEW.end_time + five_minutes;
      NEW.extension_count := NEW.extension_count + 1;

      -- 로그 (optional)
      RAISE NOTICE 'Auction % extended by 5 minutes (extension #%)',
                   NEW.id, NEW.extension_count;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_auction_extension ON auctions;
CREATE TRIGGER trigger_auction_extension
  BEFORE UPDATE ON auctions
  FOR EACH ROW
  EXECUTE FUNCTION check_auction_extension();

-- ============================================
-- 7. 통계 뷰
-- ============================================
CREATE OR REPLACE VIEW nft_market_stats AS
SELECT
  COUNT(DISTINCT CASE WHEN is_listed THEN id END) as listed_count,
  COUNT(DISTINCT CASE WHEN NOT is_listed THEN id END) as sold_count,
  COALESCE(SUM(CASE WHEN is_listed THEN price END), 0) as total_listed_value,
  COALESCE(AVG(CASE WHEN is_listed THEN price END), 0) as avg_listed_price,
  (SELECT COUNT(*) FROM auctions WHERE status = 'active') as active_auctions,
  (SELECT COALESCE(SUM(price), 0) FROM nft_purchases) as total_volume
FROM nfts;

-- ============================================
-- 8. 권한 설정
-- ============================================
GRANT SELECT ON nft_market_stats TO anon;
GRANT SELECT ON nft_market_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_auction_settlements() TO authenticated;
