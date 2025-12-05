'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Button from '@/components/ui/Button'
import { supabase } from '@/lib/supabase/client'
import { MembershipTier } from '@/types'
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  CheckCircle,
  Lock,
  BookOpen,
  Share2
} from 'lucide-react'

interface Lesson {
  id: string
  title: string
  description: string
  content: string
  level: 'beginner' | 'intermediate' | 'advanced'
  thumbnail: string
  read_time: number
  required_tier: MembershipTier
  order_num: number
}

const levelConfig = {
  beginner: {
    label: '초급',
    icon: '🌱',
    color: 'text-green-400',
    bg: 'bg-green-500/20',
  },
  intermediate: {
    label: '중급',
    icon: '📈',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/20',
  },
  advanced: {
    label: '고급',
    icon: '🚀',
    color: 'text-red-400',
    bg: 'bg-red-500/20',
  },
}

const tierOrder: MembershipTier[] = ['cadet', 'navigator', 'pilot', 'commander', 'admiral']

const tierLabels: Record<MembershipTier, string> = {
  cadet: '🌱 Cadet',
  navigator: '⭐ Navigator',
  pilot: '🚀 Pilot',
  commander: '🌟 Commander',
  admiral: '🌌 Admiral',
}

function canAccessLesson(userTier: MembershipTier, requiredTier: MembershipTier): boolean {
  const userLevel = tierOrder.indexOf(userTier)
  const requiredLevel = tierOrder.indexOf(requiredTier)
  return userLevel >= requiredLevel
}

// Simple markdown renderer
function renderMarkdown(content: string): string {
  return content
    // Headers
    .replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold text-white mt-6 mb-3">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold text-white mt-8 mb-4">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold text-white mt-8 mb-4">$1</h1>')
    // Bold & Italic
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Code blocks
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-space-800 rounded-lg p-4 my-4 overflow-x-auto"><code class="text-sm text-cyan-300">$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="bg-space-800 px-1.5 py-0.5 rounded text-cyan-300 text-sm">$1</code>')
    // Blockquotes
    .replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-purple-500 pl-4 my-4 text-gray-300 italic">$1</blockquote>')
    // Lists
    .replace(/^- (.*$)/gm, '<li class="ml-4 text-gray-300">• $1</li>')
    .replace(/^\d+\. (.*$)/gm, '<li class="ml-4 text-gray-300">$1</li>')
    // Tables (simple)
    .replace(/\| (.*) \|/g, (match) => {
      const cells = match.split('|').filter(c => c.trim())
      if (cells.some(c => c.includes('---'))) return ''
      return `<tr class="border-b border-space-700">${cells.map(c => `<td class="px-4 py-2 text-gray-300">${c.trim()}</td>`).join('')}</tr>`
    })
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-cyan-400 hover:underline" target="_blank">$1</a>')
    // Paragraphs
    .replace(/\n\n/g, '</p><p class="text-gray-300 leading-relaxed mb-4">')
    // Line breaks
    .replace(/\n/g, '<br/>')
}

export default function LessonDetailPage() {
  const params = useParams()
  const router = useRouter()
  const lessonId = params.id as string

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [allLessons, setAllLessons] = useState<Lesson[]>([])
  const [isCompleted, setIsCompleted] = useState(false)
  const [userTier, setUserTier] = useState<MembershipTier>('cadet')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)

  useEffect(() => {
    fetchLesson()
    fetchAllLessons()
    checkAuth()
  }, [lessonId])

  async function fetchLesson() {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single()

      if (error) throw error
      setLesson(data)
    } catch (error) {
      console.error('Error fetching lesson:', error)
      // 데모 데이터 사용
      const demoLesson = demoLessons.find(l => l.id === lessonId)
      if (demoLesson) {
        setLesson(demoLesson)
      }
    } finally {
      setLoading(false)
    }
  }

  async function fetchAllLessons() {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .order('order_num', { ascending: true })

      if (error) throw error
      setAllLessons(data || [])
    } catch (error) {
      setAllLessons(demoLessons)
    }
  }

  async function checkAuth() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setIsLoggedIn(true)
        setUserId(user.id)

        // 사용자 티어 가져오기
        const { data: profile } = await supabase
          .from('profiles')
          .select('membership_tier')
          .eq('id', user.id)
          .single()

        if (profile?.membership_tier) {
          setUserTier(profile.membership_tier)
        }

        // 완료 여부 확인
        const { data: progress } = await supabase
          .from('lesson_progress')
          .select('completed')
          .eq('user_id', user.id)
          .eq('lesson_id', lessonId)
          .single()

        if (progress?.completed) {
          setIsCompleted(true)
        }
      }
    } catch (error) {
      console.error('Auth check error:', error)
    }
  }

  async function handleComplete() {
    if (!isLoggedIn || !userId) {
      alert('로그인이 필요합니다.')
      return
    }

    setCompleting(true)
    try {
      const { error } = await supabase
        .from('lesson_progress')
        .upsert({
          user_id: userId,
          lesson_id: lessonId,
          completed: true,
          completed_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,lesson_id'
        })

      if (error) throw error
      setIsCompleted(true)
    } catch (error) {
      console.error('Error marking complete:', error)
      // 데모 모드에서는 그냥 완료 처리
      setIsCompleted(true)
    } finally {
      setCompleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-space-700 rounded w-1/4 mb-8" />
            <div className="h-64 bg-space-700 rounded-xl mb-8" />
            <div className="h-6 bg-space-700 rounded w-3/4 mb-4" />
            <div className="h-4 bg-space-700 rounded w-full mb-2" />
            <div className="h-4 bg-space-700 rounded w-full mb-2" />
            <div className="h-4 bg-space-700 rounded w-2/3" />
          </div>
        </div>
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="min-h-screen py-8 px-4 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">강의를 찾을 수 없습니다</h1>
          <Link href="/learn">
            <Button>강의 목록으로</Button>
          </Link>
        </div>
      </div>
    )
  }

  const isLocked = !canAccessLesson(userTier, lesson.required_tier)
  const config = levelConfig[lesson.level]

  // 이전/다음 강의 찾기
  const currentIndex = allLessons.findIndex(l => l.id === lessonId)
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null

  if (isLocked) {
    return (
      <div className="min-h-screen py-8 px-4 flex items-center justify-center">
        <div className="glass rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-purple-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">{lesson.title}</h1>
          <p className="text-gray-400 mb-6">
            이 강의는 <span className="text-purple-300 font-medium">{tierLabels[lesson.required_tier]}</span> 이상
            멤버만 접근할 수 있습니다.
          </p>
          <div className="flex gap-3">
            <Link href="/learn" className="flex-1">
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                목록으로
              </Button>
            </Link>
            <Link href="/membership" className="flex-1">
              <Button className="w-full">
                멤버십 보기
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link href="/learn" className="inline-flex items-center text-gray-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          강의 목록
        </Link>

        {/* Hero Image */}
        <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden mb-8">
          <Image
            src={lesson.thumbnail || 'https://picsum.photos/seed/lesson/1200/600'}
            alt={lesson.title}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-space-900 via-space-900/50 to-transparent" />

          {/* Completed Badge */}
          {isCompleted && (
            <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-full flex items-center gap-2 animate-bounce-once">
              <CheckCircle className="w-5 h-5" />
              학습 완료
            </div>
          )}
        </div>

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <span className={`px-3 py-1 ${config.bg} ${config.color} text-sm rounded-full flex items-center gap-1`}>
            {config.icon} {config.label}
          </span>
          <span className="flex items-center text-gray-400 text-sm">
            <Clock className="w-4 h-4 mr-1" />
            {lesson.read_time}분 소요
          </span>
          <span className="flex items-center text-gray-400 text-sm">
            <BookOpen className="w-4 h-4 mr-1" />
            강의 {lesson.order_num}
          </span>
        </div>

        {/* Title & Description */}
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
          {lesson.title}
        </h1>
        <p className="text-xl text-gray-400 mb-8">
          {lesson.description}
        </p>

        {/* Content */}
        <div className="glass rounded-2xl p-6 md:p-10 mb-8">
          <article
            className="prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: `<p class="text-gray-300 leading-relaxed mb-4">${renderMarkdown(lesson.content)}</p>` }}
          />
        </div>

        {/* Complete Button */}
        <div className="glass rounded-xl p-6 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white">
              {isCompleted ? '학습을 완료했습니다!' : '이 강의를 완료하셨나요?'}
            </h3>
            <p className="text-gray-400 text-sm">
              {isCompleted
                ? '다음 강의를 계속 진행해보세요.'
                : '완료 버튼을 눌러 진행률을 업데이트하세요.'}
            </p>
          </div>

          {isCompleted ? (
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle className="w-6 h-6" />
              <span className="font-medium">완료됨</span>
            </div>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={completing}
              className="whitespace-nowrap"
            >
              {completing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  처리 중...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  학습 완료
                </>
              )}
            </Button>
          )}
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-4">
          {prevLesson ? (
            <Link href={`/learn/${prevLesson.id}`} className="flex-1">
              <div className="glass rounded-xl p-4 hover:bg-space-700/50 transition-colors h-full">
                <div className="flex items-center text-gray-400 text-sm mb-2">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  이전 강의
                </div>
                <h4 className="text-white font-medium line-clamp-1">{prevLesson.title}</h4>
              </div>
            </Link>
          ) : (
            <div className="flex-1" />
          )}

          {nextLesson ? (
            <Link href={`/learn/${nextLesson.id}`} className="flex-1">
              <div className="glass rounded-xl p-4 hover:bg-space-700/50 transition-colors h-full text-right">
                <div className="flex items-center justify-end text-gray-400 text-sm mb-2">
                  다음 강의
                  <ArrowRight className="w-4 h-4 ml-1" />
                </div>
                <h4 className="text-white font-medium line-clamp-1">{nextLesson.title}</h4>
              </div>
            </Link>
          ) : (
            <Link href="/learn" className="flex-1">
              <div className="glass rounded-xl p-4 hover:bg-space-700/50 transition-colors h-full text-right">
                <div className="flex items-center justify-end text-gray-400 text-sm mb-2">
                  모든 강의 완료!
                </div>
                <h4 className="text-white font-medium">목록으로 돌아가기</h4>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

// 데모 데이터
const demoLessons: Lesson[] = [
  {
    id: '1',
    title: '암호화폐란 무엇인가?',
    description: '블록체인과 암호화폐의 기본 개념을 배웁니다.',
    content: `## 암호화폐의 정의

암호화폐(Cryptocurrency)는 **암호화 기술을 사용하여 보안이 유지되는 디지털 화폐**입니다.

### 주요 특징

1. **탈중앙화**: 중앙 기관 없이 운영됩니다
2. **투명성**: 모든 거래가 블록체인에 기록됩니다
3. **불변성**: 한번 기록된 데이터는 변경할 수 없습니다
4. **익명성**: 지갑 주소만으로 거래가 가능합니다

### 블록체인이란?

블록체인은 거래 정보를 담은 블록들이 체인처럼 연결된 분산 원장 기술입니다.

\`\`\`
블록 1 → 블록 2 → 블록 3 → ...
\`\`\`

각 블록에는 다음 정보가 포함됩니다:
- 거래 데이터
- 이전 블록의 해시값
- 타임스탬프
- 논스(Nonce)

### 왜 중요한가?

암호화폐는 금융의 미래를 바꿀 수 있는 혁신적인 기술입니다. 은행 없이도 전 세계 누구에게나 즉시 송금이 가능하고, 중개자 없이 자산을 직접 관리할 수 있습니다.`,
    level: 'beginner',
    thumbnail: 'https://picsum.photos/seed/lesson1/800/400',
    read_time: 5,
    required_tier: 'cadet',
    order_num: 1,
  },
  {
    id: '2',
    title: '지갑 만들기 가이드',
    description: '암호화폐를 보관할 지갑을 만드는 방법을 알아봅니다.',
    content: `## 암호화폐 지갑이란?

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

3. **시드 구문 저장**
   - 12개 단어를 안전한 곳에 저장
   - 절대 다른 사람과 공유하지 마세요

4. **지갑 생성 완료!**
   - 공개 주소(Public Address) 확인
   - 이 주소로 암호화폐를 받을 수 있습니다`,
    level: 'beginner',
    thumbnail: 'https://picsum.photos/seed/lesson2/800/400',
    read_time: 7,
    required_tier: 'cadet',
    order_num: 2,
  },
  {
    id: '3',
    title: '첫 거래하기',
    description: '처음으로 암호화폐를 구매하고 전송하는 방법을 배웁니다.',
    content: `## 첫 거래 가이드

암호화폐를 구매하고 전송하는 방법을 단계별로 알아봅니다.

### 1. 거래소 선택하기

국내 주요 거래소:
- **업비트**: 국내 1위 거래량
- **빗썸**: 다양한 코인 지원
- **코인원**: 간편한 UI

### 2. 계정 만들기

1. 거래소 가입
2. 본인 인증 (KYC)
3. 보안 설정 (2FA 필수!)

### 3. 원화 입금

- 거래소에서 입금 계좌 확인
- 본인 명의 계좌에서 송금
- 보통 몇 분 내 반영`,
    level: 'beginner',
    thumbnail: 'https://picsum.photos/seed/lesson3/800/400',
    read_time: 8,
    required_tier: 'cadet',
    order_num: 3,
  },
  {
    id: '4',
    title: '안전한 보관 방법',
    description: '암호화폐를 안전하게 보관하는 방법과 보안 팁을 알려드립니다.',
    content: `## 암호화폐 보안 가이드

자산을 안전하게 지키는 방법을 알아봅니다.

### 보안의 3요소

1. **시드 구문 관리**
2. **2단계 인증 (2FA)**
3. **피싱 방지**

### 시드 구문 보관 방법

- 종이에 적어서 금고에 보관
- 스테인리스 스틸 플레이트에 각인
- 여러 장소에 분산 보관`,
    level: 'beginner',
    thumbnail: 'https://picsum.photos/seed/lesson4/800/400',
    read_time: 6,
    required_tier: 'cadet',
    order_num: 4,
  },
  {
    id: '5',
    title: '차트 읽는 법',
    description: '캔들스틱 차트와 기본적인 기술적 분석을 배웁니다.',
    content: `## 차트 분석 기초

가격 차트를 읽고 분석하는 방법을 배웁니다.

### 캔들스틱 이해하기

- **양봉 (녹색)**: 시가 < 종가 (상승)
- **음봉 (빨강)**: 시가 > 종가 (하락)

### 주요 캔들 패턴

1. **도지 (Doji)**: 시가 = 종가, 추세 전환 신호
2. **망치형 (Hammer)**: 하락 후 반등 신호
3. **역망치형 (Inverted Hammer)**: 상승 반전 가능성`,
    level: 'intermediate',
    thumbnail: 'https://picsum.photos/seed/lesson5/800/400',
    read_time: 10,
    required_tier: 'navigator',
    order_num: 5,
  },
  {
    id: '6',
    title: 'DeFi 기초',
    description: '탈중앙화 금융의 핵심 개념과 프로토콜을 이해합니다.',
    content: `## DeFi란?

DeFi(Decentralized Finance)는 **블록체인 기반의 탈중앙화 금융 시스템**입니다.

### 주요 DeFi 서비스

1. **DEX (탈중앙화 거래소)**: Uniswap, Raydium, Jupiter
2. **렌딩 (Lending)**: Aave, Compound, Solend
3. **이자 농사 (Yield Farming)**: 유동성 제공 보상
4. **스테이블코인**: USDC, USDT, DAI`,
    level: 'intermediate',
    thumbnail: 'https://picsum.photos/seed/lesson6/800/400',
    read_time: 12,
    required_tier: 'navigator',
    order_num: 6,
  },
  {
    id: '7',
    title: 'NFT 이해하기',
    description: 'NFT의 개념과 활용 사례를 알아봅니다.',
    content: `## NFT란?

NFT(Non-Fungible Token)는 **대체 불가능한 토큰**입니다.

### NFT의 특징

1. **고유성**: 각 NFT는 유일합니다
2. **소유권 증명**: 블록체인에 기록
3. **거래 가능**: 마켓플레이스에서 매매
4. **프로그래밍 가능**: 로열티 등 설정 가능`,
    level: 'intermediate',
    thumbnail: 'https://picsum.photos/seed/lesson7/800/400',
    read_time: 8,
    required_tier: 'navigator',
    order_num: 7,
  },
  {
    id: '8',
    title: '스테이킹 가이드',
    description: '스테이킹의 원리와 수익 창출 방법을 배웁니다.',
    content: `## 스테이킹이란?

스테이킹은 **암호화폐를 네트워크에 예치하여 보상을 받는 것**입니다.

### 스테이킹 방법

1. **직접 스테이킹**: 노드 운영 필요
2. **위임 스테이킹**: 검증자에게 위임
3. **거래소 스테이킹**: 가장 간편`,
    level: 'intermediate',
    thumbnail: 'https://picsum.photos/seed/lesson8/800/400',
    read_time: 9,
    required_tier: 'navigator',
    order_num: 8,
  },
  {
    id: '9',
    title: '기술적 분석 심화',
    description: '고급 기술적 분석 지표와 전략을 학습합니다.',
    content: `## 고급 기술적 분석

심화된 기술적 분석 도구를 배웁니다.

### 이동평균선 (MA)

- **단순이동평균 (SMA)**
- **지수이동평균 (EMA)**
- **골든크로스 & 데드크로스**

### RSI (상대강도지수)

- 70 이상: 과매수 (매도 고려)
- 30 이하: 과매도 (매수 고려)`,
    level: 'advanced',
    thumbnail: 'https://picsum.photos/seed/lesson9/800/400',
    read_time: 15,
    required_tier: 'pilot',
    order_num: 9,
  },
  {
    id: '10',
    title: '온체인 데이터 분석',
    description: '블록체인 데이터를 분석하여 시장을 읽는 방법을 배웁니다.',
    content: `## 온체인 분석

블록체인 데이터로 시장을 분석하는 방법을 배웁니다.

### 주요 온체인 지표

1. **활성 주소 (Active Addresses)**
2. **거래소 유입/유출**
3. **고래 움직임**
4. **SOPR (Spent Output Profit Ratio)**`,
    level: 'advanced',
    thumbnail: 'https://picsum.photos/seed/lesson10/800/400',
    read_time: 12,
    required_tier: 'pilot',
    order_num: 10,
  },
  {
    id: '11',
    title: '스마트 컨트랙트 이해',
    description: '스마트 컨트랙트의 작동 원리를 깊이 있게 이해합니다.',
    content: `## 스마트 컨트랙트란?

스마트 컨트랙트는 **블록체인에서 실행되는 자동화된 프로그램**입니다.

### 기본 개념

조건 충족 → 자동 실행 → 결과 기록

### 스마트 컨트랙트 활용

1. **토큰 발행**: ERC-20, SPL 토큰
2. **NFT**: ERC-721, Metaplex
3. **DeFi**: 대출, 스왑, 스테이킹
4. **DAO**: 탈중앙화 투표`,
    level: 'advanced',
    thumbnail: 'https://picsum.photos/seed/lesson11/800/400',
    read_time: 14,
    required_tier: 'pilot',
    order_num: 11,
  },
  {
    id: '12',
    title: '투자 전략과 포트폴리오',
    description: '체계적인 투자 전략과 포트폴리오 관리 방법을 배웁니다.',
    content: `## 암호화폐 투자 전략

체계적인 투자 방법을 배웁니다.

### 투자 원칙

1. **손실 감당 가능 금액만 투자**
2. **분산 투자**
3. **장기적 관점**
4. **감정적 결정 금지**

### 투자 전략 유형

1. **적립식 투자 (DCA)**: 매월 일정 금액 투자
2. **가치 투자**: 저평가된 프로젝트 발굴
3. **모멘텀 투자**: 상승 추세 따라가기`,
    level: 'advanced',
    thumbnail: 'https://picsum.photos/seed/lesson12/800/400',
    read_time: 13,
    required_tier: 'pilot',
    order_num: 12,
  },
]
