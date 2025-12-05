'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef, useCallback } from 'react'

interface Sparkle {
  id: number
  x: number
  y: number
}

interface FloatingOtty {
  id: number
  x: number
  y: number
  delay: number
  size: number
}

interface ShootingStar {
  id: number
  x: number
  y: number
  delay: number
}

interface PriceData {
  id: string
  symbol: string
  name: string
  current_price: number
  price_change_percentage_24h: number
  image: string
}

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [sparkles, setSparkles] = useState<Sparkle[]>([])
  const [floatingOtties, setFloatingOtties] = useState<FloatingOtty[]>([])
  const [shootingStars, setShootingStars] = useState<ShootingStar[]>([])
  const [prices, setPrices] = useState<PriceData[]>([])
  const [pricesLoading, setPricesLoading] = useState(true)
  const sparkleId = useRef(0)

  useEffect(() => {
    setMounted(true)

    // Generate random floating otties
    const otties: FloatingOtty[] = Array.from({ length: 5 }, (_, i) => ({
      id: i,
      x: Math.random() * 80 + 10,
      y: Math.random() * 80 + 10,
      delay: Math.random() * 5,
      size: Math.random() * 30 + 20,
    }))
    setFloatingOtties(otties)

    // Generate shooting stars periodically
    const shootingInterval = setInterval(() => {
      const newStar: ShootingStar = {
        id: Date.now(),
        x: Math.random() * 60,
        y: Math.random() * 30,
        delay: 0,
      }
      setShootingStars(prev => [...prev.slice(-5), newStar])
    }, 3000)

    // Fetch top 5 prices
    fetch('/api/prices?per_page=5')
      .then(res => res.json())
      .then(data => {
        if (data.coins) {
          setPrices(data.coins.slice(0, 5))
        }
        setPricesLoading(false)
      })
      .catch(() => setPricesLoading(false))

    return () => clearInterval(shootingInterval)
  }, [])

  // Click sparkle effect
  const handleClick = useCallback((e: React.MouseEvent) => {
    const newSparkle: Sparkle = {
      id: sparkleId.current++,
      x: e.clientX,
      y: e.clientY,
    }
    setSparkles(prev => [...prev, newSparkle])
    setTimeout(() => {
      setSparkles(prev => prev.filter(s => s.id !== newSparkle.id))
    }, 500)
  }, [])

  const formatPrice = (price: number) => {
    if (price >= 1) return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    return `$${price.toFixed(6)}`
  }

  return (
    <div className="overflow-hidden cursor-paw bg-space-deep" onClick={handleClick}>
      {/* Click sparkles */}
      {sparkles.map(sparkle => (
        <div
          key={sparkle.id}
          className="fixed pointer-events-none z-50 text-2xl sparkle"
          style={{ left: sparkle.x - 12, top: sparkle.y - 12 }}
        >
          ✨
        </div>
      ))}

      {/* Floating mini Otties */}
      {mounted && floatingOtties.map(otty => (
        <div
          key={otty.id}
          className="fixed pointer-events-none z-10 opacity-20 animate-float-slow"
          style={{
            left: `${otty.x}%`,
            top: `${otty.y}%`,
            animationDelay: `${otty.delay}s`,
            fontSize: `${otty.size}px`,
          }}
        >
          🦦
        </div>
      ))}

      {/* Shooting stars */}
      {mounted && shootingStars.map(star => (
        <div
          key={star.id}
          className="fixed pointer-events-none z-5 shooting-star text-white"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
          }}
        >
          ⭐
        </div>
      ))}

      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-screen flex items-center justify-center py-20 overflow-hidden">
        {/* Space background with stars */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a1a] via-[#1a0a2e] to-[#0a1a2a]" />

          {/* Animated stars */}
          {mounted && [...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white animate-twinkle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${Math.random() * 3 + 1}px`,
                height: `${Math.random() * 3 + 1}px`,
                animationDelay: `${Math.random() * 3}s`,
                opacity: Math.random() * 0.8 + 0.2,
              }}
            />
          ))}

          {/* Colorful nebula effects */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/20 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">
          {/* Main Character - Otty */}
          <div className="mb-8 relative">
            <div className="animate-float">
              <div className="relative mx-auto w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 group">
                {/* Glow effect behind character */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/40 to-purple-500/40 rounded-full blur-3xl animate-pulse-glow" />

                {/* Otty Image */}
                <div className="relative w-full h-full flex items-center justify-center hover:scale-110 transition-transform duration-300">
                  <Image
                    src="/images/otty.png"
                    alt="Otty - BeyondFleet Mascot"
                    fill
                    className="object-contain drop-shadow-2xl"
                    priority
                  />
                </div>
              </div>
            </div>

            {/* Floating elements around character */}
            <div className="absolute top-0 left-1/4 text-4xl animate-bounce" style={{ animationDelay: '0s' }}>⭐</div>
            <div className="absolute top-10 right-1/4 text-5xl animate-bounce" style={{ animationDelay: '0.5s' }}>🚀</div>
            <div className="absolute bottom-10 left-1/3 text-3xl animate-bounce" style={{ animationDelay: '1s' }}>💫</div>
            <div className="absolute bottom-20 right-1/3 text-4xl animate-bounce" style={{ animationDelay: '1.5s' }}>🌙</div>
          </div>

          {/* Main Title - New Slogan */}
          <h1 className="font-gaegu text-3xl md:text-5xl lg:text-6xl font-bold mb-4 text-white leading-tight animate-fade-in">
            개미는 땅을 파고, 우리는 우주를 판다
          </h1>

          {/* Sub Slogan */}
          <p className="font-comic text-xl md:text-3xl text-cyan-400 mb-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            BeyondFleet - 부자의 항해 🚀
          </p>

          {/* Description */}
          <p className="font-gaegu text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.6s' }}>
            어제의 나는 물 속에서 헤엄쳤지만,<br />
            오늘의 나는 우주를 향해 날아오릅니다.<br />
            <span className="text-cyan-400">Otty와 함께라면, 당신의 이야기도 달라질 수 있어요.</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8 animate-fade-in" style={{ animationDelay: '0.9s' }}>
            <Link href="/auth/signup">
              <button className="doge-button font-comic text-white hover-bounce cursor-rocket">
                🚀 여정 시작하기
              </button>
            </Link>
            <Link href="/prices">
              <button className="doge-button font-comic text-white hover-bounce cursor-rocket" style={{ background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)' }}>
                📈 시세 확인
              </button>
            </Link>
          </div>

          {/* Fun tagline */}
          <p className="font-comic text-gray-400 text-sm md:text-base animate-fade-in" style={{ animationDelay: '1.2s' }}>
            가입비 없음 • 기본 기능 무료 • 🦦 수달과 함께 떠나요!
          </p>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="flex flex-col items-center text-cyan-400 font-comic">
            <span className="text-sm mb-2">스크롤!</span>
            <span className="text-2xl">👇</span>
          </div>
        </div>
      </section>

      {/* ===== STORY SECTION - NEW ===== */}
      <section className="py-20 px-4 bg-gradient-to-b from-[#0a1a2a] via-[#1a0a2e] to-[#0a0a1a]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-comic text-4xl md:text-6xl font-bold text-white mb-4">
              우리의 여정 🌟
            </h2>
            <p className="font-gaegu text-xl text-gray-400">
              어제의 개미에서 내일의 우주인으로
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-4">
            {/* Step 1 - Yesterday */}
            <div className="relative group">
              <div className="glass rounded-3xl p-8 text-center card-bounce hover:bg-blue-500/10 border border-blue-500/20">
                <div className="text-8xl md:text-9xl mb-6 group-hover:animate-wiggle">
                  🌊
                </div>
                <div className="inline-block px-4 py-2 bg-blue-500/20 rounded-full text-blue-400 font-comic text-lg font-bold mb-4">
                  어제의 나
                </div>
                <h3 className="font-gaegu text-2xl font-bold text-white mb-3">월급만 바라보던 개미 시절</h3>
                <p className="font-gaegu text-xl text-gray-400">
                  "빠져나갈 수 없을 것 같았어요"
                </p>
              </div>
              {/* Arrow */}
              <div className="hidden md:block absolute top-1/2 -right-4 text-5xl text-purple-500/70 animate-pulse">
                →
              </div>
            </div>

            {/* Step 2 - Today */}
            <div className="relative group">
              <div className="glass rounded-3xl p-8 text-center card-bounce hover:bg-purple-500/10 border border-purple-500/20">
                <div className="text-7xl md:text-8xl mb-6 group-hover:animate-wiggle">
                  🦦🦦🦦
                </div>
                <div className="inline-block px-4 py-2 bg-purple-500/20 rounded-full text-purple-400 font-comic text-lg font-bold mb-4">
                  오늘의 우리
                </div>
                <h3 className="font-gaegu text-2xl font-bold text-white mb-3">혼자가 아닌 함께</h3>
                <p className="font-gaegu text-xl text-gray-400">
                  "배우고, 나누고, 성장합니다"
                </p>
              </div>
              {/* Arrow */}
              <div className="hidden md:block absolute top-1/2 -right-4 text-5xl text-purple-500/70 animate-pulse">
                →
              </div>
            </div>

            {/* Step 3 - Tomorrow */}
            <div className="group">
              <div className="glass rounded-3xl p-8 text-center card-bounce hover:bg-cyan-500/10 border-2 border-cyan-500/50 animate-pulse-glow">
                <div className="text-8xl md:text-9xl mb-6 group-hover:animate-wiggle">
                  🚀
                </div>
                <div className="inline-block px-4 py-2 bg-cyan-500/20 rounded-full text-cyan-400 font-comic text-lg font-bold mb-4">
                  내일의 당신
                </div>
                <h3 className="font-gaegu text-2xl font-bold text-white mb-3">우주를 향한 비행</h3>
                <p className="font-gaegu text-xl text-gray-400">
                  "재정적 자유, 이제 시작입니다"
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== LIVE PRICES SECTION ===== */}
      <section className="py-20 px-4 bg-[#0a0a1a]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-comic text-4xl md:text-5xl font-bold text-white mb-4">
              실시간 시세 📊
            </h2>
            <p className="font-gaegu text-xl text-gray-400">
              지금 코인들은 어떻게 움직이고 있을까?
            </p>
          </div>

          <div className="glass rounded-3xl p-6 border border-purple-500/20">
            {pricesLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-3 animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-500/20 rounded-full" />
                      <div className="w-24 h-4 bg-purple-500/20 rounded" />
                    </div>
                    <div className="w-20 h-4 bg-purple-500/20 rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {prices.map((coin, index) => (
                  <Link key={coin.id} href={`/coin/${coin.id}`}>
                    <div className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-purple-500/10 transition-colors cursor-pointer hover-bounce">
                      <div className="flex items-center gap-4">
                        <span className="font-comic text-gray-500 w-6">{index + 1}</span>
                        <Image
                          src={coin.image}
                          alt={coin.name}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                        <div>
                          <p className="font-comic text-white font-bold">{coin.name}</p>
                          <p className="font-comic text-gray-500 text-sm uppercase">{coin.symbol}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-comic text-white font-bold">{formatPrice(coin.current_price)}</p>
                        <p className={`font-comic text-sm font-bold ${coin.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {coin.price_change_percentage_24h >= 0 ? '🚀 +' : '📉 '}
                          {coin.price_change_percentage_24h?.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            <Link href="/prices">
              <button className="w-full mt-6 py-4 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-xl font-comic text-cyan-400 font-bold hover:from-purple-500/30 hover:to-cyan-500/30 transition-colors hover-bounce">
                더 많은 코인 보기 →
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section className="py-20 px-4 bg-gradient-to-b from-[#0a0a1a] to-[#1a0a2e]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-comic text-4xl md:text-5xl font-bold text-white mb-4">
              뭘 할 수 있나요? 🤔
            </h2>
            <p className="font-gaegu text-xl text-gray-400">
              BeyondFleet에서 제공하는 기능들
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <Link href="/prices" className="group">
              <div className="glass rounded-3xl p-6 h-full card-bounce hover:border-cyan-500/50 border border-transparent">
                <div className="text-6xl mb-4 group-hover:animate-wiggle">📊</div>
                <h3 className="font-comic text-xl font-bold text-white mb-2">실시간 시세</h3>
                <p className="font-gaegu text-gray-400">
                  바이낸스 연동 실시간 가격!
                  <br />
                  관심 코인 알림까지 📱
                </p>
              </div>
            </Link>

            {/* Feature 2 */}
            <Link href="/learn" className="group">
              <div className="glass rounded-3xl p-6 h-full card-bounce hover:border-purple-500/50 border border-transparent">
                <div className="text-6xl mb-4 group-hover:animate-wiggle">📚</div>
                <h3 className="font-comic text-xl font-bold text-white mb-2">교육</h3>
                <p className="font-gaegu text-gray-400">
                  초보부터 고급까지!
                  <br />
                  단계별 학습 콘텐츠 🎓
                </p>
              </div>
            </Link>

            {/* Feature 3 */}
            <Link href="/nft" className="group">
              <div className="glass rounded-3xl p-6 h-full card-bounce hover:border-yellow-500/50 border border-transparent">
                <div className="text-6xl mb-4 group-hover:animate-wiggle">🎨</div>
                <h3 className="font-comic text-xl font-bold text-white mb-2">NFT 멤버십</h3>
                <p className="font-gaegu text-gray-400">
                  등급별 혜택과 투표권!
                  <br />
                  랜덤박스 & 경매 🎁
                </p>
              </div>
            </Link>

            {/* Feature 4 */}
            <Link href="/giving" className="group">
              <div className="glass rounded-3xl p-6 h-full card-bounce hover:border-green-500/50 border border-transparent">
                <div className="text-6xl mb-4 group-hover:animate-wiggle">💝</div>
                <h3 className="font-comic text-xl font-bold text-white mb-2">기부</h3>
                <p className="font-gaegu text-gray-400">
                  투명한 기부 시스템!
                  <br />
                  커뮤니티 투표로 결정 🗳️
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== COMMUNITY SECTION ===== */}
      <section className="py-20 px-4 bg-[#1a0a2e]">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-8xl mb-8 animate-float">
            🦦💬🦦
          </div>
          <h2 className="font-comic text-4xl md:text-5xl font-bold text-white mb-6">
            혼자보다 함께!
          </h2>
          <p className="font-gaegu text-2xl text-cyan-400 mb-4">
            "손 잡고 뜨면 안 잃어요" 🤝
          </p>
          <p className="font-gaegu text-lg text-gray-400 max-w-2xl mx-auto mb-10">
            수달은 잘 때 손을 잡고 자요. 떠내려가지 않게요.
            <br />
            우리도 마찬가지예요. 함께하면 흔들리지 않아요!
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://t.me/beyondfleet"
              target="_blank"
              rel="noopener noreferrer"
              className="glass px-8 py-4 rounded-full hover:bg-blue-500/20 transition-colors flex items-center gap-3 hover-bounce"
            >
              <span className="text-3xl">📱</span>
              <span className="font-comic text-white font-bold text-lg">Telegram</span>
            </a>
            <a
              href="https://twitter.com/beyondfleet"
              target="_blank"
              rel="noopener noreferrer"
              className="glass px-8 py-4 rounded-full hover:bg-blue-400/20 transition-colors flex items-center gap-3 hover-bounce"
            >
              <span className="text-3xl">𝕏</span>
              <span className="font-comic text-white font-bold text-lg">Twitter</span>
            </a>
            <a
              href="https://discord.gg/beyondfleet"
              target="_blank"
              rel="noopener noreferrer"
              className="glass px-8 py-4 rounded-full hover:bg-purple-500/20 transition-colors flex items-center gap-3 hover-bounce"
            >
              <span className="text-3xl">💬</span>
              <span className="font-comic text-white font-bold text-lg">Discord</span>
            </a>
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="py-24 px-4 relative overflow-hidden bg-gradient-to-b from-[#1a0a2e] to-[#0a0a1a]">
        <div className="absolute inset-0">
          {/* More stars */}
          {mounted && [...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white animate-twinkle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${Math.random() * 3 + 1}px`,
                height: `${Math.random() * 3 + 1}px`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="animate-float mb-8">
            <div className="relative mx-auto w-48 h-48 md:w-64 md:h-64">
              <Image
                src="/images/otty.png"
                alt="Otty"
                fill
                className="object-contain"
              />
            </div>
          </div>

          <h2 className="font-comic text-4xl md:text-6xl font-bold text-white mb-6">
            준비됐나요? 🚀
          </h2>

          <p className="font-gaegu text-2xl text-gray-400 mb-10">
            개미에서 우주인으로, 지금 바로 시작하세요!
          </p>

          <Link href="/auth/signup">
            <button className="doge-button font-comic text-white text-xl px-12 py-5 animate-pulse-glow hover-bounce cursor-rocket">
              🚀 여정 시작하기
            </button>
          </Link>

          <p className="font-comic mt-6 text-gray-500 text-sm">
            가입비 없음 • 기본 기능 무료 • 언제든 탈퇴 가능
          </p>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="py-10 px-4 border-t border-purple-500/20 bg-[#0a0a1a]">
        <div className="max-w-4xl mx-auto text-center">
          <p className="font-comic text-3xl font-bold text-white mb-4">
            To the Moon! 🌙
          </p>
          <p className="font-gaegu text-xl gradient-text mb-4">
            개미는 땅을 파고, 우리는 우주를 판다 🦦🚀
          </p>
          <p className="font-comic text-gray-500 text-sm">
            © 2024 BeyondFleet. 부자의 항해를 응원합니다.
          </p>

          {/* Fun doge-style text */}
          <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm font-comic">
            <span className="text-cyan-400">much journey</span>
            <span className="text-purple-400">very wealth</span>
            <span className="text-yellow-400">such moon</span>
            <span className="text-pink-400">wow</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
