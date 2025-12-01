import Link from 'next/link'
import Button from '@/components/ui/Button'

const courses = [
  {
    id: 1,
    title: '암호화폐 기초',
    description: '블록체인과 암호화폐의 기본 개념을 배웁니다.',
    level: 'beginner',
    lessons: 8,
    duration: '2시간',
    icon: '📚',
    tier: 'cadet',
  },
  {
    id: 2,
    title: '비트코인 심층 분석',
    description: '비트코인의 작동 원리와 투자 전략을 학습합니다.',
    level: 'beginner',
    lessons: 10,
    duration: '3시간',
    icon: '₿',
    tier: 'cadet',
  },
  {
    id: 3,
    title: '이더리움과 스마트 컨트랙트',
    description: 'DeFi와 NFT의 기반이 되는 이더리움을 이해합니다.',
    level: 'intermediate',
    lessons: 12,
    duration: '4시간',
    icon: '💎',
    tier: 'navigator',
  },
  {
    id: 4,
    title: 'DeFi 마스터 클래스',
    description: '탈중앙화 금융의 핵심 프로토콜을 분석합니다.',
    level: 'intermediate',
    lessons: 15,
    duration: '5시간',
    icon: '🏦',
    tier: 'navigator',
  },
  {
    id: 5,
    title: '기술적 분석 완전 정복',
    description: '차트 분석과 트레이딩 전략을 심도있게 다룹니다.',
    level: 'advanced',
    lessons: 20,
    duration: '8시간',
    icon: '📊',
    tier: 'pilot',
  },
  {
    id: 6,
    title: '블록체인 개발 입문',
    description: 'Solidity로 스마트 컨트랙트를 작성합니다.',
    level: 'advanced',
    lessons: 25,
    duration: '10시간',
    icon: '💻',
    tier: 'commander',
  },
]

const levelConfig = {
  beginner: { label: '초급', color: 'text-green-400', bg: 'bg-green-500/20' },
  intermediate: { label: '중급', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  advanced: { label: '고급', color: 'text-red-400', bg: 'bg-red-500/20' },
}

const tierLabels: Record<string, string> = {
  cadet: '🌱 무료',
  navigator: '⭐ Navigator',
  pilot: '🚀 Pilot',
  commander: '🌟 Commander',
}

export default function LearnPage() {
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

        {/* Level Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          <Button variant="secondary" size="sm">전체</Button>
          <Button variant="ghost" size="sm">
            <span className="text-green-400 mr-1">●</span> 초급
          </Button>
          <Button variant="ghost" size="sm">
            <span className="text-yellow-400 mr-1">●</span> 중급
          </Button>
          <Button variant="ghost" size="sm">
            <span className="text-red-400 mr-1">●</span> 고급
          </Button>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {courses.map((course) => {
            const level = levelConfig[course.level as keyof typeof levelConfig]
            const isLocked = course.tier !== 'cadet'

            return (
              <div
                key={course.id}
                className={`glass rounded-xl overflow-hidden card-hover ${
                  isLocked ? 'opacity-80' : ''
                }`}
              >
                {/* Course Header */}
                <div className="p-6 pb-4">
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-4xl">{course.icon}</span>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-2 py-1 ${level.bg} ${level.color} text-xs rounded-full`}>
                        {level.label}
                      </span>
                      {isLocked && (
                        <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                          🔒 {tierLabels[course.tier]}
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2">{course.title}</h3>
                  <p className="text-gray-400 text-sm">{course.description}</p>
                </div>

                {/* Course Stats */}
                <div className="px-6 py-4 border-t border-purple-500/20 flex items-center justify-between">
                  <div className="flex gap-4 text-sm text-gray-400">
                    <span>📖 {course.lessons}개 강의</span>
                    <span>⏱️ {course.duration}</span>
                  </div>

                  {isLocked ? (
                    <Link href="/membership">
                      <Button variant="ghost" size="sm">
                        업그레이드
                      </Button>
                    </Link>
                  ) : (
                    <Button variant="secondary" size="sm">
                      시작하기
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* CTA */}
        <div className="glass rounded-2xl p-8 text-center">
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
    </div>
  )
}
