-- Lessons System Tables

-- Lessons table
CREATE TABLE IF NOT EXISTS lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  level VARCHAR(20) NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  thumbnail TEXT,
  read_time INTEGER DEFAULT 5,
  required_tier VARCHAR(50) NOT NULL CHECK (required_tier IN ('cadet', 'navigator', 'pilot', 'commander', 'admiral')),
  order_num INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lesson progress table
CREATE TABLE IF NOT EXISTS lesson_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lessons_level ON lessons(level);
CREATE INDEX IF NOT EXISTS idx_lessons_tier ON lessons(required_tier);
CREATE INDEX IF NOT EXISTS idx_lessons_order ON lessons(order_num);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson ON lesson_progress(lesson_id);

-- Enable RLS
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view lessons" ON lessons FOR SELECT USING (true);

CREATE POLICY "Users can view their progress" ON lesson_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their progress" ON lesson_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their progress" ON lesson_progress FOR UPDATE USING (auth.uid() = user_id);

-- Seed initial lessons data
INSERT INTO lessons (title, description, content, level, thumbnail, read_time, required_tier, order_num) VALUES

-- 초급 (Beginner) - Cadet 이상 접근
('암호화폐란 무엇인가?', '블록체인과 암호화폐의 기본 개념을 배웁니다.', '## 암호화폐의 정의

암호화폐(Cryptocurrency)는 **암호화 기술을 사용하여 보안이 유지되는 디지털 화폐**입니다.

### 주요 특징

1. **탈중앙화**: 중앙 기관 없이 운영됩니다
2. **투명성**: 모든 거래가 블록체인에 기록됩니다
3. **불변성**: 한번 기록된 데이터는 변경할 수 없습니다
4. **익명성**: 지갑 주소만으로 거래가 가능합니다

### 블록체인이란?

블록체인은 거래 정보를 담은 블록들이 체인처럼 연결된 분산 원장 기술입니다.

```
블록 1 → 블록 2 → 블록 3 → ...
```

각 블록에는 다음 정보가 포함됩니다:
- 거래 데이터
- 이전 블록의 해시값
- 타임스탬프
- 논스(Nonce)

### 왜 중요한가?

암호화폐는 금융의 미래를 바꿀 수 있는 혁신적인 기술입니다. 은행 없이도 전 세계 누구에게나 즉시 송금이 가능하고, 중개자 없이 자산을 직접 관리할 수 있습니다.',
'beginner', 'https://picsum.photos/seed/lesson1/800/400', 5, 'cadet', 1),

('지갑 만들기 가이드', '암호화폐를 보관할 지갑을 만드는 방법을 알아봅니다.', '## 암호화폐 지갑이란?

암호화폐 지갑은 **디지털 자산을 보관하고 관리하는 도구**입니다.

### 지갑의 종류

#### 1. 핫 월렛 (Hot Wallet)
- 인터넷에 연결된 지갑
- 편리하지만 해킹 위험 있음
- 예: MetaMask, Phantom, Trust Wallet

#### 2. 콜드 월렛 (Cold Wallet)
- 오프라인 지갑
- 보안이 뛰어남
- 예: Ledger, Trezor

### Phantom 지갑 만들기 (Solana)

1. **Chrome 확장 프로그램 설치**
   - phantom.app 방문
   - "Add to Chrome" 클릭

2. **새 지갑 생성**
   - "Create a new wallet" 선택
   - 비밀번호 설정

3. **시드 구문 저장** ⚠️ 매우 중요!
   - 12개 단어를 안전한 곳에 저장
   - 절대 다른 사람과 공유하지 마세요

4. **지갑 생성 완료!**
   - 공개 주소(Public Address) 확인
   - 이 주소로 암호화폐를 받을 수 있습니다

### 보안 팁

- 🔐 시드 구문은 오프라인에 보관
- ❌ 절대 화면 캡처하지 마세요
- ⚠️ 피싱 사이트 주의
- ✅ 공식 사이트에서만 다운로드',
'beginner', 'https://picsum.photos/seed/lesson2/800/400', 7, 'cadet', 2),

('첫 거래하기', '처음으로 암호화폐를 구매하고 전송하는 방법을 배웁니다.', '## 첫 거래 가이드

암호화폐를 구매하고 전송하는 방법을 단계별로 알아봅니다.

### 1. 거래소 선택하기

국내 주요 거래소:
- **업비트**: 국내 1위 거래량
- **빗썸**: 다양한 코인 지원
- **코인원**: 간편한 UI

해외 거래소:
- **바이낸스**: 세계 최대 거래소
- **코인베이스**: 초보자 친화적

### 2. 계정 만들기

1. 거래소 가입
2. 본인 인증 (KYC)
3. 보안 설정 (2FA 필수!)

### 3. 원화 입금

- 거래소에서 입금 계좌 확인
- 본인 명의 계좌에서 송금
- 보통 몇 분 내 반영

### 4. 암호화폐 구매

```
예: 10만원으로 비트코인 구매
1. BTC/KRW 마켓 선택
2. 매수 금액 입력: 100,000원
3. "시장가 매수" 클릭
4. 거래 완료!
```

### 5. 외부 지갑으로 전송

1. 지갑 주소 복사
2. 거래소에서 "출금" 선택
3. 주소 붙여넣기
4. 금액 입력 후 출금

⚠️ **주의**: 주소를 잘못 입력하면 자산을 잃을 수 있습니다!',
'beginner', 'https://picsum.photos/seed/lesson3/800/400', 8, 'cadet', 3),

('안전한 보관 방법', '암호화폐를 안전하게 보관하는 방법과 보안 팁을 알려드립니다.', '## 암호화폐 보안 가이드

자산을 안전하게 지키는 방법을 알아봅니다.

### 보안의 3요소

1. **시드 구문 관리**
2. **2단계 인증 (2FA)**
3. **피싱 방지**

### 시드 구문 보관 방법

#### ✅ 좋은 방법
- 종이에 적어서 금고에 보관
- 스테인리스 스틸 플레이트에 각인
- 여러 장소에 분산 보관

#### ❌ 나쁜 방법
- 스마트폰에 저장
- 클라우드에 업로드
- 스크린샷 찍기
- 다른 사람에게 공유

### 2단계 인증 설정

```
추천 앱:
- Google Authenticator
- Authy
- Microsoft Authenticator
```

SMS 인증보다 OTP 앱이 더 안전합니다!

### 피싱 사기 예방

1. **URL 항상 확인**
   - phantom.app ✅
   - phantomm.app ❌

2. **공식 채널만 사용**
   - 디스코드 DM 주의
   - "에어드랍" 사기 주의

3. **서명 요청 꼼꼼히 확인**
   - 무엇에 서명하는지 읽기
   - 의심되면 거절

### 자산 분산

> "모든 달걀을 한 바구니에 담지 마라"

- 거래용: 핫 월렛 (소액)
- 장기 보관: 콜드 월렛 (대부분)',
'beginner', 'https://picsum.photos/seed/lesson4/800/400', 6, 'cadet', 4),

-- 중급 (Intermediate) - Navigator 이상 접근
('차트 읽는 법', '캔들스틱 차트와 기본적인 기술적 분석을 배웁니다.', '## 차트 분석 기초

가격 차트를 읽고 분석하는 방법을 배웁니다.

### 캔들스틱 이해하기

```
    ┃  ← 윗꼬리 (고가)
  ┏━┻━┓
  ┃   ┃ ← 몸통
  ┗━┳━┛
    ┃  ← 아랫꼬리 (저가)
```

- **양봉 (녹색)**: 시가 < 종가 (상승)
- **음봉 (빨강)**: 시가 > 종가 (하락)

### 주요 캔들 패턴

#### 1. 도지 (Doji)
```
  ┃
━━╋━━
  ┃
```
시가 = 종가, 추세 전환 신호

#### 2. 망치형 (Hammer)
```
┏━┓
┗━┛
  ┃
  ┃
```
하락 후 반등 신호

#### 3. 역망치형 (Inverted Hammer)
```
  ┃
  ┃
┏━┓
┗━┛
```
상승 반전 가능성

### 지지선과 저항선

- **지지선**: 가격이 하락을 멈추는 가격대
- **저항선**: 가격이 상승을 멈추는 가격대

### 거래량의 중요성

> "거래량은 가격에 선행한다"

- 상승 + 높은 거래량 = 강한 상승
- 상승 + 낮은 거래량 = 약한 상승',
'intermediate', 'https://picsum.photos/seed/lesson5/800/400', 10, 'navigator', 5),

('DeFi 기초', '탈중앙화 금융의 핵심 개념과 프로토콜을 이해합니다.', '## DeFi란?

DeFi(Decentralized Finance)는 **블록체인 기반의 탈중앙화 금융 시스템**입니다.

### 기존 금융 vs DeFi

| 기존 금융 | DeFi |
|----------|------|
| 은행/기관 필요 | 스마트 컨트랙트 |
| 업무 시간 제한 | 24/7 운영 |
| 본인 인증 필요 | 지갑만 있으면 OK |
| 수수료 높음 | 상대적으로 낮음 |

### 주요 DeFi 서비스

#### 1. DEX (탈중앙화 거래소)
- Uniswap, Raydium, Jupiter
- 지갑 연결만으로 거래
- AMM(자동 마켓 메이커) 방식

#### 2. 렌딩 (Lending)
- Aave, Compound, Solend
- 암호화폐 예치 → 이자 수익
- 담보 대출 가능

#### 3. 이자 농사 (Yield Farming)
- 유동성 제공의 대가로 토큰 보상
- 높은 APY, 높은 위험

#### 4. 스테이블코인
- USDC, USDT, DAI
- 1달러 가치 유지
- DeFi의 기축통화 역할

### 주의사항

⚠️ **스마트 컨트랙트 리스크**
- 코드 버그 가능성
- 해킹 위험

⚠️ **비영구적 손실 (Impermanent Loss)**
- 유동성 제공 시 발생 가능
- 토큰 가격 변동에 따른 손실',
'intermediate', 'https://picsum.photos/seed/lesson6/800/400', 12, 'navigator', 6),

('NFT 이해하기', 'NFT의 개념과 활용 사례를 알아봅니다.', '## NFT란?

NFT(Non-Fungible Token)는 **대체 불가능한 토큰**입니다.

### 대체 가능 vs 대체 불가능

- **대체 가능**: 1비트코인 = 1비트코인 (동일)
- **대체 불가능**: 모나리자 ≠ 다른 그림 (고유)

### NFT의 특징

1. **고유성**: 각 NFT는 유일합니다
2. **소유권 증명**: 블록체인에 기록
3. **거래 가능**: 마켓플레이스에서 매매
4. **프로그래밍 가능**: 로열티 등 설정 가능

### NFT 활용 사례

#### 🎨 디지털 아트
- Beeple의 $69M 작품
- 디지털 아티스트의 새로운 수입원

#### 🎮 게임 아이템
- 캐릭터, 무기, 땅
- 게임 간 이동 가능

#### 🎵 음악
- 앨범 NFT
- 팬과의 직접 거래

#### 🎫 티켓/멤버십
- 위조 불가능
- 2차 거래 추적 가능

### NFT 마켓플레이스

- **OpenSea**: 최대 NFT 마켓
- **Magic Eden**: 솔라나 대표
- **Blur**: 트레이더용

### BeyondFleet NFT

BeyondFleet의 멤버십 NFT는:
- 등급별 혜택 제공
- 투표권 부여
- 커뮤니티 접근권',
'intermediate', 'https://picsum.photos/seed/lesson7/800/400', 8, 'navigator', 7),

('스테이킹 가이드', '스테이킹의 원리와 수익 창출 방법을 배웁니다.', '## 스테이킹이란?

스테이킹은 **암호화폐를 네트워크에 예치하여 보상을 받는 것**입니다.

### 작동 원리

```
1. 코인 예치 (Lock)
    ↓
2. 네트워크 검증 참여
    ↓
3. 보상 수령 (이자)
```

### PoS (Proof of Stake)

- 코인을 많이 예치할수록 검증 기회 증가
- 비트코인(PoW)보다 에너지 효율적
- 이더리움, 솔라나 등이 사용

### 스테이킹 방법

#### 1. 직접 스테이킹
- 노드 운영 필요
- 최소 수량 높음 (예: ETH 32개)
- 높은 보상, 높은 책임

#### 2. 위임 스테이킹
- 검증자에게 위임
- 적은 수량도 가능
- 수수료 발생

#### 3. 거래소 스테이킹
- 가장 간편
- 거래소가 대행
- 보상률 낮을 수 있음

### 주요 코인 스테이킹 보상

| 코인 | 연 수익률 |
|-----|----------|
| ETH | 4-5% |
| SOL | 6-7% |
| ADA | 4-5% |
| DOT | 12-15% |

### 리스크

⚠️ **락업 기간**
- 일정 기간 출금 불가
- 급락 시 대응 어려움

⚠️ **슬래싱**
- 검증자 잘못 시 패널티
- 스테이킹한 코인 일부 손실',
'intermediate', 'https://picsum.photos/seed/lesson8/800/400', 9, 'navigator', 8),

-- 고급 (Advanced) - Pilot 이상 접근
('기술적 분석 심화', '고급 기술적 분석 지표와 전략을 학습합니다.', '## 고급 기술적 분석

심화된 기술적 분석 도구를 배웁니다.

### 이동평균선 (MA)

#### 단순이동평균 (SMA)
```
SMA = (P1 + P2 + ... + Pn) / n
```

#### 지수이동평균 (EMA)
- 최근 가격에 더 높은 가중치
- SMA보다 빠른 반응

#### 골든크로스 & 데드크로스
- **골든크로스**: 단기 MA가 장기 MA 상향 돌파 → 매수 신호
- **데드크로스**: 단기 MA가 장기 MA 하향 돌파 → 매도 신호

### RSI (상대강도지수)

```
RSI = 100 - (100 / (1 + RS))
RS = 평균 상승폭 / 평균 하락폭
```

- **70 이상**: 과매수 (매도 고려)
- **30 이하**: 과매도 (매수 고려)

### MACD

```
MACD = 12일 EMA - 26일 EMA
Signal = MACD의 9일 EMA
```

- MACD > Signal: 상승 모멘텀
- MACD < Signal: 하락 모멘텀

### 볼린저 밴드

```
중심선 = 20일 SMA
상단밴드 = 중심선 + (2 × 표준편차)
하단밴드 = 중심선 - (2 × 표준편차)
```

- 밴드 수축: 변동성 감소, 큰 움직임 예고
- 밴드 확장: 변동성 증가

### 피보나치 되돌림

주요 레벨: 23.6%, 38.2%, 50%, 61.8%, 78.6%

> 61.8%는 "황금비율"로 가장 중요',
'advanced', 'https://picsum.photos/seed/lesson9/800/400', 15, 'pilot', 9),

('온체인 데이터 분석', '블록체인 데이터를 분석하여 시장을 읽는 방법을 배웁니다.', '## 온체인 분석

블록체인 데이터로 시장을 분석하는 방법을 배웁니다.

### 온체인 데이터란?

블록체인에 기록된 모든 거래 정보:
- 지갑 주소별 잔액
- 거래 내역
- 스마트 컨트랙트 활동

### 주요 온체인 지표

#### 1. 활성 주소 (Active Addresses)
- 네트워크 활동 지표
- 상승 → 관심 증가

#### 2. 거래소 유입/유출
```
거래소 유입 ↑ = 매도 압력 증가
거래소 유출 ↑ = 장기 보유 의사
```

#### 3. 고래 움직임
- 대량 보유자의 거래 추적
- 급격한 이동 = 시장 변동 예고

#### 4. SOPR (Spent Output Profit Ratio)
```
SOPR = 판매 가격 / 구매 가격
```
- SOPR > 1: 수익 실현
- SOPR < 1: 손실 실현

### 분석 도구

| 도구 | 특징 |
|-----|------|
| Glassnode | 가장 포괄적 |
| Nansen | 고래/펀드 추적 |
| Dune | 커스텀 대시보드 |
| Arkham | 지갑 레이블링 |

### 실전 활용

#### 바닥 신호
- 장기 보유자 축적 증가
- 거래소 유출 지속
- SOPR < 1 지속

#### 천장 신호
- 장기 보유자 매도 증가
- 거래소 유입 급증
- 레버리지 과열',
'advanced', 'https://picsum.photos/seed/lesson10/800/400', 12, 'pilot', 10),

('스마트 컨트랙트 이해', '스마트 컨트랙트의 작동 원리를 깊이 있게 이해합니다.', '## 스마트 컨트랙트란?

스마트 컨트랙트는 **블록체인에서 실행되는 자동화된 프로그램**입니다.

### 기본 개념

```
조건 충족 → 자동 실행 → 결과 기록
```

예시:
```
IF 입금액 >= 1 SOL
THEN NFT 전송
ELSE 트랜잭션 실패
```

### 주요 블록체인 비교

| 블록체인 | 언어 | 특징 |
|---------|------|------|
| Ethereum | Solidity | 가장 큰 생태계 |
| Solana | Rust | 빠른 속도, 낮은 수수료 |
| Polygon | Solidity | 이더리움 호환 |

### Solidity 기본 구조

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleStorage {
    uint256 private value;

    function set(uint256 _value) public {
        value = _value;
    }

    function get() public view returns (uint256) {
        return value;
    }
}
```

### 스마트 컨트랙트 활용

1. **토큰 발행**: ERC-20, SPL 토큰
2. **NFT**: ERC-721, Metaplex
3. **DeFi**: 대출, 스왑, 스테이킹
4. **DAO**: 탈중앙화 투표

### 보안 취약점

⚠️ **재진입 공격 (Reentrancy)**
- 함수 호출 중 재호출
- The DAO 해킹 사례

⚠️ **정수 오버플로우**
- 숫자 범위 초과
- SafeMath 사용으로 방지

⚠️ **접근 제어 미비**
- 권한 검증 누락
- onlyOwner 패턴 사용',
'advanced', 'https://picsum.photos/seed/lesson11/800/400', 14, 'pilot', 11),

('투자 전략과 포트폴리오', '체계적인 투자 전략과 포트폴리오 관리 방법을 배웁니다.', '## 암호화폐 투자 전략

체계적인 투자 방법을 배웁니다.

### 투자 원칙

1. **손실 감당 가능 금액만 투자**
2. **분산 투자**
3. **장기적 관점**
4. **감정적 결정 금지**

### 투자 전략 유형

#### 1. 적립식 투자 (DCA)
```
매월 일정 금액 투자
예: 매월 1일, 50만원 BTC 매수
```
- 평균 매수가 효과
- 시장 타이밍 불필요
- 감정 배제

#### 2. 가치 투자
- 저평가된 프로젝트 발굴
- 펀더멘털 분석
- 장기 보유

#### 3. 모멘텀 투자
- 상승 추세 따라가기
- 기술적 분석 활용
- 빠른 손절 중요

### 포트폴리오 구성 예시

#### 보수적 포트폴리오
```
BTC 50% | ETH 30% | 스테이블 20%
```

#### 균형 포트폴리오
```
BTC 40% | ETH 25% | 알트코인 25% | 스테이블 10%
```

#### 공격적 포트폴리오
```
BTC 20% | ETH 20% | 알트코인 50% | 스테이블 10%
```

### 리밸런싱

```
목표: BTC 50%, ETH 50%
현재: BTC 60%, ETH 40%
→ BTC 일부 매도, ETH 매수
```

- 분기별 또는 비중 ±10% 시 실행
- 규칙 기반 실행

### 리스크 관리

- **손절선 설정**: -10% ~ -20%
- **포지션 크기**: 전체의 5-10% 이하
- **레버리지 제한**: 가급적 사용 안함',
'advanced', 'https://picsum.photos/seed/lesson12/800/400', 13, 'pilot', 12);
