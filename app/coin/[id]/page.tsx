'use client'

import { useState, useEffect, use, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'
import { useBinanceWebSocket, getBinanceSymbol } from '@/lib/hooks/useBinanceWebSocket'
import { createClient } from '@/lib/supabase/client'
import { useAccount } from 'wagmi'
import { useWallet } from '@solana/wallet-adapter-react'

interface CoinData {
  id: string
  name: string
  symbol: string
  image: string
  description: string
  current_price: number
  price_change_24h: number
  price_change_7d: number
  price_change_30d: number
  market_cap: number
  market_cap_rank: number
  total_volume: number
  circulating_supply: number
  total_supply: number
  max_supply: number
  ath: number
  ath_date: string
  atl: number
  atl_date: string
  high_24h: number
  low_24h: number
  price_history: Array<{ time: number; date: string; price: number }>
  links: {
    homepage?: string
    twitter?: string
    github?: string
  }
}

type TimeRange = '1' | '7' | '30' | '365'

export default function CoinDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [coin, setCoin] = useState<CoinData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<TimeRange>('7')
  const [error, setError] = useState('')
  const [isFavorite, setIsFavorite] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [priceFlash, setPriceFlash] = useState<'up' | 'down' | null>(null)
  const prevPriceRef = useRef<number | null>(null)

  // Web3 wallet states
  const { address: ethAddress, isConnected: isEthConnected } = useAccount()
  const { publicKey: solPublicKey, connected: isSolConnected } = useWallet()
  const isWalletConnected = isEthConnected || isSolConnected
  const walletAddress = ethAddress || solPublicKey?.toBase58() || null

  // Binance WebSocket for real-time price
  const { prices: binancePrices, isConnected: wsConnected } = useBinanceWebSocket([id])

  // Get real-time price
  const getRealTimePrice = useCallback((): number => {
    if (!coin) return 0
    const binanceSymbol = getBinanceSymbol(id)
    if (binanceSymbol && binancePrices.has(binanceSymbol)) {
      return parseFloat(binancePrices.get(binanceSymbol)!.price)
    }
    return coin.current_price
  }, [id, coin, binancePrices])

  // Get real-time 24h change
  const getRealTimeChange = useCallback((): number => {
    if (!coin) return 0
    const binanceSymbol = getBinanceSymbol(id)
    if (binanceSymbol && binancePrices.has(binanceSymbol)) {
      return parseFloat(binancePrices.get(binanceSymbol)!.priceChangePercent)
    }
    return coin.price_change_24h
  }, [id, coin, binancePrices])

  // Price flash effect
  useEffect(() => {
    if (!coin) return
    const currentPrice = getRealTimePrice()
    const prevPrice = prevPriceRef.current

    if (prevPrice !== null && prevPrice !== currentPrice) {
      const direction = currentPrice > prevPrice ? 'up' : 'down'
      setPriceFlash(direction)
      setTimeout(() => setPriceFlash(null), 500)
    }

    prevPriceRef.current = currentPrice
  }, [coin, binancePrices, getRealTimePrice])

  // Check auth and watchlist
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser({ id: user.id })
        // Check if coin is in watchlist by user_id
        const { data } = await supabase
          .from('watchlist')
          .select('id')
          .eq('user_id', user.id)
          .eq('coin_id', id)
          .single()
        setIsFavorite(!!data)
      }
    }
    checkAuth()
  }, [id])

  // Check watchlist for wallet users
  useEffect(() => {
    const checkWalletWatchlist = async () => {
      if (!walletAddress || user) return

      const supabase = createClient()
      const { data } = await supabase
        .from('watchlist')
        .select('id')
        .eq('wallet_address', walletAddress.toLowerCase())
        .eq('coin_id', id)
        .single()
      setIsFavorite(!!data)
    }
    checkWalletWatchlist()
  }, [id, walletAddress, user])

  // Fetch coin data
  useEffect(() => {
    const fetchCoin = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/coins/${id}?days=${timeRange}`)
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        setCoin(data)
      } catch (err) {
        setError('코인 정보를 불러올 수 없습니다.')
      } finally {
        setLoading(false)
      }
    }

    fetchCoin()
  }, [id, timeRange])

  const toggleFavorite = async () => {
    if (!coin) return
    if (!user && !isWalletConnected) {
      alert('로그인이 필요합니다.')
      return
    }

    setFavoriteLoading(true)

    try {
      const supabase = createClient()
      if (isFavorite) {
        // 삭제
        let query = supabase.from('watchlist').delete().eq('coin_id', id)
        if (user) {
          query = query.eq('user_id', user.id)
        } else if (walletAddress) {
          query = query.eq('wallet_address', walletAddress.toLowerCase())
        }
        await query
        setIsFavorite(false)
      } else {
        // 추가
        const insertData: {
          user_id?: string
          wallet_address?: string
          coin_id: string
          coin_name: string
          coin_symbol: string
        } = {
          coin_id: id,
          coin_name: coin.name,
          coin_symbol: coin.symbol.toUpperCase()
        }

        if (user) {
          insertData.user_id = user.id
        } else if (walletAddress) {
          insertData.wallet_address = walletAddress.toLowerCase()
        }

        await supabase.from('watchlist').insert(insertData)
        setIsFavorite(true)
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err)
    } finally {
      setFavoriteLoading(false)
    }
  }

  const formatNumber = (num: number | null | undefined) => {
    if (num === null || num === undefined) return '-'
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`
    return `$${num.toLocaleString()}`
  }

  const formatPrice = (price: number | null | undefined) => {
    if (price === null || price === undefined) return '-'
    if (price >= 1) return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    return `$${price.toFixed(6)}`
  }

  const formatSupply = (num: number | null | undefined) => {
    if (num === null || num === undefined) return '-'
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`
    return num.toLocaleString()
  }

  if (loading) {
    return (
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full" />
              <div>
                <div className="h-8 bg-purple-500/20 rounded w-48 mb-2" />
                <div className="h-4 bg-purple-500/20 rounded w-24" />
              </div>
            </div>
            <div className="h-80 bg-purple-500/20 rounded-xl mb-8" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-24 bg-purple-500/20 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !coin) {
    return (
      <div className="min-h-screen py-8 px-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || '코인을 찾을 수 없습니다.'}</p>
          <Link href="/prices" className="text-cyan-400 hover:underline">
            ← 시세 페이지로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  const timeRanges: { label: string; value: TimeRange }[] = [
    { label: '24시간', value: '1' },
    { label: '7일', value: '7' },
    { label: '30일', value: '30' },
    { label: '1년', value: '365' },
  ]

  const realTimePrice = getRealTimePrice()
  const realTimeChange = getRealTimeChange()

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <Link href="/prices" className="inline-flex items-center text-gray-400 hover:text-white mb-6 transition-colors">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          시세 목록
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Image
              src={coin.image}
              alt={coin.name}
              width={64}
              height={64}
              className="rounded-full"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-3xl font-bold text-white">{coin.name}</h1>
                <span className="text-gray-500 text-xl">({coin.symbol})</span>
                <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full">
                  #{coin.market_cap_rank}
                </span>
                {wsConnected && (
                  <span className="flex items-center gap-1.5 px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-green-400 text-xs">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    LIVE
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-2">
                <span className={`text-3xl font-bold font-mono transition-colors duration-300 ${
                  priceFlash === 'up' ? 'text-green-300' :
                  priceFlash === 'down' ? 'text-red-300' : 'text-white'
                }`}>
                  {formatPrice(realTimePrice)}
                </span>
                <span className={`text-lg font-medium ${realTimeChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {realTimeChange >= 0 ? '+' : ''}{realTimeChange?.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            {/* Favorite Button - Show when logged in OR wallet connected */}
            {(user || isWalletConnected) && (
              <button
                onClick={toggleFavorite}
                disabled={favoriteLoading}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isFavorite
                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/30'
                    : 'bg-space-800/50 text-gray-400 hover:text-white hover:bg-space-700/50'
                } ${favoriteLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {favoriteLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {isFavorite ? '★' : '☆'} 즐겨찾기
                  </span>
                )}
              </button>
            )}

            {/* External Links */}
            {coin.links.homepage && (
              <a
                href={coin.links.homepage}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-space-800/50 rounded-lg text-gray-400 hover:text-white text-sm transition-colors"
              >
                🌐 웹사이트
              </a>
            )}
            {coin.links.twitter && (
              <a
                href={`https://twitter.com/${coin.links.twitter}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-space-800/50 rounded-lg text-gray-400 hover:text-white text-sm transition-colors"
              >
                𝕏 Twitter
              </a>
            )}
          </div>
        </div>

        {/* Stats Grid - Mobile First */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
          <div className="glass rounded-xl p-4">
            <p className="text-gray-400 text-xs md:text-sm mb-1">시가총액</p>
            <p className="text-white font-bold text-base md:text-lg">{formatNumber(coin.market_cap)}</p>
          </div>
          <div className="glass rounded-xl p-4">
            <p className="text-gray-400 text-xs md:text-sm mb-1">24시간 거래량</p>
            <p className="text-white font-bold text-base md:text-lg">{formatNumber(coin.total_volume)}</p>
          </div>
          <div className="glass rounded-xl p-4">
            <p className="text-gray-400 text-xs md:text-sm mb-1">유통량</p>
            <p className="text-white font-bold text-base md:text-lg">{formatSupply(coin.circulating_supply)}</p>
          </div>
          <div className="glass rounded-xl p-4">
            <p className="text-gray-400 text-xs md:text-sm mb-1">총 공급량</p>
            <p className="text-white font-bold text-base md:text-lg">{formatSupply(coin.total_supply) || '무제한'}</p>
          </div>
        </div>

        {/* Price Chart */}
        <div className="glass rounded-xl p-4 md:p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-lg font-bold text-white">가격 차트</h2>
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
              {timeRanges.map((range) => (
                <button
                  key={range.value}
                  onClick={() => setTimeRange(range.value)}
                  className={`px-3 md:px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                    timeRange === range.value
                      ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white'
                      : 'bg-space-800/50 text-gray-400 hover:text-white'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={coin.price_history}>
                <defs>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  stroke="#6b7280"
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="#6b7280"
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => formatPrice(value)}
                  domain={['auto', 'auto']}
                  width={70}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a2e',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#9ca3af' }}
                  formatter={(value: number) => [formatPrice(value), '가격']}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="url(#strokeGradient)"
                  strokeWidth={2}
                  fill="url(#priceGradient)"
                />
                <defs>
                  <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Price Changes */}
        <div className="glass rounded-xl p-4 md:p-6 mb-8">
          <h2 className="text-lg font-bold text-white mb-4">가격 변동</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-gray-400 text-xs md:text-sm mb-1">24시간</p>
              <p className={`text-lg md:text-xl font-bold ${realTimeChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {realTimeChange >= 0 ? '+' : ''}{realTimeChange?.toFixed(2)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-xs md:text-sm mb-1">7일</p>
              <p className={`text-lg md:text-xl font-bold ${coin.price_change_7d >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {coin.price_change_7d >= 0 ? '+' : ''}{coin.price_change_7d?.toFixed(2)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-xs md:text-sm mb-1">30일</p>
              <p className={`text-lg md:text-xl font-bold ${coin.price_change_30d >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {coin.price_change_30d >= 0 ? '+' : ''}{coin.price_change_30d?.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
          <div className="glass rounded-xl p-4">
            <p className="text-gray-400 text-xs md:text-sm mb-1">24시간 최고가</p>
            <p className="text-green-400 font-bold text-base md:text-lg">{formatPrice(coin.high_24h)}</p>
          </div>
          <div className="glass rounded-xl p-4">
            <p className="text-gray-400 text-xs md:text-sm mb-1">24시간 최저가</p>
            <p className="text-red-400 font-bold text-base md:text-lg">{formatPrice(coin.low_24h)}</p>
          </div>
          <div className="glass rounded-xl p-4">
            <p className="text-gray-400 text-xs md:text-sm mb-1">역대 최고가</p>
            <p className="text-white font-bold text-base md:text-lg">{formatPrice(coin.ath)}</p>
          </div>
          <div className="glass rounded-xl p-4">
            <p className="text-gray-400 text-xs md:text-sm mb-1">역대 최저가</p>
            <p className="text-white font-bold text-base md:text-lg">{formatPrice(coin.atl)}</p>
          </div>
        </div>

        {/* Description */}
        {coin.description && (
          <div className="glass rounded-xl p-4 md:p-6">
            <h2 className="text-lg font-bold text-white mb-4">{coin.name} 소개</h2>
            <div
              className="text-gray-400 prose prose-invert max-w-none prose-a:text-cyan-400 text-sm md:text-base"
              dangerouslySetInnerHTML={{ __html: coin.description.slice(0, 1000) + (coin.description.length > 1000 ? '...' : '') }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
