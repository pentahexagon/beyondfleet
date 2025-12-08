'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Rocket, Star, Globe, Zap, Shield, Users, Trophy, Target } from 'lucide-react'

interface RoadmapPhase {
  phase: string
  title: string
  period: string
  status: 'completed' | 'in_progress' | 'upcoming'
  icon: React.ReactNode
  items: string[]
}

export default function RoadmapPage() {
  const roadmapData: RoadmapPhase[] = [
    {
      phase: 'Phase 1',
      title: '발사 준비',
      period: '2024 Q4',
      status: 'completed',
      icon: <Rocket className="w-6 h-6" />,
      items: [
        '웹사이트 런칭',
        '실시간 시세 조회 기능',
        '커뮤니티 구축',
        '소셜 미디어 활성화',
      ]
    },
    {
      phase: 'Phase 2',
      title: '우주 탐험',
      period: '2025 Q1',
      status: 'in_progress',
      icon: <Star className="w-6 h-6" />,
      items: [
        '도전일지 기능 출시',
        'NFT 옥션 시스템',
        '랜덤박스 이벤트',
        '기부 프로그램 런칭',
      ]
    },
    {
      phase: 'Phase 3',
      title: '함대 확장',
      period: '2025 Q2',
      status: 'upcoming',
      icon: <Globe className="w-6 h-6" />,
      items: [
        '멤버십 시스템 강화',
        '교육 콘텐츠 확대',
        '파트너십 확대',
        '다국어 지원',
      ]
    },
    {
      phase: 'Phase 4',
      title: '정착지 도달',
      period: '2025 Q3',
      status: 'upcoming',
      icon: <Target className="w-6 h-6" />,
      items: [
        '자체 토큰 출시',
        'DAO 거버넌스',
        '크로스체인 지원',
        '메타버스 통합',
      ]
    },
    {
      phase: 'Phase 5',
      title: '우주 정복',
      period: '2025 Q4+',
      status: 'upcoming',
      icon: <Trophy className="w-6 h-6" />,
      items: [
        '글로벌 확장',
        '기관 파트너십',
        '생태계 성숙',
        '지속 가능한 성장',
      ]
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'from-green-500 to-emerald-600'
      case 'in_progress':
        return 'from-cyan-500 to-blue-600'
      case 'upcoming':
        return 'from-purple-500 to-pink-600'
      default:
        return 'from-gray-500 to-gray-600'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return '완료'
      case 'in_progress':
        return '진행 중'
      case 'upcoming':
        return '예정'
      default:
        return ''
    }
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-purple-500/10 text-purple-400 px-4 py-2 rounded-full mb-4">
            <Rocket className="w-5 h-5" />
            <span className="font-comic">BeyondFleet 로드맵</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white font-comic mb-4">
            🗺️ 정착지를 향한 여정
          </h1>
          <p className="text-gray-400 font-gaegu text-xl max-w-2xl mx-auto">
            BeyondFleet의 미래를 함께 그려갑니다.
            우리의 여정에 동참해주세요!
          </p>
        </div>

        {/* Roadmap Timeline */}
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 via-cyan-500 to-pink-500 transform md:-translate-x-1/2" />

          {/* Phases */}
          <div className="space-y-12">
            {roadmapData.map((phase, index) => (
              <div
                key={phase.phase}
                className={`relative flex items-start gap-8 ${
                  index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                }`}
              >
                {/* Timeline Dot */}
                <div className="absolute left-8 md:left-1/2 w-4 h-4 bg-white rounded-full transform -translate-x-1/2 z-10 ring-4 ring-space-900" />

                {/* Content Card */}
                <div className={`ml-16 md:ml-0 md:w-1/2 ${index % 2 === 0 ? 'md:pr-12' : 'md:pl-12'}`}>
                  <div className={`glass rounded-2xl p-6 border ${
                    phase.status === 'in_progress' ? 'border-cyan-500/50' : 'border-purple-500/20'
                  }`}>
                    {/* Phase Header */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getStatusColor(phase.status)} flex items-center justify-center text-white`}>
                        {phase.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-purple-400 text-sm font-comic">{phase.phase}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            phase.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                            phase.status === 'in_progress' ? 'bg-cyan-500/20 text-cyan-400' :
                            'bg-purple-500/20 text-purple-400'
                          }`}>
                            {getStatusLabel(phase.status)}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-white font-comic">{phase.title}</h3>
                      </div>
                      <span className="text-gray-500 text-sm">{phase.period}</span>
                    </div>

                    {/* Items */}
                    <ul className="space-y-2">
                      {phase.items.map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-gray-300">
                          <span className={`w-2 h-2 rounded-full ${
                            phase.status === 'completed' ? 'bg-green-400' :
                            phase.status === 'in_progress' ? 'bg-cyan-400' :
                            'bg-purple-400'
                          }`} />
                          <span className="font-gaegu">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Spacer for alternating layout */}
                <div className="hidden md:block md:w-1/2" />
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-16 glass rounded-3xl p-8 text-center bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20">
          <div className="text-6xl mb-4">🚀🦦</div>
          <h3 className="text-2xl font-bold text-white font-comic mb-4">
            함께 우주로 떠나요!
          </h3>
          <p className="text-gray-400 font-gaegu text-lg mb-6">
            BeyondFleet의 여정에 동참하고 싶으신가요?
            <br />
            지금 바로 커뮤니티에 참여하세요!
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/membership"
              className="doge-button font-comic text-white flex items-center gap-2"
            >
              <Users className="w-5 h-5" />
              멤버십 가입
            </Link>
            <Link
              href="/journal"
              className="px-6 py-3 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-xl font-comic flex items-center gap-2 transition-colors"
            >
              <Star className="w-5 h-5" />
              도전일지 시작
            </Link>
          </div>
        </div>

        {/* Vision Statement */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 font-gaegu text-lg">
            "우리는 모든 사람이 금융의 자유를 누릴 수 있는 세상을 꿈꿉니다."
          </p>
          <p className="text-purple-400 font-comic mt-2">- BeyondFleet Team</p>
        </div>
      </div>
    </div>
  )
}
