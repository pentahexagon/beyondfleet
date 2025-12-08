# NFT 구매 시스템 설계

**작성일**: 2024-12-07
**상태**: 승인됨

---

## 요약

BeyondFleet NFT 마켓플레이스에 실제 온체인 NFT 구매 시스템을 구현한다.

### 핵심 결정사항

| 항목 | 결정 |
|------|------|
| 블록체인 | Solana Mainnet |
| NFT 표준 | Metaplex (mpl-token-metadata) |
| SDK | Metaplex Umi |
| 마켓플레이스 | Metaplex Auction House |
| 구매 방식 | 고정가 + 경매 |
| 트랜잭션 | Atomic (SOL ↔ NFT 동시 교환) |

---

## 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                    BeyondFleet NFT                       │
├─────────────────────────────────────────────────────────┤
│  Frontend (Next.js)                                     │
│  ├── NFT 마켓플레이스 UI                                 │
│  ├── Phantom/Solflare 지갑 연동                          │
│  └── 트랜잭션 서명 요청                                   │
├─────────────────────────────────────────────────────────┤
│  API Routes (Next.js)                                   │
│  ├── /api/nft/purchase - 고정가 구매                     │
│  ├── /api/nft/auction/* - 경매 관련                      │
│  └── 트랜잭션 검증 & DB 업데이트                          │
├─────────────────────────────────────────────────────────┤
│  Metaplex Auction House                                 │
│  ├── Listing (판매 등록)                                 │
│  ├── Bid (입찰)                                         │
│  └── Execute Sale (atomic 교환)                         │
├─────────────────────────────────────────────────────────┤
│  Solana Mainnet                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 고정가 구매 플로우

```
사용자                    Frontend                  API                     Solana
  │                         │                        │                        │
  ├─ "구매" 클릭 ──────────>│                        │                        │
  │                         ├─ 트랜잭션 생성 요청 ───>│                        │
  │                         │<─ unsigned TX ─────────┤                        │
  │<─ 지갑 서명 요청 ────────┤                        │                        │
  ├─ 서명 승인 ────────────>│                        │                        │
  │                         ├─ 서명된 TX 전송 ───────>│                        │
  │                         │                        ├─ TX 브로드캐스트 ──────>│
  │                         │                        │<─ TX 확인 ─────────────┤
  │                         │                        ├─ DB 업데이트            │
  │<─ 구매 완료 ─────────────┤<───────────────────────┤                        │
```

### Auction House 동작

1. **List**: 관리자가 NFT를 Auction House에 등록 (가격 설정)
2. **Buy**: 사용자가 구매 요청
3. **Execute Sale**: 1개의 atomic 트랜잭션으로 처리
   - SOL: Buyer → Seller
   - NFT: Seller → Buyer
   - Fee: → Treasury

---

## 경매 플로우

### 기본 흐름

1. **경매 생성** (관리자)
   - NFT + 시작가 + 종료시간 설정

2. **입찰** (Bid)
   - 사용자가 SOL로 입찰
   - Escrow에 SOL 예치
   - 더 높은 입찰 시 이전 입찰자 자동 환불

3. **경매 종료**
   - 최고 입찰자 → NFT 수령
   - 판매자 → SOL 수령
   - 수수료 → Treasury

### 스나이핑 방지

```
┌───────────────────────────────────────────────┐
│ 종료 5분 전 입찰 → 종료시간 5분 연장           │
│ (반복 가능, 최대 12회 = 1시간)                │
└───────────────────────────────────────────────┘

Timeline 예시:
──●────────●────────●────────●────────●──
 시작    입찰1    입찰2   종료5분전   새종료
                           입찰3→     +5분
```

---

## DB 스키마 변경

### auctions 테이블 수정

```sql
ALTER TABLE auctions ADD COLUMN IF NOT EXISTS original_end_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE auctions ADD COLUMN IF NOT EXISTS extension_count INTEGER DEFAULT 0;
ALTER TABLE auctions ADD COLUMN IF NOT EXISTS max_extensions INTEGER DEFAULT 12;

-- Auction House 관련
ALTER TABLE auctions ADD COLUMN IF NOT EXISTS auction_house_address TEXT;
ALTER TABLE auctions ADD COLUMN IF NOT EXISTS listing_receipt TEXT;
```

### 새 테이블: nft_purchases

```sql
CREATE TABLE nft_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nft_id UUID REFERENCES nfts(id),
  buyer_wallet TEXT NOT NULL,
  seller_wallet TEXT NOT NULL,
  price DECIMAL(18, 8) NOT NULL,
  tx_signature TEXT NOT NULL UNIQUE,
  purchase_type TEXT CHECK (purchase_type IN ('fixed', 'auction')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 파일 구조

```
lib/solana/
├── umi.ts              # Umi 인스턴스 설정
├── auction-house.ts    # Auction House 헬퍼 함수
└── transactions.ts     # 트랜잭션 빌더

app/api/nft/
├── purchase/
│   └── route.ts        # 고정가 구매 API
├── auction/
│   ├── route.ts        # 경매 목록 조회
│   ├── create/route.ts # 경매 생성 (관리자)
│   ├── bid/route.ts    # 입찰 + 스나이핑 방지
│   └── settle/route.ts # 경매 정산

components/nft/
├── BuyButton.tsx       # 즉시 구매 버튼
├── BidForm.tsx         # 입찰 폼
├── AuctionTimer.tsx    # 카운트다운 + 연장 표시
└── NFTCard.tsx         # NFT 카드

hooks/
└── useAuctionHouse.ts  # Auction House 훅
```

---

## 환경변수

```env
# Solana
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
TREASURY_WALLET=<프로젝트 지갑 주소>
AUCTION_HOUSE_ADDRESS=<생성 후 추가>

# Auction House 설정
SELLER_FEE_BASIS_POINTS=250  # 2.5% 수수료
```

---

## 구현 순서

1. Metaplex Umi 설정 (`lib/solana/umi.ts`)
2. Auction House 생성 스크립트
3. NFT 민팅 기능 (관리자)
4. 고정가 구매 API + UI
5. 경매 생성/입찰/정산 API
6. 스나이핑 방지 로직
7. 경매 UI (타이머, 입찰 폼)

---

## 리스크 & 대응

| 리스크 | 대응 |
|--------|------|
| RPC 불안정 | Helius/QuickNode 유료 RPC 사용 |
| 트랜잭션 실패 | 재시도 로직 + 사용자 알림 |
| 가격 변동 | SOL 가격 표시 + USD 환산 |
| 스마트 컨트랙트 버그 | Metaplex 공식 컨트랙트 사용 (검증됨) |
