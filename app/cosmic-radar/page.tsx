'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Building2,
  Fish,
  Radio,
  Telescope,
  Crown,
  Lock,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ExternalLink,
  Calendar,
  AlertTriangle,
  MessageSquare
} from 'lucide-react'
import { MembershipTier, MEMBERSHIP_TIERS } from '@/types'

// 접근 권한 레벨 정의
const ACCESS_LEVELS: Record<MembershipTier, number> = {
  cadet: 0,
  navigator: 1,
  pilot: 2,
  commander: 3,
  admiral: 4,
}

// 섹션별 필요 권한
const SECTION_ACCESS = {
  institution: 'navigator' as MembershipTier,
  whale: 'navigator' as MembershipTier,
  signal: 'pilot' as MembershipTier,
  prediction: 'pilot' as MembershipTier,
  admiral: 'admiral' as MembershipTier,
}

// 더미 데이터
const institutionData = {
  btc: [
    { name: 'Strategy (MicroStrategy)', amount: '478,740 BTC', change: '+27,200', trend: 'up' },
    { name: 'Tesla', amount: '9,720 BTC', change: '0', trend: 'neutral' },
    { name: 'Marathon Digital', amount: '44,893 BTC', change: '+1,200', trend: 'up' },
    { name: 'Riot Platforms', amount: '17,722 BTC', change: '+850', trend: 'up' },
  ],
  eth: [
    { name: 'BitMine Immersion', amount: '1,250 ETH', change: '+180', trend: 'up' },
    { name: 'SharpLink Gaming', amount: '890 ETH', change: '-50', trend: 'down' },
  ],
  sol: [
    { name: 'Forward Industries', amount: '520,000 SOL', change: '+45,000', trend: 'up' },
    { name: 'Upexi', amount: '380,000 SOL', change: '+120,000', trend: 'up' },
  ],
  xrp: [
    { name: 'Trident Digital', amount: '2.5M XRP', change: '+500K', trend: 'up' },
    { name: 'VivoPower', amount: '1.8M XRP', change: '0', trend: 'neutral' },
  ],
}

const whaleMovements = [
  { icon: '🐋', amount: '10,000 BTC', from: 'Unknown Wallet', to: 'Binance', time: '5분 전', type: 'exchange_in' },
  { icon: '🐋', amount: '5,200 ETH', from: 'Coinbase', to: 'Unknown Wallet', time: '12분 전', type: 'exchange_out' },
  { icon: '🦈', amount: '2,500,000 SOL', from: 'Kraken', to: 'Cold Wallet', time: '28분 전', type: 'exchange_out' },
  { icon: '🐋', amount: '15,000,000 XRP', from: 'Unknown Wallet', to: 'Upbit', time: '45분 전', type: 'exchange_in' },
  { icon: '🦈', amount: '3,800 BTC', from: 'Binance', to: 'Cold Wallet', time: '1시간 전', type: 'exchange_out' },
]

const signalReport = {
  sentiment: 72,
  sentimentLabel: '탐욕',
  technicalSummary: '비트코인은 현재 $100K 지지선에서 강한 매수세를 보이고 있습니다. RSI 62로 과매수 구간 진입 전 상태이며, MACD 골든크로스 발생.',
  keyLevels: {
    support: '$98,500',
    resistance: '$105,000',
  },
  aiAnalysis: 'AI 분석에 따르면 현재 시장은 기관 매수세 유입과 함께 강세 모멘텀을 유지하고 있습니다. 단기 조정 가능성이 있으나 중장기 상승 추세는 견고합니다.',
}

const predictions = [
  { period: '이번 주', prediction: '상승', confidence: 78, target: '$105,000' },
  { period: '이번 달', prediction: '상승', confidence: 65, target: '$120,000' },
]

const upcomingEvents = [
  { date: '12월 11일', event: 'CPI 발표', impact: 'high' },
  { date: '12월 18일', event: 'FOMC 회의', impact: 'high' },
  { date: '12월 25일', event: '크리스마스 (거래량 감소 예상)', impact: 'medium' },
]

// 잠금 오버레이 컴포넌트
function LockedOverlay({ requiredTier }: { requiredTier: MembershipTier }) {
  const tierInfo = MEMBERSHIP_TIERS[requiredTier]
  return (
    <div className="absolute inset-0 backdrop-blur-md bg-space-900/80 rounded-2xl flex flex-col items-center justify-center z-10">
      <Lock className="w-12 h-12 text-purple-400 mb-4" />
      <p className="text-white font-medium mb-2">
        {tierInfo.icon} {tierInfo.name} 이상 멤버십이 필요합니다
      </p>
      <Link href="/membership">
        <button className="mt-4 px-6 py-2 bg-gradient-to-r from-purple-600 to-cyan-500 rounded-full text-white font-medium hover:opacity-90 transition-opacity">
          멤버십 업그레이드
        </button>
      </Link>
    </div>
  )
}

// 레이더 애니메이션 컴포넌트
function RadarAnimation() {
  return (
    <div className="relative w-64 h-64 mx-auto mb-8">
      {/* 외부 원 */}
      <div className="absolute inset-0 rounded-full border-2 border-cyan-500/30" />
      <div className="absolute inset-4 rounded-full border border-cyan-500/20" />
      <div className="absolute inset-8 rounded-full border border-cyan-500/20" />
      <div className="absolute inset-12 rounded-full border border-purple-500/20" />

      {/* 스캔 라인 */}
      <div className="absolute inset-0 rounded-full overflow-hidden">
        <div className="absolute top-1/2 left-1/2 w-1/2 h-0.5 origin-left bg-gradient-to-r from-cyan-400 to-transparent animate-radar-scan" />
      </div>

      {/* 중앙 펄스 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-cyan-400 rounded-full animate-pulse" />

      {/* 신호 점들 */}
      <div className="absolute top-[20%] left-[30%] w-2 h-2 bg-purple-400 rounded-full animate-ping" />
      <div className="absolute top-[60%] left-[70%] w-2 h-2 bg-cyan-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
      <div className="absolute top-[40%] left-[80%] w-2 h-2 bg-green-400 rounded-full animate-ping" style={{ animationDelay: '1s' }} />

      {/* Otty 캐릭터 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16">
        <Image src="/images/otty.png" alt="Otty" fill className="object-contain" />
      </div>
    </div>
  )
}

// 실시간 표시 컴포넌트
function LiveIndicator() {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-400">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
      </span>
      실시간 업데이트
    </div>
  )
}

// 섹션 래퍼 컴포넌트
function Section({
  title,
  icon: Icon,
  children,
  userTier,
  requiredTier,
  isNew = false,
}: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
  userTier: MembershipTier
  requiredTier: MembershipTier
  isNew?: boolean
}) {
  const hasAccess = ACCESS_LEVELS[userTier] >= ACCESS_LEVELS[requiredTier]

  return (
    <div className="relative glass rounded-2xl p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500/20 to-cyan-500/20 flex items-center justify-center">
            <Icon className="w-5 h-5 text-cyan-400" />
          </div>
          <h2 className="text-xl font-bold text-white">{title}</h2>
          {isNew && (
            <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full animate-pulse">
              NEW
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">필요 등급:</span>
          <span className={`${MEMBERSHIP_TIERS[requiredTier].color.replace('from-', 'text-').split(' ')[0]}`}>
            {MEMBERSHIP_TIERS[requiredTier].icon} {MEMBERSHIP_TIERS[requiredTier].name}
          </span>
        </div>
      </div>

      {hasAccess ? children : (
        <>
          <div className="blur-sm pointer-events-none">
            {children}
          </div>
          <LockedOverlay requiredTier={requiredTier} />
        </>
      )}
    </div>
  )
}

export default function CosmicRadarPage() {
  // 실제 앱에서는 사용자 세션에서 멤버십 등급을 가져옴
  // 데모를 위해 useState로 관리
  const [userTier, setUserTier] = useState<MembershipTier>('cadet')
  const [selectedCrypto, setSelectedCrypto] = useState<'btc' | 'eth' | 'sol' | 'xrp'>('btc')

  // Cadet인 경우 잠금 화면 표시
  if (userTier === 'cadet') {
    return (
      <main className="min-h-screen py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <RadarAnimation />

          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">🛸 Cosmic Radar</span>
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            우주의 모든 신호를 감지하다
          </p>

          {/* 미리보기 (흐릿하게) */}
          <div className="relative mb-12">
            <div className="glass rounded-2xl p-8 blur-sm">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-space-800 rounded-xl p-4">
                  <Building2 className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                  <p className="text-white">기관 레이더</p>
                </div>
                <div className="bg-space-800 rounded-xl p-4">
                  <Fish className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <p className="text-white">고래 레이더</p>
                </div>
                <div className="bg-space-800 rounded-xl p-4">
                  <Radio className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="text-white">시그널 리포트</p>
                </div>
                <div className="bg-space-800 rounded-xl p-4">
                  <Telescope className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                  <p className="text-white">예측 레이더</p>
                </div>
              </div>
              <p className="text-gray-400">
                기관 매수/매도 동향, 고래 지갑 추적, AI 분석 리포트 등 프리미엄 정보를 확인하세요.
              </p>
            </div>

            {/* 잠금 오버레이 */}
            <div className="absolute inset-0 bg-space-900/60 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center">
              <Lock className="w-16 h-16 text-purple-400 mb-4" />
              <p className="text-xl text-white font-medium mb-2">
                🔒 Navigator 이상 멤버십이 필요합니다
              </p>
              <p className="text-gray-400 mb-6">
                프리미엄 콘텐츠에 접근하려면 멤버십을 업그레이드하세요
              </p>
              <Link href="/membership">
                <button className="px-8 py-3 bg-gradient-to-r from-purple-600 to-cyan-500 rounded-full text-white font-bold hover:opacity-90 transition-opacity flex items-center gap-2">
                  멤버십 업그레이드 <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
            </div>
          </div>

          {/* 데모 버튼 (개발용) */}
          <div className="glass rounded-xl p-4 inline-block">
            <p className="text-gray-400 text-sm mb-3">🧪 데모: 멤버십 등급 변경</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {Object.values(MEMBERSHIP_TIERS).map((tier) => (
                <button
                  key={tier.tier}
                  onClick={() => setUserTier(tier.tier)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    userTier === tier.tier
                      ? 'bg-purple-600 text-white'
                      : 'bg-space-800 text-gray-400 hover:bg-space-700'
                  }`}
                >
                  {tier.icon} {tier.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen py-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <RadarAnimation />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">🛸 Cosmic Radar</span>
          </h1>
          <p className="text-xl text-gray-400 mb-4">
            우주의 모든 신호를 감지하다
          </p>
          <div className="flex items-center justify-center gap-4">
            <LiveIndicator />
            <span className="text-gray-500">|</span>
            <span className="text-sm text-purple-400">
              현재 등급: {MEMBERSHIP_TIERS[userTier].icon} {MEMBERSHIP_TIERS[userTier].name}
            </span>
          </div>

          {/* 데모 버튼 */}
          <div className="mt-6 glass rounded-xl p-4 inline-block">
            <p className="text-gray-400 text-sm mb-3">🧪 데모: 멤버십 등급 변경</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {Object.values(MEMBERSHIP_TIERS).map((tier) => (
                <button
                  key={tier.tier}
                  onClick={() => setUserTier(tier.tier)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    userTier === tier.tier
                      ? 'bg-purple-600 text-white'
                      : 'bg-space-800 text-gray-400 hover:bg-space-700'
                  }`}
                >
                  {tier.icon} {tier.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 🏦 기관 레이더 */}
        <Section
          title="기관 레이더"
          icon={Building2}
          userTier={userTier}
          requiredTier={SECTION_ACCESS.institution}
          isNew
        >
          {/* 암호화폐 선택 탭 */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {(['btc', 'eth', 'sol', 'xrp'] as const).map((crypto) => (
              <button
                key={crypto}
                onClick={() => setSelectedCrypto(crypto)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  selectedCrypto === crypto
                    ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white'
                    : 'bg-space-800 text-gray-400 hover:bg-space-700'
                }`}
              >
                {crypto === 'btc' && '₿ Bitcoin'}
                {crypto === 'eth' && 'Ξ Ethereum'}
                {crypto === 'sol' && '◎ Solana'}
                {crypto === 'xrp' && '✕ XRP'}
              </button>
            ))}
          </div>

          {/* 기관 목록 */}
          <div className="space-y-3">
            {institutionData[selectedCrypto].map((item, index) => (
              <div key={index} className="bg-space-800 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{item.name}</p>
                    <p className="text-gray-400 text-sm">보유량: {item.amount}</p>
                  </div>
                </div>
                <div className={`flex items-center gap-2 ${
                  item.trend === 'up' ? 'text-green-400' : item.trend === 'down' ? 'text-red-400' : 'text-gray-400'
                }`}>
                  {item.trend === 'up' && <TrendingUp className="w-4 h-4" />}
                  {item.trend === 'down' && <TrendingDown className="w-4 h-4" />}
                  <span className="font-medium">{item.change}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* 🐋 고래 레이더 */}
        <Section
          title="고래 레이더"
          icon={Fish}
          userTier={userTier}
          requiredTier={SECTION_ACCESS.whale}
        >
          <div className="space-y-3">
            {whaleMovements.map((movement, index) => (
              <div
                key={index}
                className={`bg-space-800 rounded-xl p-4 border-l-4 ${
                  movement.type === 'exchange_in' ? 'border-red-500' : 'border-green-500'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{movement.icon}</span>
                  <span className="text-gray-500 text-sm">{movement.time}</span>
                </div>
                <p className="text-white font-bold text-lg mb-1">{movement.amount}</p>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span>{movement.from}</span>
                  <ArrowRight className="w-4 h-4" />
                  <span className={movement.type === 'exchange_in' ? 'text-red-400' : 'text-green-400'}>
                    {movement.to}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {movement.type === 'exchange_in' ? '⚠️ 거래소 입금 (매도 신호)' : '✅ 거래소 출금 (보유 신호)'}
                </p>
              </div>
            ))}
          </div>
        </Section>

        {/* 📡 시그널 리포트 */}
        <Section
          title="시그널 리포트"
          icon={Radio}
          userTier={userTier}
          requiredTier={SECTION_ACCESS.signal}
        >
          <div className="grid md:grid-cols-2 gap-6">
            {/* 시장 심리 */}
            <div className="bg-space-800 rounded-xl p-6">
              <h3 className="text-white font-medium mb-4">시장 심리 지수</h3>
              <div className="relative h-4 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full mb-2">
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-space-900"
                  style={{ left: `${signalReport.sentiment}%`, transform: 'translate(-50%, -50%)' }}
                />
              </div>
              <div className="flex justify-between text-sm text-gray-400">
                <span>극도의 공포</span>
                <span className="text-amber-400 font-bold">{signalReport.sentiment} - {signalReport.sentimentLabel}</span>
                <span>극도의 탐욕</span>
              </div>
            </div>

            {/* 기술적 분석 */}
            <div className="bg-space-800 rounded-xl p-6">
              <h3 className="text-white font-medium mb-4">주요 가격대</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">지지선</span>
                  <span className="text-green-400 font-mono">{signalReport.keyLevels.support}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">저항선</span>
                  <span className="text-red-400 font-mono">{signalReport.keyLevels.resistance}</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI 분석 */}
          <div className="mt-6 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-xl p-6 border border-purple-500/20">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🤖</span>
              <h3 className="text-white font-medium">AI 일일 분석</h3>
            </div>
            <p className="text-gray-300 leading-relaxed">{signalReport.technicalSummary}</p>
            <p className="text-gray-400 mt-4">{signalReport.aiAnalysis}</p>
          </div>
        </Section>

        {/* 🔮 예측 레이더 */}
        <Section
          title="예측 레이더"
          icon={Telescope}
          userTier={userTier}
          requiredTier={SECTION_ACCESS.prediction}
        >
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {predictions.map((pred, index) => (
              <div key={index} className="bg-space-800 rounded-xl p-6">
                <h3 className="text-gray-400 text-sm mb-2">{pred.period} 예측</h3>
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-2xl font-bold ${pred.prediction === '상승' ? 'text-green-400' : 'text-red-400'}`}>
                    {pred.prediction === '상승' ? '📈' : '📉'} {pred.prediction}
                  </span>
                  <span className="text-cyan-400 font-mono">{pred.target}</span>
                </div>
                <div className="relative h-2 bg-space-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full"
                    style={{ width: `${pred.confidence}%` }}
                  />
                </div>
                <p className="text-right text-sm text-gray-400 mt-1">신뢰도 {pred.confidence}%</p>
              </div>
            ))}
          </div>

          {/* 이벤트 캘린더 */}
          <div className="bg-space-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-cyan-400" />
              <h3 className="text-white font-medium">주요 이벤트</h3>
            </div>
            <div className="space-y-3">
              {upcomingEvents.map((event, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-space-700 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${
                      event.impact === 'high' ? 'bg-red-400' : 'bg-yellow-400'
                    }`} />
                    <span className="text-gray-400">{event.date}</span>
                  </div>
                  <span className="text-white">{event.event}</span>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* 💎 Admiral 독점 */}
        <Section
          title="Admiral 독점"
          icon={Crown}
          userTier={userTier}
          requiredTier={SECTION_ACCESS.admiral}
        >
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 rounded-xl p-6 border border-amber-500/30">
              <Crown className="w-8 h-8 text-amber-400 mb-4" />
              <h3 className="text-white font-bold mb-2">VIP 리포트</h3>
              <p className="text-gray-400 text-sm mb-4">주간 심층 분석 리포트를 받아보세요</p>
              <button className="w-full py-2 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors">
                리포트 보기
              </button>
            </div>

            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-xl p-6 border border-purple-500/30">
              <MessageSquare className="w-8 h-8 text-purple-400 mb-4" />
              <h3 className="text-white font-bold mb-2">1:1 전략 상담</h3>
              <p className="text-gray-400 text-sm mb-4">전문가와 1:1 상담을 예약하세요</p>
              <button className="w-full py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors">
                상담 예약
              </button>
            </div>

            <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 rounded-xl p-6 border border-cyan-500/30">
              <AlertTriangle className="w-8 h-8 text-cyan-400 mb-4" />
              <h3 className="text-white font-bold mb-2">독점 알림</h3>
              <p className="text-gray-400 text-sm mb-4">중요 시장 이벤트를 먼저 알려드립니다</p>
              <button className="w-full py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors">
                알림 설정
              </button>
            </div>
          </div>
        </Section>

        {/* 하단 여백 */}
        <div className="h-20" />
      </div>
    </main>
  )
}
