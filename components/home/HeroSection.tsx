import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function HeroSection() {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    return (
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
                {/* Main Character - Otty Video */}
                <div className="mb-8 relative">
                    <div className="animate-float">
                        <div className="relative mx-auto w-full max-w-lg group">
                            {/* Glow effect behind video */}
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/40 to-purple-500/40 rounded-2xl blur-3xl animate-pulse-glow" />

                            {/* Otty Video */}
                            <video
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="relative w-full rounded-2xl shadow-2xl hover:scale-105 transition-transform duration-300"
                            >
                                <source src="/videos/otty-hero.mp4" type="video/mp4" />
                            </video>
                        </div>
                    </div>

                    {/* Floating elements around video */}
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
    )
}
