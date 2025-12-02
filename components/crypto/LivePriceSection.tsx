'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useBinanceWebSocket, getBinanceSymbol } from '@/lib/hooks/useBinanceWebSocket'
import Button from '@/components/ui/Button'

interface Coin {
  id: string
  name: string
  symbol: string
  image: string
  current_price: number
  price_change_percentage_24h: number
  market_cap: number
  total_volume: number
  market_cap_rank: number
}

interface LivePriceSectionProps {
  initialCoins: Coin[]
}

export default function LivePriceSection({ initialCoins }: LivePriceSectionProps) {
  const [coins] = useState<Coin[]>(initialCoins)
  const [priceFlash, setPriceFlash] = useState<Record<string, 'up' | 'down' | null>>({})
  const prevPricesRef = useRef<Record<string, number>>({})

  // Get coin IDs for WebSocket subscription
  const coinIds = coins.map(coin => coin.id)
  const { prices: binancePrices, isConnected: wsConnected } = useBinanceWebSocket(coinIds)

  // Get real-time price from Binance or fallback to CoinGecko
  const getRealTimePrice = useCallback((coin: Coin): number => {
    const binanceSymbol = getBinanceSymbol(coin.id)
    if (binanceSymbol && binancePrices.has(binanceSymbol)) {
      return parseFloat(binancePrices.get(binanceSymbol)!.price)
    }
    return coin.current_price
  }, [binancePrices])

  // Get real-time 24h change from Binance or fallback to CoinGecko
  const getRealTimeChange = useCallback((coin: Coin): number => {
    const binanceSymbol = getBinanceSymbol(coin.id)
    if (binanceSymbol && binancePrices.has(binanceSymbol)) {
      return parseFloat(binancePrices.get(binanceSymbol)!.priceChangePercent)
    }
    return coin.price_change_percentage_24h
  }, [binancePrices])

  // Price flash effect when price changes
  useEffect(() => {
    coins.forEach(coin => {
      const currentPrice = getRealTimePrice(coin)
      const prevPrice = prevPricesRef.current[coin.id]

      if (prevPrice !== undefined && prevPrice !== currentPrice) {
        const direction = currentPrice > prevPrice ? 'up' : 'down'
        setPriceFlash(prev => ({ ...prev, [coin.id]: direction }))

        setTimeout(() => {
          setPriceFlash(prev => ({ ...prev, [coin.id]: null }))
        }, 500)
      }

      prevPricesRef.current[coin.id] = currentPrice
    })
  }, [coins, binancePrices, getRealTimePrice])

  const formatPrice = (price: number) => {
    if (price >= 1) return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    return `$${price.toFixed(6)}`
  }

  const formatMarketCap = (num: number) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`
    return `$${num.toLocaleString()}`
  }

  const formatPercentage = (percent: number) => {
    const sign = percent >= 0 ? '+' : ''
    return `${sign}${percent?.toFixed(2)}%`
  }

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                실시간 시세
              </h2>
              {wsConnected && (
                <span className="flex items-center gap-1.5 px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-green-400 text-xs">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  LIVE
                </span>
              )}
            </div>
            <p className="text-gray-400">상위 10개 암호화폐</p>
          </div>
          <Link href="/prices">
            <Button variant="ghost">
              전체 보기 →
            </Button>
          </Link>
        </div>

        {coins.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {coins.slice(0, 10).map((coin) => {
              const realTimePrice = getRealTimePrice(coin)
              const realTimeChange = getRealTimeChange(coin)
              const priceChangeColor = realTimeChange >= 0 ? 'text-green-400' : 'text-red-400'
              const flashClass = priceFlash[coin.id] === 'up'
                ? 'bg-green-500/20'
                : priceFlash[coin.id] === 'down'
                  ? 'bg-red-500/20'
                  : ''

              return (
                <Link key={coin.id} href={`/coin/${coin.id}`}>
                  <div className={`glass rounded-xl p-4 card-hover transition-colors duration-300 ${flashClass}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-gray-500 text-sm font-medium w-6">
                          #{coin.market_cap_rank}
                        </span>
                        <div className="relative w-8 h-8">
                          <Image
                            src={coin.image}
                            alt={coin.name}
                            fill
                            className="rounded-full"
                            sizes="32px"
                          />
                        </div>
                        <div>
                          <h3 className="text-white font-medium">{coin.name}</h3>
                          <p className="text-gray-400 text-sm uppercase">{coin.symbol}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className={`text-white font-medium font-mono transition-colors duration-300 ${
                          priceFlash[coin.id] === 'up' ? 'text-green-300' :
                          priceFlash[coin.id] === 'down' ? 'text-red-300' : ''
                        }`}>
                          {formatPrice(realTimePrice)}
                        </p>
                        <p className={`text-sm font-medium ${priceChangeColor}`}>
                          {formatPercentage(realTimeChange)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-purple-500/20">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">시가총액</span>
                        <span className="text-gray-300">{formatMarketCap(coin.market_cap)}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-gray-400">24h 거래량</span>
                        <span className="text-gray-300">{formatMarketCap(coin.total_volume)}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="glass rounded-xl p-8 text-center">
            <p className="text-gray-400">시세 데이터를 불러오는 중...</p>
          </div>
        )}
      </div>
    </section>
  )
}
