'use client'

import Image from 'next/image'
import { CoinMarket } from '@/types'
import { formatPrice, formatMarketCap, formatPercentage } from '@/lib/coingecko'

interface PriceTableProps {
  coins: CoinMarket[]
}

export default function PriceTable({ coins }: PriceTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left text-gray-400 text-sm border-b border-purple-500/20">
            <th className="pb-4 pr-4">#</th>
            <th className="pb-4 pr-4">코인</th>
            <th className="pb-4 pr-4 text-right">가격</th>
            <th className="pb-4 pr-4 text-right">24h</th>
            <th className="pb-4 pr-4 text-right hidden md:table-cell">시가총액</th>
            <th className="pb-4 text-right hidden lg:table-cell">거래량 (24h)</th>
          </tr>
        </thead>
        <tbody>
          {coins.map((coin) => {
            const priceChangeColor =
              coin.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'

            return (
              <tr
                key={coin.id}
                className="border-b border-purple-500/10 hover:bg-purple-500/5 transition-colors cursor-pointer"
              >
                <td className="py-4 pr-4 text-gray-400">{coin.market_cap_rank}</td>
                <td className="py-4 pr-4">
                  <div className="flex items-center space-x-3">
                    <div className="relative w-8 h-8 flex-shrink-0">
                      <Image
                        src={coin.image}
                        alt={coin.name}
                        fill
                        className="rounded-full"
                        sizes="32px"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-medium truncate">{coin.name}</p>
                      <p className="text-gray-400 text-sm uppercase">{coin.symbol}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 pr-4 text-right text-white font-medium">
                  {formatPrice(coin.current_price)}
                </td>
                <td className={`py-4 pr-4 text-right font-medium ${priceChangeColor}`}>
                  {formatPercentage(coin.price_change_percentage_24h)}
                </td>
                <td className="py-4 pr-4 text-right text-gray-300 hidden md:table-cell">
                  {formatMarketCap(coin.market_cap)}
                </td>
                <td className="py-4 text-right text-gray-300 hidden lg:table-cell">
                  {formatMarketCap(coin.total_volume)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
