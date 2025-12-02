'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'

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

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <Link href="/prices" className="inline-flex items-center text-gray-400 hover:text-white mb-6">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          시세 목록
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Image
              src={coin.image}
              alt={coin.name}
              width={64}
              height={64}
              className="rounded-full"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold text-white">{coin.name}</h1>
                <span className="text-gray-500 text-xl">({coin.symbol})</span>
                <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full">
                  #{coin.market_cap_rank}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-2xl font-bold text-white">{formatPrice(coin.current_price)}</span>
                <span className={`text-lg font-medium ${coin.price_change_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {coin.price_change_24h >= 0 ? '+' : ''}{coin.price_change_24h?.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="flex gap-2">
            {coin.links.homepage && (
              <a
                href={coin.links.homepage}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-space-800/50 rounded-lg text-gray-400 hover:text-white text-sm"
              >
                🌐 웹사이트
              </a>
            )}
            {coin.links.twitter && (
              <a
                href={`https://twitter.com/${coin.links.twitter}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-space-800/50 rounded-lg text-gray-400 hover:text-white text-sm"
              >
                𝕏 Twitter
              </a>
            )}
          </div>
        </div>

        {/* Price Chart */}
        <div className="glass rounded-xl p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-lg font-bold text-white">가격 차트</h2>
            <div className="flex gap-2">
              {timeRanges.map((range) => (
                <button
                  key={range.value}
                  onClick={() => setTimeRange(range.value)}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
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

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={coin.price_history}>
                <defs>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  stroke="#6b7280"
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#6b7280"
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => formatPrice(value)}
                  domain={['auto', 'auto']}
                  width={80}
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
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fill="url(#priceGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="glass rounded-xl p-4">
            <p className="text-gray-400 text-sm mb-1">시가총액</p>
            <p className="text-white font-bold text-lg">{formatNumber(coin.market_cap)}</p>
          </div>
          <div className="glass rounded-xl p-4">
            <p className="text-gray-400 text-sm mb-1">24시간 거래량</p>
            <p className="text-white font-bold text-lg">{formatNumber(coin.total_volume)}</p>
          </div>
          <div className="glass rounded-xl p-4">
            <p className="text-gray-400 text-sm mb-1">24시간 최고가</p>
            <p className="text-green-400 font-bold text-lg">{formatPrice(coin.high_24h)}</p>
          </div>
          <div className="glass rounded-xl p-4">
            <p className="text-gray-400 text-sm mb-1">24시간 최저가</p>
            <p className="text-red-400 font-bold text-lg">{formatPrice(coin.low_24h)}</p>
          </div>
          <div className="glass rounded-xl p-4">
            <p className="text-gray-400 text-sm mb-1">유통량</p>
            <p className="text-white font-bold text-lg">{formatSupply(coin.circulating_supply)} {coin.symbol}</p>
          </div>
          <div className="glass rounded-xl p-4">
            <p className="text-gray-400 text-sm mb-1">총 공급량</p>
            <p className="text-white font-bold text-lg">{formatSupply(coin.total_supply)} {coin.symbol}</p>
          </div>
          <div className="glass rounded-xl p-4">
            <p className="text-gray-400 text-sm mb-1">역대 최고가 (ATH)</p>
            <p className="text-white font-bold text-lg">{formatPrice(coin.ath)}</p>
          </div>
          <div className="glass rounded-xl p-4">
            <p className="text-gray-400 text-sm mb-1">역대 최저가 (ATL)</p>
            <p className="text-white font-bold text-lg">{formatPrice(coin.atl)}</p>
          </div>
        </div>

        {/* Price Changes */}
        <div className="glass rounded-xl p-6 mb-8">
          <h2 className="text-lg font-bold text-white mb-4">가격 변동</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-1">24시간</p>
              <p className={`text-xl font-bold ${coin.price_change_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {coin.price_change_24h >= 0 ? '+' : ''}{coin.price_change_24h?.toFixed(2)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-1">7일</p>
              <p className={`text-xl font-bold ${coin.price_change_7d >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {coin.price_change_7d >= 0 ? '+' : ''}{coin.price_change_7d?.toFixed(2)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-1">30일</p>
              <p className={`text-xl font-bold ${coin.price_change_30d >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {coin.price_change_30d >= 0 ? '+' : ''}{coin.price_change_30d?.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>

        {/* Description */}
        {coin.description && (
          <div className="glass rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">{coin.name} 소개</h2>
            <div
              className="text-gray-400 prose prose-invert max-w-none prose-a:text-cyan-400"
              dangerouslySetInnerHTML={{ __html: coin.description.slice(0, 1000) + (coin.description.length > 1000 ? '...' : '') }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
