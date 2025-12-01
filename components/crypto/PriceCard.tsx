'use client'

import Image from 'next/image'
import { CoinMarket } from '@/types'
import { formatPrice, formatMarketCap, formatPercentage } from '@/lib/coingecko'

interface PriceCardProps {
  coin: CoinMarket
  rank?: boolean
}

export default function PriceCard({ coin, rank = true }: PriceCardProps) {
  const priceChangeColor =
    coin.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'

  return (
    <div className="glass rounded-xl p-4 card-hover">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {rank && (
            <span className="text-gray-500 text-sm font-medium w-6">
              #{coin.market_cap_rank}
            </span>
          )}
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
          <p className="text-white font-medium">{formatPrice(coin.current_price)}</p>
          <p className={`text-sm font-medium ${priceChangeColor}`}>
            {formatPercentage(coin.price_change_percentage_24h)}
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
  )
}
