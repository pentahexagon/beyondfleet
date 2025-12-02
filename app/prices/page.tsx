'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'

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

type SortBy = 'market_cap' | 'price' | 'change' | 'volume'
type SortOrder = 'asc' | 'desc'

function PricesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [coins, setCoins] = useState<Coin[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [sortBy, setSortBy] = useState<SortBy>('market_cap')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'))
  const [totalPages, setTotalPages] = useState(1)

  const fetchCoins = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: '10',
        search,
        sort_by: sortBy,
        sort_order: sortOrder,
      })

      const res = await fetch(`/api/prices?${params}`)
      const data = await res.json()

      if (data.coins) {
        setCoins(data.coins)
        setTotalPages(data.total_pages || 1)
      }
    } catch (error) {
      console.error('Error fetching coins:', error)
    } finally {
      setLoading(false)
    }
  }, [currentPage, search, sortBy, sortOrder])

  useEffect(() => {
    fetchCoins()
  }, [fetchCoins])

  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (currentPage > 1) params.set('page', currentPage.toString())
    router.replace(`/prices?${params.toString()}`, { scroll: false })
  }, [search, currentPage, router])

  const handleSort = (column: SortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
    setCurrentPage(1)
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

  const SortIcon = ({ column }: { column: SortBy }) => {
    if (sortBy !== column) return <span className="text-gray-600 ml-1">↕</span>
    return <span className="text-cyan-400 ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            실시간 암호화폐 시세
          </h1>
          <p className="text-gray-400">
            상위 100개 코인 | CoinGecko API
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="코인 이름 또는 심볼로 검색..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full md:w-96 px-4 py-3 pl-12 bg-space-800/50 border border-purple-500/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="glass rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8">
              <div className="animate-pulse space-y-4">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-purple-500/20 rounded-full" />
                    <div className="flex-1">
                      <div className="h-4 bg-purple-500/20 rounded w-1/4" />
                    </div>
                    <div className="h-4 bg-purple-500/20 rounded w-20" />
                    <div className="h-4 bg-purple-500/20 rounded w-16" />
                    <div className="h-4 bg-purple-500/20 rounded w-24" />
                  </div>
                ))}
              </div>
            </div>
          ) : coins.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              {search ? `"${search}"에 대한 검색 결과가 없습니다.` : '데이터를 불러올 수 없습니다.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-space-800/50">
                  <tr className="text-left text-gray-400 text-sm">
                    <th className="px-4 py-4 w-16">#</th>
                    <th className="px-4 py-4">코인</th>
                    <th className="px-4 py-4 text-right cursor-pointer hover:text-white" onClick={() => handleSort('price')}>
                      가격 <SortIcon column="price" />
                    </th>
                    <th className="px-4 py-4 text-right cursor-pointer hover:text-white" onClick={() => handleSort('change')}>
                      24h <SortIcon column="change" />
                    </th>
                    <th className="px-4 py-4 text-right cursor-pointer hover:text-white hidden md:table-cell" onClick={() => handleSort('market_cap')}>
                      시가총액 <SortIcon column="market_cap" />
                    </th>
                    <th className="px-4 py-4 text-right cursor-pointer hover:text-white hidden lg:table-cell" onClick={() => handleSort('volume')}>
                      24h 거래량 <SortIcon column="volume" />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-500/10">
                  {coins.map((coin) => (
                    <tr
                      key={coin.id}
                      className="hover:bg-purple-500/5 transition-colors cursor-pointer"
                      onClick={() => router.push(`/coin/${coin.id}`)}
                    >
                      <td className="px-4 py-4 text-gray-500">{coin.market_cap_rank}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <Image
                            src={coin.image}
                            alt={coin.name}
                            width={32}
                            height={32}
                            className="rounded-full"
                          />
                          <div>
                            <p className="text-white font-medium">{coin.name}</p>
                            <p className="text-gray-500 text-sm">{coin.symbol.toUpperCase()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right text-white font-mono">
                        {formatPrice(coin.current_price)}
                      </td>
                      <td className={`px-4 py-4 text-right font-medium ${
                        coin.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {coin.price_change_percentage_24h >= 0 ? '+' : ''}
                        {coin.price_change_percentage_24h?.toFixed(2)}%
                      </td>
                      <td className="px-4 py-4 text-right text-gray-300 hidden md:table-cell">
                        {formatNumber(coin.market_cap)}
                      </td>
                      <td className="px-4 py-4 text-right text-gray-300 hidden lg:table-cell">
                        {formatNumber(coin.total_volume)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg bg-space-800/50 text-gray-400 hover:text-white hover:bg-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← 이전
            </button>

            <div className="flex items-center gap-1">
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 rounded-lg ${
                      currentPage === pageNum
                        ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white'
                        : 'bg-space-800/50 text-gray-400 hover:text-white hover:bg-purple-500/20'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-lg bg-space-800/50 text-gray-400 hover:text-white hover:bg-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              다음 →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function PricesLoading() {
  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="h-10 bg-purple-500/20 rounded w-64 mb-2" />
          <div className="h-4 bg-purple-500/20 rounded w-48" />
        </div>
        <div className="glass rounded-xl p-8">
          <div className="animate-pulse space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-purple-500/20 rounded-full" />
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

export default function PricesPage() {
  return (
    <Suspense fallback={<PricesLoading />}>
      <PricesContent />
    </Suspense>
  )
}
