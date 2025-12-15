import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'

export default function FinalCTA() {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    return (
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
    )
}
