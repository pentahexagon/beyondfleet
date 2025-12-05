'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Button from '@/components/ui/Button'
import { supabase } from '@/lib/supabase/client'
import { MembershipTier, MEMBERSHIP_TIERS } from '@/types'
import { BookOpen, Clock, Lock, CheckCircle, ChevronRight } from 'lucide-react'

interface Lesson {
  id: string
  title: string
  description: string
  level: 'beginner' | 'intermediate' | 'advanced'
  thumbnail: string
  read_time: number
  required_tier: MembershipTier
  order_num: number
}

interface LessonProgress {
  lesson_id: string
  completed: boolean
}

const levelConfig = {
  beginner: {
    label: '초급',
    icon: '🌱',
    color: 'text-green-400',
    bg: 'bg-green-500/20',
    border: 'border-green-500/30',
    gradient: 'from-green-500/20 to-green-600/10'
  },
  intermediate: {
    label: '중급',
    icon: '📈',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/20',
    border: 'border-yellow-500/30',
    gradient: 'from-yellow-500/20 to-yellow-600/10'
  },
  advanced: {
    label: '고급',
    icon: '🚀',
    color: 'text-red-400',
    bg: 'bg-red-500/20',
    border: 'border-red-500/30',
    gradient: 'from-red-500/20 to-red-600/10'
  },
}

const tierLabels: Record<MembershipTier, string> = {
  cadet: '🌱 Cadet',
  navigator: '⭐ Navigator',
  pilot: '🚀 Pilot',
  commander: '🌟 Commander',
  admiral: '🌌 Admiral',
}

// 티어 레벨 순서
const tierOrder: MembershipTier[] = ['cadet', 'navigator', 'pilot', 'commander', 'admiral']

const ADMIN_EMAIL = 'coinkim00@gmail.com'

function canAccessLesson(userTier: MembershipTier, requiredTier: MembershipTier, isAdmin: boolean): boolean {
  // Admin has access to all content
  if (isAdmin) return true

  const userLevel = tierOrder.indexOf(userTier)
  const requiredLevel = tierOrder.indexOf(requiredTier)
  return userLevel >= requiredLevel
}

export default function LearnPage() {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [progress, setProgress] = useState<LessonProgress[]>([])
  const [selectedLevel, setSelectedLevel] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all')
  const [userTier, setUserTier] = useState<MembershipTier>('cadet')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showLockModal, setShowLockModal] = useState(false)
  const [lockedTier, setLockedTier] = useState<MembershipTier>('navigator')

  useEffect(() => {
    fetchLessons()
    checkAuth()
  }, [])

  async function fetchLessons() {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .order('order_num', { ascending: true })

      if (error) throw error
      setLessons(data || [])
    } catch (error) {
      console.error('Error fetching lessons:', error)
      // 데모 데이터 사용
      setLessons(demoLessons)
    } finally {
      setLoading(false)
    }
  }

  async function checkAuth() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setIsLoggedIn(true)

        // Check if admin
        if (user.email === ADMIN_EMAIL) {
          setIsAdmin(true)
        }

        // 사용자 티어 가져오기
        const { data: profile } = await supabase
          .from('profiles')
          .select('membership_tier, role')
          .eq('id', user.id)
          .single()

        if (profile?.membership_tier) {
          setUserTier(profile.membership_tier)
        }

        // Also check role for admin
        if (profile?.role === 'admin') {
          setIsAdmin(true)
        }

        // 진행률 가져오기
        const { data: progressData } = await supabase
          .from('lesson_progress')
          .select('lesson_id, completed')
          .eq('user_id', user.id)

        if (progressData) {
          setProgress(progressData)
        }
      }
    } catch (error) {
      console.error('Auth check error:', error)
    }
  }

  function handleLockedClick(requiredTier: MembershipTier) {
    setLockedTier(requiredTier)
    setShowLockModal(true)
  }

  const filteredLessons = selectedLevel === 'all'
    ? lessons
    : lessons.filter(lesson => lesson.level === selectedLevel)

  const groupedLessons = {
    beginner: filteredLessons.filter(l => l.level === 'beginner'),
    intermediate: filteredLessons.filter(l => l.level === 'intermediate'),
    advanced: filteredLessons.filter(l => l.level === 'advanced'),
  }

  const completedCount = (level: 'beginner' | 'intermediate' | 'advanced') => {
    return groupedLessons[level].filter(lesson =>
      progress.some(p => p.lesson_id === lesson.id && p.completed)
    ).length
  }

  const progressPercent = (level: 'beginner' | 'intermediate' | 'advanced') => {
    const total = groupedLessons[level].length
    if (total === 0) return 0
    return Math.round((completedCount(level) / total) * 100)
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-5xl mb-4 block">🎓</span>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            교육 센터
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            초보자부터 전문가까지, 단계별로 암호화폐를 배워보세요.
            멤버십 등급에 따라 더 많은 콘텐츠에 접근할 수 있습니다.
          </p>
        </div>

        {/* Level Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {(['beginner', 'intermediate', 'advanced'] as const).map((level) => {
            const config = levelConfig[level]
            const lessonCount = groupedLessons[level].length
            const completed = completedCount(level)
            const percent = progressPercent(level)

            return (
              <button
                key={level}
                onClick={() => setSelectedLevel(selectedLevel === level ? 'all' : level)}
                className={`glass rounded-xl p-6 text-left transition-all duration-300 ${
                  selectedLevel === level
                    ? `ring-2 ${config.border} ${config.bg}`
                    : 'hover:scale-[1.02]'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl">{config.icon}</span>
                  <span className={`px-3 py-1 ${config.bg} ${config.color} text-sm rounded-full font-medium`}>
                    {lessonCount}개 강의
                  </span>
                </div>
                <h3 className={`text-xl font-bold ${config.color} mb-2`}>
                  {config.label} (
                  {level === 'beginner' ? 'Beginner' : level === 'intermediate' ? 'Intermediate' : 'Advanced'}
                  )
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  {level === 'beginner' && '암호화폐의 기본 개념과 시작하는 방법'}
                  {level === 'intermediate' && '차트 분석, DeFi, NFT 등 심화 내용'}
                  {level === 'advanced' && '전문적인 분석과 투자 전략'}
                </p>

                {/* Progress Bar */}
                {isLoggedIn && (
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>진행률</span>
                      <span>{completed}/{lessonCount} 완료</span>
                    </div>
                    <div className="h-2 bg-space-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${config.gradient} transition-all duration-500`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Level Filter Buttons */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          <Button
            variant={selectedLevel === 'all' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setSelectedLevel('all')}
          >
            전체
          </Button>
          <Button
            variant={selectedLevel === 'beginner' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setSelectedLevel('beginner')}
          >
            <span className="text-green-400 mr-1">●</span> 초급
          </Button>
          <Button
            variant={selectedLevel === 'intermediate' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setSelectedLevel('intermediate')}
          >
            <span className="text-yellow-400 mr-1">●</span> 중급
          </Button>
          <Button
            variant={selectedLevel === 'advanced' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setSelectedLevel('advanced')}
          >
            <span className="text-red-400 mr-1">●</span> 고급
          </Button>
        </div>

        {/* Lessons Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass rounded-xl overflow-hidden animate-pulse">
                <div className="h-40 bg-space-700" />
                <div className="p-5">
                  <div className="h-4 bg-space-700 rounded w-20 mb-3" />
                  <div className="h-5 bg-space-700 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-space-700 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-10">
            {(['beginner', 'intermediate', 'advanced'] as const).map((level) => {
              const levelLessons = groupedLessons[level]
              if (levelLessons.length === 0 || (selectedLevel !== 'all' && selectedLevel !== level)) return null

              const config = levelConfig[level]

              return (
                <div key={level}>
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-2xl">{config.icon}</span>
                    <h2 className={`text-xl font-bold ${config.color}`}>
                      {config.label}
                    </h2>
                    <span className="text-gray-500 text-sm">
                      {levelLessons.length}개 강의
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {levelLessons.map((lesson) => {
                      const isCompleted = progress.some(p => p.lesson_id === lesson.id && p.completed)
                      const isLocked = !canAccessLesson(userTier, lesson.required_tier, isAdmin)
                      const config = levelConfig[lesson.level]

                      return (
                        <div
                          key={lesson.id}
                          className={`glass rounded-xl overflow-hidden card-hover relative group ${
                            isLocked ? 'opacity-70' : ''
                          }`}
                        >
                          {/* Thumbnail */}
                          <div className="relative h-40 overflow-hidden">
                            <Image
                              src={lesson.thumbnail || 'https://picsum.photos/seed/lesson/800/400'}
                              alt={lesson.title}
                              fill
                              className={`object-cover transition-transform duration-300 group-hover:scale-110 ${
                                isLocked ? 'blur-sm' : ''
                              }`}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-space-900 to-transparent" />

                            {/* Lock Overlay */}
                            {isLocked && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                <div className="text-center">
                                  <Lock className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                                  <span className="text-sm text-purple-300">
                                    {tierLabels[lesson.required_tier]} 필요
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Completed Badge */}
                            {isCompleted && (
                              <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                완료
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="p-5">
                            <div className="flex items-center gap-2 mb-3">
                              <span className={`px-2 py-0.5 ${config.bg} ${config.color} text-xs rounded-full`}>
                                {config.label}
                              </span>
                              <span className="flex items-center text-gray-500 text-xs">
                                <Clock className="w-3 h-3 mr-1" />
                                {lesson.read_time}분
                              </span>
                            </div>

                            <h3 className="text-lg font-bold text-white mb-2 line-clamp-1">
                              {lesson.title}
                            </h3>
                            <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                              {lesson.description}
                            </p>

                            {isLocked ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full"
                                onClick={() => handleLockedClick(lesson.required_tier)}
                              >
                                <Lock className="w-4 h-4 mr-2" />
                                멤버십 업그레이드
                              </Button>
                            ) : (
                              <Link href={`/learn/${lesson.id}`}>
                                <Button variant="secondary" size="sm" className="w-full group">
                                  {isCompleted ? '다시 읽기' : '시작하기'}
                                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* CTA */}
        <div className="glass rounded-2xl p-8 text-center mt-12">
          <h2 className="text-xl font-bold text-white mb-4">
            더 많은 콘텐츠를 원하시나요?
          </h2>
          <p className="text-gray-400 mb-6 max-w-xl mx-auto">
            멤버십 등급을 업그레이드하면 고급 교육 콘텐츠, 1:1 멘토링,
            그리고 프리미엄 리포트에 접근할 수 있습니다.
          </p>
          <Link href="/membership">
            <Button size="lg">멤버십 보기 →</Button>
          </Link>
        </div>
      </div>

      {/* Lock Modal */}
      {showLockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="glass rounded-2xl p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              멤버십 업그레이드 필요
            </h3>
            <p className="text-gray-400 mb-6">
              이 강의는 <span className="text-purple-300 font-medium">{tierLabels[lockedTier]}</span> 이상
              멤버만 접근할 수 있습니다.
            </p>

            <div className="glass p-4 rounded-xl mb-6 text-left">
              <h4 className="text-sm font-medium text-white mb-3">멤버십 레벨별 접근 권한</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center text-gray-400">
                  <span className="mr-2">🌱</span> Cadet: 초급 강의
                </li>
                <li className="flex items-center text-gray-400">
                  <span className="mr-2">⭐</span> Navigator: 초급 + 중급 강의
                </li>
                <li className="flex items-center text-gray-400">
                  <span className="mr-2">🚀</span> Pilot 이상: 전체 강의
                </li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setShowLockModal(false)}
              >
                닫기
              </Button>
              <Link href="/membership" className="flex-1">
                <Button className="w-full">
                  멤버십 보기
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 데모 데이터 (Supabase 연결 전 또는 에러 시 사용)
const demoLessons: Lesson[] = [
  // 🌱 초급 (Beginner) - 5개
  {
    id: '1',
    title: '암호화폐란 무엇인가?',
    description: '비트코인의 탄생부터 블록체인 기초 개념까지, 암호화폐의 본질을 이해합니다.',
    level: 'beginner',
    thumbnail: 'https://picsum.photos/seed/crypto-basics/800/400',
    read_time: 8,
    required_tier: 'cadet',
    order_num: 1,
  },
  {
    id: '2',
    title: '지갑 만들기 가이드',
    description: '메타마스크, 팬텀 지갑 설치부터 안전한 설정까지 단계별로 안내합니다.',
    level: 'beginner',
    thumbnail: 'https://picsum.photos/seed/wallet-guide/800/400',
    read_time: 10,
    required_tier: 'cadet',
    order_num: 2,
  },
  {
    id: '3',
    title: '거래소 사용법',
    description: '회원가입, 본인인증, 입금부터 첫 거래까지 거래소 사용의 모든 것.',
    level: 'beginner',
    thumbnail: 'https://picsum.photos/seed/exchange-use/800/400',
    read_time: 12,
    required_tier: 'cadet',
    order_num: 3,
  },
  {
    id: '4',
    title: '안전한 보관 방법',
    description: '핫월렛 vs 콜드월렛의 차이, 시드구문 관리, 보안 베스트 프랙티스.',
    level: 'beginner',
    thumbnail: 'https://picsum.photos/seed/safe-storage/800/400',
    read_time: 8,
    required_tier: 'cadet',
    order_num: 4,
  },
  {
    id: '5',
    title: '기본 용어 정리',
    description: '시가총액, 거래량, 변동률, ATH, FUD 등 필수 암호화폐 용어 완전 정복.',
    level: 'beginner',
    thumbnail: 'https://picsum.photos/seed/crypto-terms/800/400',
    read_time: 10,
    required_tier: 'cadet',
    order_num: 5,
  },
  // 📈 중급 (Intermediate) - 5개
  {
    id: '6',
    title: '차트 읽는 법',
    description: '캔들차트의 기본, 지지선과 저항선, 추세 판단의 기초를 배웁니다.',
    level: 'intermediate',
    thumbnail: 'https://picsum.photos/seed/chart-reading/800/400',
    read_time: 15,
    required_tier: 'navigator',
    order_num: 6,
  },
  {
    id: '7',
    title: 'DeFi 기초',
    description: '디파이란 무엇인가? 스테이킹, 유동성 풀, 이자 농사의 기본 개념.',
    level: 'intermediate',
    thumbnail: 'https://picsum.photos/seed/defi-basics/800/400',
    read_time: 12,
    required_tier: 'navigator',
    order_num: 7,
  },
  {
    id: '8',
    title: 'NFT 이해하기',
    description: 'NFT의 정의, 민팅, 마켓플레이스에서의 구매/판매 방법을 알아봅니다.',
    level: 'intermediate',
    thumbnail: 'https://picsum.photos/seed/nft-guide/800/400',
    read_time: 10,
    required_tier: 'navigator',
    order_num: 8,
  },
  {
    id: '9',
    title: '리스크 관리',
    description: '분산투자의 원칙, 손절/익절 전략, 감정 관리와 투자 심리.',
    level: 'intermediate',
    thumbnail: 'https://picsum.photos/seed/risk-management/800/400',
    read_time: 12,
    required_tier: 'navigator',
    order_num: 9,
  },
  {
    id: '10',
    title: '세금과 규제',
    description: '한국과 호주의 암호화폐 세금 기초, 신고 방법, 주의사항.',
    level: 'intermediate',
    thumbnail: 'https://picsum.photos/seed/crypto-tax/800/400',
    read_time: 15,
    required_tier: 'navigator',
    order_num: 10,
  },
  // 🚀 고급 (Advanced) - 5개
  {
    id: '11',
    title: '기술적 분석 심화',
    description: 'RSI, MACD, 볼린저밴드 등 고급 지표의 활용법과 해석 방법.',
    level: 'advanced',
    thumbnail: 'https://picsum.photos/seed/technical-analysis/800/400',
    read_time: 20,
    required_tier: 'pilot',
    order_num: 11,
  },
  {
    id: '12',
    title: '온체인 데이터 분석',
    description: '고래 추적, 거래소 입출금 분석, Glassnode/Nansen 활용법.',
    level: 'advanced',
    thumbnail: 'https://picsum.photos/seed/onchain-data/800/400',
    read_time: 18,
    required_tier: 'pilot',
    order_num: 12,
  },
  {
    id: '13',
    title: '스마트 컨트랙트 이해',
    description: '솔리디티 기초, 컨트랙트 읽는 법, 보안 취약점 확인하기.',
    level: 'advanced',
    thumbnail: 'https://picsum.photos/seed/smart-contract/800/400',
    read_time: 22,
    required_tier: 'pilot',
    order_num: 13,
  },
  {
    id: '14',
    title: 'DeFi 고급 전략',
    description: '이자 농사 최적화, LP 토큰 이해, 무상손실(IL) 계산과 관리.',
    level: 'advanced',
    thumbnail: 'https://picsum.photos/seed/defi-advanced/800/400',
    read_time: 18,
    required_tier: 'pilot',
    order_num: 14,
  },
  {
    id: '15',
    title: '포트폴리오 관리',
    description: '자산 배분 전략, 정기 리밸런싱, 장기 투자 vs 단기 트레이딩.',
    level: 'advanced',
    thumbnail: 'https://picsum.photos/seed/portfolio/800/400',
    read_time: 15,
    required_tier: 'pilot',
    order_num: 15,
  },
]
