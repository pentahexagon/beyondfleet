# BeyondFleet 보안 점검 리포트

**점검일**: 2025-12-07
**점검자**: Claude Code Security Audit

---

## 요약

| 항목 | 상태 | 위험도 | 조치 |
|------|------|--------|------|
| Supabase RLS | ⚠️ 일부 문제 | 높음 | 수정 완료 |
| API Rate Limiting | ✅ 구현됨 | - | 신규 추가 |
| 입력값 검증/XSS | ✅ 구현됨 | - | 신규 추가 |
| CSRF 토큰 | ✅ 구현됨 | - | 신규 추가 |
| 보안 헤더 | ✅ 구현됨 | - | 신규 추가 |
| 환경변수 | ✅ 양호 | - | 확인 완료 |
| 의존성 보안 | ✅ 양호 | - | 취약점 없음 |
| 에러 처리 | ✅ 구현됨 | - | 신규 추가 |

---

## 1. Supabase RLS (Row Level Security)

### 발견된 문제

#### 🔴 높은 위험도
1. **watchlist 테이블**: RLS가 명시적으로 비활성화됨
   - 파일: `supabase/migrations/20241205_watchlist_v2.sql`
   - 문제: `ALTER TABLE watchlist DISABLE ROW LEVEL SECURITY;`
   - 영향: 모든 사용자가 다른 사용자의 watchlist 데이터에 접근 가능

2. **journal_entries 테이블**: RLS가 명시적으로 비활성화됨
   - 파일: `supabase/migrations/20241205_journal_simple.sql`
   - 문제: `ALTER TABLE journal_entries DISABLE ROW LEVEL SECURITY;`
   - 영향: 개인 저널 데이터가 노출될 수 있음

#### ✅ 양호한 테이블
- `profiles`: RLS 활성화, 적절한 정책 설정
- `price_alerts`: RLS 활성화, user_id 기반 접근 제어
- `nfts`: RLS 활성화, 읽기는 공개, 수정은 소유자만
- `auctions`: RLS 활성화
- `bids`: RLS 활성화
- `news`: RLS 활성화, 공개 읽기 허용
- `education`: RLS 활성화
- `donations`: RLS 활성화
- `votes`: RLS 활성화

### 조치 사항
✅ **수정 마이그레이션 생성**: `supabase/migrations/20241207_security_rls_fix.sql`
- watchlist, journal_entries 테이블에 RLS 활성화
- user_id 및 wallet_address 기반 접근 정책 추가
- 공개 저널 엔트리만 전체 공개 허용

**적용 방법**:
```bash
# Supabase Studio에서 SQL Editor로 실행
# 또는 supabase db push 명령 사용
```

---

## 2. API Rate Limiting

### 구현 완료 ✅

**새로 추가된 파일**: `lib/security/rate-limiter.ts`

| 엔드포인트 | 제한 | 윈도우 |
|-----------|------|--------|
| /api/* (기본) | 60회 | 1분 |
| /api/auth/* | 10회 | 1분 |
| /api/ai/* | 5회 | 1분 |
| /api/whale/* | 30회 | 1분 |
| /api/cron/* | 5회 | 1분 |

**응답 헤더**:
- `X-RateLimit-Limit`: 최대 요청 수
- `X-RateLimit-Remaining`: 남은 요청 수
- `X-RateLimit-Reset`: 리셋 시간 (Unix timestamp)
- `Retry-After`: 429 응답 시 대기 시간

---

## 3. 입력값 검증 및 XSS 방어

### 구현 완료 ✅

**새로 추가된 파일**: `lib/security/sanitize.ts`

**기능**:
- `sanitizeHTML()`: HTML 콘텐츠 정화 (DOMPurify 사용)
- `sanitizeText()`: 평문 텍스트 정화
- `sanitizeEmail()`: 이메일 검증 및 정규화
- `isValidUUID()`: UUID 형식 검증
- `isValidWalletAddress()`: 지갑 주소 검증 (ETH/SOL)
- `sanitizeCoinId()`: 코인 ID 검증
- `sanitizeNumber()`: 숫자 입력 검증
- `sanitizePagination()`: 페이지네이션 파라미터 검증

**XSS 방어 적용**:
- `app/coin/[id]/page.tsx`: 코인 설명에 sanitizeHTML 적용
- `app/learn/[id]/page.tsx`: 학습 콘텐츠에 sanitizeHTML 적용

### dangerouslySetInnerHTML 사용 현황
| 파일 | 용도 | 조치 |
|------|------|------|
| `app/coin/[id]/page.tsx` | 코인 설명 표시 | ✅ sanitizeHTML 적용 |
| `app/learn/[id]/page.tsx` | 학습 콘텐츠 표시 | ✅ sanitizeHTML 적용 |
| `app/admin/learn/page.tsx` | 미리보기 (관리자) | 내부 사용으로 위험도 낮음 |

---

## 4. CSRF 토큰

### 구현 완료 ✅

**새로 추가된 파일**: `lib/security/csrf.ts`

**구현 방식**: Double-Submit Cookie 패턴

**특징**:
- 64자 암호화 보안 토큰 생성
- 쿠키와 헤더 값 비교 검증
- 상수 시간 비교로 타이밍 공격 방지
- GET, HEAD, OPTIONS 요청은 검증 제외
- /api/auth, /api/cron, /api/webhook은 CSRF 검증 제외

**클라이언트 사용 방법**:
```javascript
// CSRF 토큰을 쿠키에서 읽어 헤더에 포함
const csrfToken = document.cookie
  .split('; ')
  .find(row => row.startsWith('csrf-token='))
  ?.split('=')[1];

fetch('/api/endpoint', {
  method: 'POST',
  headers: {
    'x-csrf-token': csrfToken
  }
});
```

---

## 5. 보안 헤더

### 구현 완료 ✅

**수정된 파일**:
- `middleware.ts`: 동적 헤더 적용
- `next.config.mjs`: 정적 헤더 설정

**적용된 헤더**:

| 헤더 | 값 | 효과 |
|------|-----|------|
| X-Frame-Options | DENY | Clickjacking 방지 |
| X-Content-Type-Options | nosniff | MIME 스니핑 방지 |
| X-XSS-Protection | 1; mode=block | 구형 브라우저 XSS 방지 |
| Referrer-Policy | strict-origin-when-cross-origin | 리퍼러 정보 보호 |
| Permissions-Policy | camera=(), microphone=()... | 기능 제한 |
| Content-Security-Policy | (상세 설정) | XSS/인젝션 방지 |
| Strict-Transport-Security | max-age=31536000... | HTTPS 강제 (프로덕션) |

**CSP 상세 설정**:
```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https: blob:;
connect-src 'self' https://*.supabase.co https://api.coingecko.com ...;
frame-ancestors 'none';
```

---

## 6. 환경변수 보안

### 상태: ✅ 양호

**.gitignore 확인**:
```
.env*.local
.env
```
→ 모든 환경변수 파일이 gitignore에 포함됨

**클라이언트 노출 변수**:
| 변수 | 노출 | 위험도 | 비고 |
|------|------|--------|------|
| NEXT_PUBLIC_SUPABASE_URL | 예 | 낮음 | 공개 URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | 예 | 낮음 | RLS로 보호됨 |
| NEXT_PUBLIC_SITE_URL | 예 | 없음 | 사이트 URL |
| SUPABASE_SERVICE_ROLE_KEY | 아니오 | - | 서버 전용 |
| ANTHROPIC_API_KEY | 아니오 | - | 서버 전용 |
| WHALE_ALERT_API_KEY | 아니오 | - | 서버 전용 |
| CRON_SECRET | 아니오 | - | 서버 전용 |

**권장사항**:
- ✅ 민감한 키는 모두 서버 사이드에서만 사용
- ✅ NEXT_PUBLIC_ 접두사가 있는 변수만 클라이언트에 노출

---

## 7. 의존성 보안

### 상태: ✅ 양호

```bash
$ npm audit
found 0 vulnerabilities
```

**주요 의존성 버전**:
- next: ^15.0.5
- @supabase/supabase-js: ^2.45.0
- wagmi: ^2.12.0
- viem: ^2.40.3

**권장사항**:
- 정기적으로 `npm audit` 실행
- 보안 패치 시 신속한 업데이트
- Dependabot 또는 Snyk 연동 권장

---

## 8. 에러 처리

### 구현 완료 ✅

**새로 추가된 파일**: `lib/security/error-handler.ts`

**기능**:
- 프로덕션에서 상세 에러 메시지 숨김
- 사용자 친화적 에러 메시지 반환
- 내부 에러 코드 → HTTP 상태 코드 매핑
- 서버 로깅 지원

**사용 방법**:
```typescript
import { toSafeError, logError, createErrorResponse } from '@/lib/security/error-handler'

try {
  // ...
} catch (error) {
  logError(error, { endpoint: '/api/example' })
  return NextResponse.json(
    createErrorResponse(error),
    { status: toSafeError(error).statusCode }
  )
}
```

---

## 추가 보안 권장사항

### 즉시 적용 필요

1. **RLS 마이그레이션 실행**
   ```bash
   # Supabase SQL Editor에서 실행
   # supabase/migrations/20241207_security_rls_fix.sql
   ```

2. **환경변수 확인**
   - 프로덕션에서 모든 필수 환경변수 설정 확인
   - CRON_SECRET 강력한 값으로 설정

### 중기 권장사항

1. **Redis 기반 Rate Limiting**
   - 현재: 인메모리 저장 (서버리스 환경에서 제한적)
   - 권장: Upstash Redis 또는 Vercel KV 사용

2. **로깅 서비스 연동**
   - Sentry, LogRocket 등 에러 추적 서비스 연동
   - 보안 이벤트 모니터링

3. **API 인증 강화**
   - 일부 API(whale POST)에 관리자 인증 추가 필요
   - JWT 토큰 검증 강화

### 장기 권장사항

1. **보안 테스트**
   - 정기적인 침투 테스트
   - OWASP Top 10 점검

2. **2단계 인증**
   - 관리자 계정에 2FA 적용

3. **감사 로그**
   - 중요 작업에 대한 감사 로그 구현

---

## 새로 생성된 파일 목록

```
lib/security/
├── csrf.ts           # CSRF 토큰 관리
├── error-handler.ts  # 안전한 에러 처리
├── rate-limiter.ts   # API 속도 제한
└── sanitize.ts       # 입력값 정화

middleware.ts         # 보안 미들웨어 (신규)

supabase/migrations/
└── 20241207_security_rls_fix.sql  # RLS 수정 마이그레이션
```

---

## 수정된 파일 목록

| 파일 | 변경 내용 |
|------|----------|
| `next.config.mjs` | 보안 헤더 추가, 소스맵 비활성화 |
| `app/coin/[id]/page.tsx` | XSS 방어 (sanitizeHTML) |
| `app/learn/[id]/page.tsx` | XSS 방어 (sanitizeHTML) |
| `package.json` | isomorphic-dompurify 추가 |

---

**보안 점검 완료**

추가 질문이나 조치가 필요하시면 말씀해주세요.
