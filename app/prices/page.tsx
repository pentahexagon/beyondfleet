import { Suspense } from 'react'
import { getMarketData } from '@/lib/coingecko'
import PriceTable from '@/components/crypto/PriceTable'
import SearchBar from './SearchBar'
import Pagination from './Pagination'

export const revalidate = 60

interface PricesPageProps {
  searchParams: Promise<{ page?: string; search?: string }>
}

async function PricesList({ page, search }: { page: number; search: string }) {
  const perPage = 20

  try {
    let coins = await getMarketData(search ? 1 : page, search ? 250 : perPage)

    // Filter by search query if provided
    if (search) {
      const query = search.toLowerCase()
      coins = coins.filter(
        (coin) =>
          coin.name.toLowerCase().includes(query) ||
          coin.symbol.toLowerCase().includes(query)
      )
    }

    const displayCoins = search ? coins.slice(0, 50) : coins

    if (displayCoins.length === 0) {
      return (
        <div className="glass rounded-xl p-8 text-center">
          <p className="text-gray-400">
            {search
              ? `"${search}"에 대한 검색 결과가 없습니다.`
              : '시세 데이터를 불러올 수 없습니다.'}
          </p>
        </div>
      )
    }

    return (
      <>
        <div className="glass rounded-xl p-4 md:p-6">
          <PriceTable coins={displayCoins} />
        </div>

        {!search && (
          <div className="mt-6">
            <Pagination currentPage={page} hasMore={coins.length === perPage} />
          </div>
        )}
      </>
    )
  } catch (error) {
    console.error('Error loading prices:', error)
    return (
      <div className="glass rounded-xl p-8 text-center">
        <p className="text-red-400">시세 데이터를 불러오는 중 오류가 발생했습니다.</p>
      </div>
    )
  }
}

function PricesLoading() {
  return (
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
  )
}

export default async function PricesPage({ searchParams }: PricesPageProps) {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const search = params.search || ''

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            실시간 암호화폐 시세
          </h1>
          <p className="text-gray-400">
            CoinGecko API를 통해 실시간으로 업데이트됩니다.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <SearchBar initialValue={search} />
        </div>

        {/* Price Table */}
        <Suspense fallback={<PricesLoading />}>
          <PricesList page={page} search={search} />
        </Suspense>
      </div>
    </div>
  )
}
