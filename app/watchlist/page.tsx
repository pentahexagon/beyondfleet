'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Star, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { useBinanceWebSocket, getBinanceSymbol } from '@/lib/hooks/useBinanceWebSocket'
import { useAccount } from 'wagmi'
import { useWallet } from '@solana/wallet-adapter-react'

interface WatchlistItem {
  id: string
  coin_id: string
  coin_name: string
  coin_symbol: string
  created_at: string
}

interface CoinData {
  id: string
  name: string
  symbol: string
  image: string
  current_price: number
  price_change_percentage_24h: number
  market_cap: number
  market_cap_rank: number
}

export default function WatchlistPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [coinData, setCoinData] = useState<Map<string, CoinData>>(new Map())
  const [loading, setLoading] = useState(true)
  const [priceFlash, setPriceFlash] = useState<Record<string, 'up' | 'down' | null>>({})
  const prevPricesRef = useRef<Record<string, number>>({})

  // Web3 wallet states
  const { address: ethAddress, isConnected: isEthConnected } = useAccount()
  const { publicKey: solPublicKey, connected: isSolConnected } = useWallet()
  const isWalletConnected = isEthConnected || isSolConnected
  const walletAddress = ethAddress || solPublicKey?.toBase58() || null

  // Get coin IDs for WebSocket
  const coinIds = watchlist.map(item => item.coin_id)
  const { prices: binancePrices, isConnected: wsConnected } = useBinanceWebSocket(coinIds)

  // Check auth and fetch watchlist
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        await fetchWatchlistByUser(user.id)
      } else {
        setLoading(false)
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchWatchlistByUser(session.user.id)
      } else {
        setWatchlist([])
        setCoinData(new Map())
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Fetch watchlist for wallet users
  useEffect(() => {
    async function fetchWalletWatchlist() {
      if (!walletAddress || user) return

      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('watchlist')
          .select('*')
          .eq('wallet_address', walletAddress.toLowerCase())
          .order('created_at', { ascending: false })

        if (error) throw error
        setWatchlist(data || [])

        // Fetch coin data
        if (data && data.length > 0) {
          const coinIds = data.map(item => item.coin_id).join(',')
          const res = await fetch(`/api/watchlist-prices?ids=${coinIds}`)
          const priceData = await res.json()

          if (priceData.coins) {
            const coinMap = new Map<string, CoinData>()
            priceData.coins.forEach((coin: CoinData) => {
              coinMap.set(coin.id, coin)
            })
            setCoinData(coinMap)
          }
        }
      } catch (error) {
        console.error('Error fetching wallet watchlist:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchWalletWatchlist()
  }, [walletAddress, user])

  async function fetchWatchlistByUser(userId: string) {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setWatchlist(data || [])

      // Fetch coin data from CoinGecko
      if (data && data.length > 0) {
        const coinIds = data.map(item => item.coin_id).join(',')
        const res = await fetch(`/api/watchlist-prices?ids=${coinIds}`)
        const priceData = await res.json()

        if (priceData.coins) {
          const coinMap = new Map<string, CoinData>()
          priceData.coins.forEach((coin: CoinData) => {
            coinMap.set(coin.id, coin)
          })
          setCoinData(coinMap)
        }
      }
    } catch (error) {
      console.error('Error fetching watchlist:', error)
    } finally {
      setLoading(false)
    }
  }

  // Get real-time price from Binance or fallback to CoinGecko
  const getRealTimePrice = useCallback((coinId: string): number => {
    const binanceSymbol = getBinanceSymbol(coinId)
    if (binanceSymbol && binancePrices.has(binanceSymbol)) {
      return parseFloat(binancePrices.get(binanceSymbol)!.price)
    }
    return coinData.get(coinId)?.current_price || 0
  }, [binancePrices, coinData])

  // Get real-time 24h change
  const getRealTimeChange = useCallback((coinId: string): number => {
    const binanceSymbol = getBinanceSymbol(coinId)
    if (binanceSymbol && binancePrices.has(binanceSymbol)) {
      return parseFloat(binancePrices.get(binanceSymbol)!.priceChangePercent)
    }
    return coinData.get(coinId)?.price_change_percentage_24h || 0
  }, [binancePrices, coinData])

  // Price flash effect
  useEffect(() => {
    watchlist.forEach(item => {
      const currentPrice = getRealTimePrice(item.coin_id)
      const prevPrice = prevPricesRef.current[item.coin_id]

      if (prevPrice !== undefined && prevPrice !== currentPrice) {
        const direction = currentPrice > prevPrice ? 'up' : 'down'
        setPriceFlash(prev => ({ ...prev, [item.coin_id]: direction }))
        setTimeout(() => {
          setPriceFlash(prev => ({ ...prev, [item.coin_id]: null }))
        }, 500)
      }

      prevPricesRef.current[item.coin_id] = currentPrice
    })
  }, [watchlist, binancePrices, getRealTimePrice])

  const removeFromWatchlist = async (e: React.MouseEvent, coinId: string) => {
    e.stopPropagation()
    if (!user && !walletAddress) return

    let query = supabase.from('watchlist').delete().eq('coin_id', coinId)

    if (user) {
      query = query.eq('user_id', user.id)
    } else if (walletAddress) {
      query = query.eq('wallet_address', walletAddress.toLowerCase())
    }

    const { error } = await query

    if (!error) {
      setWatchlist(prev => prev.filter(item => item.coin_id !== coinId))
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`
    return `$${num.toLocaleString()}`
  }

  const formatPrice = (price: number) => {
    if (price >= 1) return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    return `$${price.toFixed(6)}`
  }

  if (!user && !isWalletConnected && !loading) {
    return (
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Star className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-4">관심 코인</h1>
          <p className="text-gray-400 mb-6">
            관심 코인을 추가하려면 로그인이 필요합니다.
          </p>
          <Link
            href="/prices"
            className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            시세 페이지로 이동
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="h-10 bg-purple-500/20 rounded w-48 mb-2" />
            <div className="h-4 bg-purple-500/20 rounded w-32" />
          </div>
          <div className="glass rounded-xl p-8">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-purple-500/20 rounded w-1/4" />
                  </div>
                  <div className="h-4 bg-purple-500/20 rounded w-20" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Star className="w-8 h-8 text-yellow-400" fill="currentColor" />
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              관심 코인
            </h1>
            {wsConnected && (
              <span className="flex items-center gap-1.5 px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-green-400 text-xs">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                LIVE
              </span>
            )}
          </div>
          <p className="text-gray-400">
            {watchlist.length}개의 코인을 관심 목록에 추가했습니다
          </p>
        </div>

        {/* Watchlist */}
        {watchlist.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center">
            <Star className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">관심 목록이 비어있습니다.</p>
            <Link
              href="/prices"
              className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              코인 둘러보기
            </Link>
          </div>
        ) : (
          <div className="glass rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-space-800/50">
                  <tr className="text-left text-gray-400 text-sm">
                    <th className="px-4 py-4 w-12"></th>
                    <th className="px-4 py-4">#</th>
                    <th className="px-4 py-4">코인</th>
                    <th className="px-4 py-4 text-right">가격</th>
                    <th className="px-4 py-4 text-right">24h</th>
                    <th className="px-4 py-4 text-right hidden md:table-cell">시가총액</th>
                    <th className="px-4 py-4 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-500/10">
                  {watchlist.map((item) => {
                    const coin = coinData.get(item.coin_id)
                    const price = getRealTimePrice(item.coin_id)
                    const change = getRealTimeChange(item.coin_id)

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-purple-500/5 transition-colors cursor-pointer"
                        onClick={() => router.push(`/coin/${item.coin_id}`)}
                      >
                        <td className="px-4 py-4">
                          <Star className="w-5 h-5 text-yellow-400" fill="currentColor" />
                        </td>
                        <td className="px-4 py-4 text-gray-500">
                          {coin?.market_cap_rank || '-'}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            {coin?.image ? (
                              <Image
                                src={coin.image}
                                alt={item.coin_name}
                                width={32}
                                height={32}
                                className="rounded-full"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-medium">
                                {item.coin_symbol[0]}
                              </div>
                            )}
                            <div>
                              <p className="text-white font-medium">{item.coin_name}</p>
                              <p className="text-gray-500 text-sm">{item.coin_symbol}</p>
                            </div>
                          </div>
                        </td>
                        <td className={`px-4 py-4 text-right font-mono transition-colors duration-300 ${
                          priceFlash[item.coin_id] === 'up'
                            ? 'text-green-300 bg-green-500/20'
                            : priceFlash[item.coin_id] === 'down'
                              ? 'text-red-300 bg-red-500/20'
                              : 'text-white'
                        }`}>
                          {price > 0 ? formatPrice(price) : '-'}
                        </td>
                        <td className={`px-4 py-4 text-right font-medium ${
                          change >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {change !== 0 ? (
                            <>
                              {change >= 0 ? '+' : ''}
                              {change.toFixed(2)}%
                            </>
                          ) : '-'}
                        </td>
                        <td className="px-4 py-4 text-right text-gray-300 hidden md:table-cell">
                          {coin?.market_cap ? formatNumber(coin.market_cap) : '-'}
                        </td>
                        <td className="px-4 py-4">
                          <button
                            onClick={(e) => removeFromWatchlist(e, item.coin_id)}
                            className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                            title="관심 목록에서 제거"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
