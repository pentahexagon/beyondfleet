'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import HeroSection from '@/components/home/HeroSection'
import StorySection from '@/components/home/StorySection'
import MarketSection from '@/components/home/MarketSection'
import FeaturesSection from '@/components/home/FeaturesSection'
import CommunitySection from '@/components/home/CommunitySection'
import FinalCTA from '@/components/home/FinalCTA'
import FooterSection from '@/components/home/FooterSection'

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

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [sparkles, setSparkles] = useState<Sparkle[]>([])
  const [floatingOtties, setFloatingOtties] = useState<FloatingOtty[]>([])
  const [shootingStars, setShootingStars] = useState<ShootingStar[]>([])
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

      <HeroSection />
      <StorySection />
      <MarketSection />
      <FeaturesSection />
      <CommunitySection />
      <FinalCTA />
      <FooterSection />
    </div>
  )
}
