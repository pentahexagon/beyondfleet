'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import {
  Newspaper,
  TrendingUp,
  TrendingDown,
  BookOpen,
  Diamond,
  Lock,
  ChevronRight,
  Plus,
  RefreshCw,
  Sparkles,
} from 'lucide-react'

type UserTier = 'cadet' | 'navigator' | 'pilot' | 'commander' | 'admiral'

const TIER_HIERARCHY: UserTier[] = ['cadet', 'navigator', 'pilot', 'commander', 'admiral']

const TIER_COLORS: Record<UserTier, string> = {
  cadet: 'from-gray-500 to-gray-600',
  navigator: 'from-blue-500 to-blue-600',
  pilot: 'from-purple-500 to-purple-600',
  commander: 'from-amber-500 to-yellow-500',
  admiral: 'from-red-500 to-pink-500',
}

const TIER_NAMES: Record<UserTier, string> = {
  cadet: 'Cadet',
  navigator: 'Navigator',
  pilot: 'Pilot',
  commander: 'Commander',
  admiral: 'Admiral',
}

interface NewsItem {
  id: string
  title: string
  summary: string
  source: string
  published_at: string
  is_premium: boolean
  premium_category: string | null
}

interface WatchlistCoin {
  id: string
  symbol: string
  name: string
  current_price: number
  price_change_percentage_24h: number
  image: string
}

interface WhaleTransaction {
  id: string
  coin: string
  amount: number
  amount_usd: number
  tx_type: string
  from_label: string | null
  to_label: string | null
  timestamp: string
}

interface Course {
  id: string
  title: string
  description: string
  progress: number
  thumbnail: string
}

const OTTY_TIPS = [
  "분산투자는 기본이에요! 한 바구니에 모든 달걀을 담지 마세요.",
  "FOMO(Fear Of Missing Out)에 휩쓸리지 마세요. 놓친 기회는 또 와요!",
  "DCA(Dollar Cost Averaging)로 꾸준히 투자하면 변동성을 줄일 수 있어요.",
  "투자하기 전에 항상 본인만의 리서치를 하세요!",
  "손실을 감당할 수 있는 만큼만 투자하세요.",
  "장기 투자는 단타보다 스트레스가 적어요.",
  "뉴스에 휘둘리지 말고, 펀더멘털을 보세요!",
  "감정적인 결정은 좋지 않아요. 계획대로 투자하세요.",
  "고래의 움직임을 주시하면 시장 흐름을 읽을 수 있어요.",
  "매수는 기술, 매도는 예술이에요!",
]

export default function DashboardHome() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<{ display_name: string; nft_tier: UserTier } | null>(null)
  const [loading, setLoading] = useState(true)

  // Data states
  const [news, setNews] = useState<NewsItem[]>([])
  const [watchlist, setWatchlist] = useState<WatchlistCoin[]>([])
  const [whaleTransactions, setWhaleTransactions] = useState<WhaleTransaction[]>([])
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null)
  const [dailyTip, setDailyTip] = useState('')

  // Loading states
  const [newsLoading, setNewsLoading] = useState(true)
  const [watchlistLoading, setWatchlistLoading] = useState(true)
  const [whaleLoading, setWhaleLoading] = useState(true)

  const userTier = profile?.nft_tier || 'cadet'
  const canAccessWhale = TIER_HIERARCHY.indexOf(userTier) >= TIER_HIERARCHY.indexOf('pilot')

  useEffect(() => {
    // Set random daily tip
    const tipIndex = new Date().getDate() % OTTY_TIPS.length
    setDailyTip(OTTY_TIPS[tipIndex])

    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('display_name, nft_tier')
          .eq('id', user.id)
          .single()

        if (profileData) {
          setProfile(profileData as { display_name: string; nft_tier: UserTier })
        }
      }
      setLoading(false)
    }

    loadUser()
  }, [])

  useEffect(() => {
    if (!user) return

    // Fetch news
    async function fetchNews() {
      setNewsLoading(true)
      try {
        const res = await fetch('/api/news?per_page=3')
        const data = await res.json()
        setNews(data.news || [])
      } catch (error) {
        console.error('Error fetching news:', error)
      } finally {
        setNewsLoading(false)
      }
    }

    // Fetch watchlist prices
    async function fetchWatchlist() {
      setWatchlistLoading(true)
      try {
        // Get user's watchlist from localStorage or default coins
        const savedWatchlist = localStorage.getItem('watchlist')
        const coins = savedWatchlist ? JSON.parse(savedWatchlist) : ['bitcoin', 'ethereum', 'solana']

        if (coins.length > 0) {
          const res = await fetch(
            `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coins.join(',')}&sparkline=false`
          )
          const data = await res.json()
          setWatchlist(data || [])
        }
      } catch (error) {
        console.error('Error fetching watchlist:', error)
      } finally {
        setWatchlistLoading(false)
      }
    }

    // Fetch whale transactions
    async function fetchWhaleTransactions() {
      if (!canAccessWhale) {
        setWhaleLoading(false)
        return
      }
      setWhaleLoading(true)
      try {
        const res = await fetch('/api/whale?limit=3&significant=true')
        const data = await res.json()
        setWhaleTransactions(data.transactions || [])
      } catch (error) {
        console.error('Error fetching whale transactions:', error)
      } finally {
        setWhaleLoading(false)
      }
    }

    // Mock course data
    setCurrentCourse({
      id: '1',
      title: '비트코인 기초: 블록체인의 시작',
      description: '비트코인과 블록체인 기술의 기본 개념을 배웁니다.',
      progress: 35,
      thumbnail: '/images/course-btc.jpg',
    })

    fetchNews()
    fetchWatchlist()
    fetchWhaleTransactions()
  }, [user, canAccessWhale])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: price < 1 ? 6 : 2,
    }).format(price)
  }

  const formatWhaleAmount = (amount: number, coin: string) => {
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K ${coin}`
    return `${amount.toLocaleString()} ${coin}`
  }

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours < 1) return '방금 전'
    if (hours < 24) return `${hours}시간 전`
    return `${Math.floor(hours / 24)}일 전`
  }

  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass rounded-2xl p-8 text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">로그인이 필요합니다</h2>
          <p className="text-gray-400 mb-6">
            대시보드를 이용하려면 먼저 로그인해주세요.
          </p>
          <Link href="/auth/login">
            <button className="w-full py-3 bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-bold rounded-xl hover:opacity-90 transition-opacity">
              로그인하기
            </button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="glass rounded-2xl p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                안녕하세요, {profile?.display_name || user.email?.split('@')[0]}님!
              </h1>
              <p className="text-gray-400">{today}</p>
            </div>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${TIER_COLORS[userTier]} text-white font-bold`}>
              <Diamond className="w-5 h-5" />
              {TIER_NAMES[userTier]}
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Section 1: Today's Briefing */}
          <div className="glass rounded-2xl p-6 hover:scale-[1.01] transition-transform">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-purple-400" />
                오늘의 브리핑
              </h2>
              <Link href="/news" className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1">
                더보기 <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {newsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse bg-space-800/50 rounded-xl p-4 h-20" />
                ))}
              </div>
            ) : news.length > 0 ? (
              <div className="space-y-3">
                {news.map((item) => (
                  <Link key={item.id} href={`/news/${item.id}`}>
                    <div className="bg-space-800/50 rounded-xl p-4 hover:bg-space-700/50 transition-colors">
                      <div className="flex items-start gap-2">
                        {item.is_premium && (
                          <span className="text-amber-400 text-sm">💎</span>
                        )}
                        <div className="flex-1">
                          <h3 className="text-white font-medium line-clamp-1">{item.title}</h3>
                          <p className="text-gray-400 text-sm line-clamp-1 mt-1">{item.summary}</p>
                          <p className="text-gray-500 text-xs mt-1">{item.source} · {formatTimeAgo(item.published_at)}</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Newspaper className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>뉴스가 없습니다</p>
              </div>
            )}
          </div>

          {/* Section 2: Watchlist */}
          <div className="glass rounded-2xl p-6 hover:scale-[1.01] transition-transform">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                내 관심 코인
              </h2>
              <Link href="/prices" className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1">
                코인 추가 <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {watchlistLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse bg-space-800/50 rounded-xl p-4 h-16" />
                ))}
              </div>
            ) : watchlist.length > 0 ? (
              <div className="space-y-3">
                {watchlist.map((coin) => (
                  <div key={coin.id} className="bg-space-800/50 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={coin.image} alt={coin.name} className="w-10 h-10 rounded-full" />
                      <div>
                        <p className="text-white font-medium">{coin.name}</p>
                        <p className="text-gray-400 text-sm">{coin.symbol.toUpperCase()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">{formatPrice(coin.current_price)}</p>
                      <p className={`text-sm flex items-center gap-1 justify-end ${
                        coin.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {coin.price_change_percentage_24h >= 0 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {coin.price_change_percentage_24h.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Plus className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>관심 코인을 추가해보세요</p>
                <Link href="/prices">
                  <button className="mt-3 px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors">
                    코인 추가하기
                  </button>
                </Link>
              </div>
            )}
          </div>

          {/* Section 3: Whale Activity (Premium) */}
          <div className="glass rounded-2xl p-6 hover:scale-[1.01] transition-transform relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                🐋 고래 동향
                {!canAccessWhale && (
                  <span className="px-2 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded-full">PREMIUM</span>
                )}
              </h2>
              {canAccessWhale && (
                <Link href="/news/whale" className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1">
                  더보기 <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>

            {!canAccessWhale ? (
              <>
                {/* Blurred preview */}
                <div className="space-y-3 filter blur-sm">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-space-800/50 rounded-xl p-4">
                      <p className="text-white">🐋 10,000 BTC → Binance</p>
                      <p className="text-gray-400 text-sm">$950,000,000</p>
                    </div>
                  ))}
                </div>
                {/* Lock overlay */}
                <div className="absolute inset-0 bg-space-900/80 backdrop-blur-sm flex flex-col items-center justify-center">
                  <Lock className="w-12 h-12 text-amber-400 mb-3" />
                  <p className="text-white font-bold mb-1">Pilot 등급 이상 전용</p>
                  <p className="text-gray-400 text-sm mb-4">고래 동향을 확인하려면 업그레이드하세요</p>
                  <Link href="/nft">
                    <button className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-lg hover:opacity-90 transition-opacity">
                      업그레이드
                    </button>
                  </Link>
                </div>
              </>
            ) : whaleLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse bg-space-800/50 rounded-xl p-4 h-16" />
                ))}
              </div>
            ) : whaleTransactions.length > 0 ? (
              <div className="space-y-3">
                {whaleTransactions.map((tx) => (
                  <div key={tx.id} className="bg-space-800/50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">
                          🐋 {formatWhaleAmount(tx.amount, tx.coin)} → {tx.to_label || '알 수 없음'}
                        </p>
                        <p className="text-gray-400 text-sm">
                          ${(tx.amount_usd / 1000000).toFixed(1)}M · {formatTimeAgo(tx.timestamp)}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        tx.tx_type === 'exchange_deposit' ? 'bg-red-500/20 text-red-400' :
                        tx.tx_type === 'exchange_withdrawal' ? 'bg-green-500/20 text-green-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {tx.tx_type === 'exchange_deposit' ? '입금' :
                         tx.tx_type === 'exchange_withdrawal' ? '출금' : '전송'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <span className="text-4xl">🐋</span>
                <p className="mt-2">최근 고래 거래가 없습니다</p>
              </div>
            )}
          </div>

          {/* Section 4: Today's Learning */}
          <div className="glass rounded-2xl p-6 hover:scale-[1.01] transition-transform">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                오늘의 학습
              </h2>
              <Link href="/learn" className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1">
                학습하기 <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {currentCourse ? (
              <div className="bg-space-800/50 rounded-xl p-4">
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-medium mb-1">{currentCourse.title}</h3>
                    <p className="text-gray-400 text-sm line-clamp-2 mb-3">{currentCourse.description}</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-space-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full"
                          style={{ width: `${currentCourse.progress}%` }}
                        />
                      </div>
                      <span className="text-gray-400 text-sm">{currentCourse.progress}%</span>
                    </div>
                  </div>
                </div>
                <Link href="/learn">
                  <button className="w-full mt-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors">
                    이어서 학습하기
                  </button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>추천 강의를 확인해보세요</p>
                <Link href="/learn">
                  <button className="mt-3 px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors">
                    강의 둘러보기
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Section 5: Otty's Tip */}
        <div className="mt-6 glass rounded-2xl p-6 border border-cyan-500/30 hover:scale-[1.01] transition-transform">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
              <Image
                src="/images/otty-profile.png"
                alt="Otty"
                width={64}
                height={64}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                }}
              />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                Otty의 오늘의 팁
              </h3>
              <p className="text-gray-300 text-lg">"{dailyTip}"</p>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/prices" className="glass rounded-xl p-4 text-center hover:bg-purple-500/10 transition-colors group">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-400 group-hover:scale-110 transition-transform" />
            <p className="text-white font-medium">실시간 시세</p>
          </Link>
          <Link href="/news" className="glass rounded-xl p-4 text-center hover:bg-purple-500/10 transition-colors group">
            <Newspaper className="w-8 h-8 mx-auto mb-2 text-purple-400 group-hover:scale-110 transition-transform" />
            <p className="text-white font-medium">뉴스</p>
          </Link>
          <Link href="/learn" className="glass rounded-xl p-4 text-center hover:bg-purple-500/10 transition-colors group">
            <BookOpen className="w-8 h-8 mx-auto mb-2 text-cyan-400 group-hover:scale-110 transition-transform" />
            <p className="text-white font-medium">교육</p>
          </Link>
          <Link href="/nft" className="glass rounded-xl p-4 text-center hover:bg-purple-500/10 transition-colors group">
            <Diamond className="w-8 h-8 mx-auto mb-2 text-amber-400 group-hover:scale-110 transition-transform" />
            <p className="text-white font-medium">NFT 멤버십</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
