'use client'

import Link from 'next/link'
import Image from 'next/image'
import { formatPrice } from '@/lib/coingecko'
import { useMarketData } from '@/lib/hooks/useCrypto'
import { Skeleton } from '@/components/ui/Skeleton'

export default function MarketSection() {
    const { data, isLoading: loading } = useMarketData(5)
    const prices = data?.coins || []

    return (
        <section className="py-20 px-4 bg-[#0a0a1a]">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="font-comic text-4xl md:text-5xl font-bold text-white mb-4">
                        실시간 시세 📊
                    </h2>
                    <p className="font-gaegu text-xl text-gray-400">
                        지금 코인들은 어떻게 움직이고 있을까?
                    </p>
                </div>

                <div className="glass rounded-3xl p-6 border border-purple-500/20">
                    {loading ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex items-center justify-between py-3">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="w-10 h-10 rounded-full" />
                                        <Skeleton className="w-24 h-4" />
                                    </div>
                                    <Skeleton className="w-20 h-4" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {prices.map((coin, index) => (
                                <Link key={coin.id} href={`/coin/${coin.id}`}>
                                    <div className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-purple-500/10 transition-colors cursor-pointer hover-bounce">
                                        <div className="flex items-center gap-4">
                                            <span className="font-comic text-gray-500 w-6">{index + 1}</span>
                                            <Image
                                                src={coin.image}
                                                alt={coin.name}
                                                width={40}
                                                height={40}
                                                className="rounded-full"
                                            />
                                            <div>
                                                <p className="font-comic text-white font-bold">{coin.name}</p>
                                                <p className="font-comic text-gray-500 text-sm uppercase">{coin.symbol}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-comic text-white font-bold">{formatPrice(coin.current_price)}</p>
                                            <p className={`font-comic text-sm font-bold ${coin.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {coin.price_change_percentage_24h >= 0 ? '🚀 +' : '📉 '}
                                                {coin.price_change_percentage_24h?.toFixed(2)}%
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    <Link href="/prices">
                        <button className="w-full mt-6 py-4 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-xl font-comic text-cyan-400 font-bold hover:from-purple-500/30 hover:to-cyan-500/30 transition-colors hover-bounce">
                            더 많은 코인 보기 →
                        </button>
                    </Link>
                </div>
            </div>
        </section>
    )
}
