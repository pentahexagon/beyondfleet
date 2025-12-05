'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { BoxType, BOX_INFO, NFT, TIER_INFO } from '@/types/nft'
import { supabase } from '@/lib/supabase/client'

const PROBABILITIES: Record<BoxType, Record<string, number>> = {
  basic: { cadet: 70, navigator: 30 },
  premium: { navigator: 50, pilot: 35, commander: 15 },
  legendary: { pilot: 40, commander: 40, admiral: 20 },
}

const BOX_QUOTES = {
  basic: {
    title: "모든 위대한 여정은 작은 발걸음에서",
    subtitle: "첫 번째 별을 손에 넣으세요 ⭐",
  },
  premium: {
    title: "용기 있는 자만이 별을 잡는다",
    subtitle: "더 큰 우주가 펼쳐집니다 🌌",
  },
  legendary: {
    title: "전설은 선택하는 자의 것",
    subtitle: "우주의 끝, 그 너머로 🚀",
  },
}

export default function RandomboxPage() {
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [selectedBox, setSelectedBox] = useState<BoxType | null>(null)
  const [opening, setOpening] = useState(false)
  const [resultNFT, setResultNFT] = useState<NFT | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [remainingBoxes] = useState(Math.floor(Math.random() * 30) + 30) // 30-60 random
  const [recentWinner] = useState({
    tier: 'admiral',
    time: '방금',
  })

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user ? { id: user.id } : null)
    })
  }, [])

  const handleOpenBox = async (boxType: BoxType) => {
    if (!user) {
      alert('로그인이 필요합니다.')
      return
    }

    setSelectedBox(boxType)
    setOpening(true)
    setShowResult(false)

    try {
      // Simulate animation delay
      await new Promise((resolve) => setTimeout(resolve, 3000))

      const res = await fetch('/api/nft/randombox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          box_type: boxType,
          user_id: user.id,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setResultNFT(data.nft)
        setShowResult(true)
      } else {
        alert(data.error || '박스 오픈에 실패했습니다.')
      }
    } catch (error) {
      console.error('Error opening box:', error)
      alert('박스 오픈에 실패했습니다.')
    } finally {
      setOpening(false)
    }
  }

  const closeResult = () => {
    setShowResult(false)
    setResultNFT(null)
    setSelectedBox(null)
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section with Video/Image */}
        <div className="relative rounded-3xl overflow-hidden mb-12 glass border border-purple-500/30">
          {/* Background Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-cyan-500/10 to-pink-500/20" />

          {/* Otty Video/Image */}
          <div className="relative py-16 px-8 text-center">
            <div className="mb-8 relative">
              <div className="relative mx-auto w-48 h-48 md:w-64 md:h-64 animate-float">
                <Image
                  src="/images/otty.png"
                  alt="Otty"
                  fill
                  className="object-contain drop-shadow-2xl"
                />
              </div>
              {/* Sparkles around Otty */}
              <div className="absolute top-0 left-1/4 text-3xl animate-bounce" style={{ animationDelay: '0s' }}>✨</div>
              <div className="absolute top-10 right-1/4 text-4xl animate-bounce" style={{ animationDelay: '0.3s' }}>🎁</div>
              <div className="absolute bottom-0 left-1/3 text-3xl animate-bounce" style={{ animationDelay: '0.6s' }}>⭐</div>
            </div>

            <h1 className="font-gaegu text-3xl md:text-5xl font-bold text-white mb-4 animate-fade-in">
              운명의 상자가 당신을 기다립니다
            </h1>
            <p className="font-comic text-xl md:text-2xl text-cyan-400 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              Otty가 준비한 특별한 선물 🎁
            </p>
          </div>
        </div>

        {/* Urgency Banners */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <div className="glass rounded-full px-6 py-3 flex items-center justify-center gap-2 border border-orange-500/30 animate-pulse">
            <span className="text-xl">🔥</span>
            <span className="font-comic text-orange-400 font-bold">이번 주 남은 박스: {remainingBoxes}개</span>
          </div>
          <div className="glass rounded-full px-6 py-3 flex items-center justify-center gap-2 border border-yellow-500/30">
            <span className="text-xl">✨</span>
            <span className="font-comic text-yellow-400 font-bold">{recentWinner.time} 누군가 Admiral NFT 당첨!</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          <Link
            href="/nft"
            className="px-6 py-3 rounded-xl bg-space-800/50 text-gray-400 hover:text-white hover:bg-space-700/50 transition-all font-comic"
          >
            마켓플레이스
          </Link>
          <Link
            href="/nft/auction"
            className="px-6 py-3 rounded-xl bg-space-800/50 text-gray-400 hover:text-white hover:bg-space-700/50 transition-all font-comic"
          >
            옥션
          </Link>
          <Link
            href="/nft/randombox"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-comic font-bold"
          >
            🎁 랜덤박스
          </Link>
        </div>

        {/* Boxes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {(Object.keys(BOX_INFO) as BoxType[]).map((boxType) => {
            const box = BOX_INFO[boxType]
            const probs = PROBABILITIES[boxType]
            const quotes = BOX_QUOTES[boxType]

            return (
              <div
                key={boxType}
                className="glass rounded-3xl p-6 card-bounce relative overflow-hidden border border-purple-500/20 hover:border-purple-500/50 transition-all"
              >
                {/* Glow Effect */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${box.color} opacity-10`}
                />

                {/* Content */}
                <div className="relative">
                  {/* Box Icon */}
                  <div className="text-center mb-6">
                    <div
                      className="inline-block text-8xl animate-bounce-slow"
                      style={{ animationDuration: '3s' }}
                    >
                      {box.icon}
                    </div>
                  </div>

                  {/* Box Name */}
                  <h3
                    className={`text-2xl font-bold text-center mb-2 bg-gradient-to-r ${box.color} bg-clip-text text-transparent font-comic`}
                  >
                    {box.name}
                  </h3>

                  {/* Price */}
                  <p className="text-3xl font-bold text-center text-white mb-2 font-comic">
                    {box.price} SOL
                  </p>

                  {/* Emotional Quote */}
                  <div className="text-center mb-4">
                    <p className="font-gaegu text-lg text-gray-300">"{quotes.title}"</p>
                    <p className="font-gaegu text-sm text-cyan-400">{quotes.subtitle}</p>
                  </div>

                  {/* Probability Table */}
                  <div className="bg-space-900/50 rounded-xl p-4 mb-6">
                    <p className="text-gray-400 text-sm mb-3 text-center font-comic">확률</p>
                    <div className="space-y-2">
                      {Object.entries(probs).map(([tier, prob]) => (
                        <div key={tier} className="flex justify-between items-center">
                          <span className="flex items-center gap-2">
                            <span>{TIER_INFO[tier as keyof typeof TIER_INFO].icon}</span>
                            <span className="text-gray-300 font-gaegu">
                              {TIER_INFO[tier as keyof typeof TIER_INFO].name}
                            </span>
                          </span>
                          <span className="text-cyan-400 font-bold font-comic">{prob}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Open Button */}
                  <button
                    onClick={() => handleOpenBox(boxType)}
                    disabled={opening}
                    className={`w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r ${box.color} hover:opacity-90 transition-all disabled:opacity-50 font-comic text-lg hover-bounce`}
                  >
                    {opening && selectedBox === boxType ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin">🎁</span>
                        오픈 중...
                      </span>
                    ) : (
                      '나의 운명 열기 🚀'
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* How It Works */}
        <div className="glass rounded-3xl p-8 border border-purple-500/20">
          <h3 className="text-2xl font-bold text-white mb-8 text-center font-comic">
            🎯 랜덤박스 이용 안내
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">1️⃣</span>
              </div>
              <h4 className="text-white font-bold mb-2 font-comic">박스 선택</h4>
              <p className="text-gray-400 font-gaegu text-lg">
                마음이 이끄는 박스를 선택하세요
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">2️⃣</span>
              </div>
              <h4 className="text-white font-bold mb-2 font-comic">SOL 결제</h4>
              <p className="text-gray-400 font-gaegu text-lg">
                연결된 지갑으로 SOL을 결제하세요
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-pink-500/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">3️⃣</span>
              </div>
              <h4 className="text-white font-bold mb-2 font-comic">NFT 획득</h4>
              <p className="text-gray-400 font-gaegu text-lg">
                운명이 선택한 NFT를 만나보세요
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Opening Animation Modal */}
      {opening && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
          <div className="text-center">
            {/* Spinning Box */}
            <div className="relative">
              <div className="text-9xl animate-spin" style={{ animationDuration: '1s' }}>
                🎁
              </div>
              {/* Sparkles */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="absolute w-64 h-64 animate-ping opacity-30">
                  <div className="w-full h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-500" />
                </div>
              </div>
            </div>
            <p className="text-white text-2xl font-bold mt-8 animate-pulse font-gaegu">
              운명의 상자가 열리는 중...
            </p>
            <p className="text-cyan-400 text-lg mt-2 font-gaegu">
              어떤 NFT가 나올까요? ✨
            </p>
          </div>
        </div>
      )}

      {/* Result Modal */}
      {showResult && resultNFT && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90">
          <div className="glass rounded-3xl p-8 max-w-md w-full text-center relative overflow-hidden border border-cyan-500/30">
            {/* Celebration Effects */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-1/4 text-4xl animate-bounce" style={{ animationDelay: '0s' }}>✨</div>
              <div className="absolute top-0 right-1/4 text-4xl animate-bounce" style={{ animationDelay: '0.2s' }}>🎉</div>
              <div className="absolute bottom-20 left-10 text-3xl animate-bounce" style={{ animationDelay: '0.4s' }}>⭐</div>
              <div className="absolute bottom-20 right-10 text-3xl animate-bounce" style={{ animationDelay: '0.6s' }}>💫</div>
            </div>

            {/* Close Button */}
            <button
              onClick={closeResult}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Title */}
            <h3 className="text-3xl font-bold text-white mb-6 font-comic">
              축하합니다! 🎊
            </h3>

            {/* NFT Display */}
            <div className="relative mx-auto w-48 h-48 rounded-xl overflow-hidden mb-6 ring-4 ring-cyan-500/50">
              <Image
                src={resultNFT.image_url}
                alt={resultNFT.name}
                fill
                className="object-cover"
              />
            </div>

            {/* Tier Badge */}
            <div className="mb-4">
              <span
                className={`inline-block px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r ${
                  TIER_INFO[resultNFT.tier].color
                } text-white font-comic`}
              >
                {TIER_INFO[resultNFT.tier].icon} {TIER_INFO[resultNFT.tier].name}
              </span>
            </div>

            {/* NFT Name */}
            <h4 className="text-xl font-bold text-cyan-400 mb-2 font-comic">{resultNFT.name}</h4>
            <p className="text-gray-400 mb-6 font-gaegu text-lg">{resultNFT.description}</p>

            {/* Emotional Message */}
            <p className="text-purple-400 mb-6 font-gaegu text-lg">
              "당신의 우주 여정이 한 단계 더 나아갔습니다" 🚀
            </p>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={closeResult}
                className="flex-1 py-3 rounded-xl bg-space-700/50 text-gray-300 hover:text-white transition-colors font-comic"
              >
                닫기
              </button>
              <Link
                href="/nft"
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-bold hover:opacity-90 transition-opacity text-center font-comic"
              >
                내 NFT 보기
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Custom Animation Styles */}
      <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
