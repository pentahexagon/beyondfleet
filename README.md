# 🚀 BeyondFleet

> Beyond The Stars - 함께 가면 멀리 간다

암호화폐 커뮤니티 플랫폼으로, 실시간 시세 확인, 교육 콘텐츠, NFT 멤버십, 투명한 기부 시스템을 제공합니다.

## ✨ 주요 기능

- **실시간 시세**: CoinGecko API 기반 암호화폐 가격 정보
- **NFT 멤버십**: 등급별 혜택과 투표권 제공
- **교육 센터**: 초급부터 고급까지 단계별 학습
- **기부 시스템**: 커뮤니티 투표로 결정하는 투명한 기부

## 🛠️ 기술 스택

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Supabase (Auth, Database, Realtime)
- **API**: CoinGecko API
- **Deployment**: Vercel

## 🚀 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

```bash
cp .env.local.example .env.local
```

`.env.local` 파일을 열고 Supabase 설정을 추가하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Supabase 설정

Supabase 프로젝트에서 다음 테이블을 생성하세요:

```sql
-- Users 확장 테이블
create table public.profiles (
  id uuid references auth.users primary key,
  username text unique,
  avatar_url text,
  membership_tier text default 'cadet',
  vote_power integer default 1,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- RLS 정책 활성화
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );
```

### 4. 개발 서버 실행

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 확인하세요.

## 📁 프로젝트 구조

```
beyondfleet/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── auth/              # 인증 페이지
│   ├── prices/            # 시세 페이지
│   ├── membership/        # 멤버십 페이지
│   ├── giving/            # 기부 페이지
│   └── learn/             # 교육 페이지
├── components/            # React 컴포넌트
│   ├── ui/               # 공통 UI
│   ├── layout/           # 레이아웃
│   └── crypto/           # 암호화폐 관련
├── lib/                   # 유틸리티
│   ├── supabase/         # Supabase 클라이언트
│   └── coingecko.ts      # API 함수
└── types/                 # TypeScript 타입
```

## 🎨 NFT 멤버십 등급

| 등급 | 이름 | 투표권 | 주요 혜택 |
|------|------|--------|-----------|
| 🌱 | Cadet (훈련생) | 1표 | 기본 접근, 무료 |
| ⭐ | Navigator (항해사) | 2표 | 주간 리포트 |
| 🚀 | Pilot (조종사) | 3표 | 실시간 알림 |
| 🌟 | Commander (사령관) | 5표 | 1:1 멘토링 |
| 🌌 | Admiral (제독) | 10표 | VIP 모든 혜택 |

## ⚠️ 면책조항

본 플랫폼은 정보 제공 목적이며, 투자 조언이 아닙니다. 모든 투자 결정과 책임은 본인에게 있습니다.

## 📄 라이선스

MIT License
