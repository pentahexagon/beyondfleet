import { NextRequest, NextResponse } from 'next/server'

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const page = searchParams.get('page') || '1'
  const perPage = searchParams.get('per_page') || '20'
  const search = searchParams.get('search') || ''
  const sortBy = searchParams.get('sort_by') || 'market_cap'
  const sortOrder = searchParams.get('sort_order') || 'desc'

  try {
    // Fetch 100 coins from CoinGecko for metadata
    const url = new URL(`${COINGECKO_API_BASE}/coins/markets`)
    url.searchParams.set('vs_currency', 'usd')
    url.searchParams.set('order', 'market_cap_desc')
    url.searchParams.set('per_page', '100')
    url.searchParams.set('page', '1')
    url.searchParams.set('sparkline', 'false')
    url.searchParams.set('price_change_percentage', '24h')

    const response = await fetch(url.toString(), {
      next: { revalidate: 60 },
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`)
    }

    let coins = await response.json()

    // Filter by search query if provided
    if (search) {
      const query = search.toLowerCase()
      coins = coins.filter(
        (coin: { name: string; symbol: string }) =>
          coin.name.toLowerCase().includes(query) ||
          coin.symbol.toLowerCase().includes(query)
      )
    }

    // Sort coins
    const sortKey = sortBy === 'price' ? 'current_price'
                  : sortBy === 'change' ? 'price_change_percentage_24h'
                  : sortBy === 'volume' ? 'total_volume'
                  : 'market_cap'

    coins.sort((a: Record<string, number>, b: Record<string, number>) => {
      const aVal = a[sortKey] ?? 0
      const bVal = b[sortKey] ?? 0
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
    })

    // Paginate
    const pageNum = parseInt(page)
    const perPageNum = parseInt(perPage)
    const startIndex = (pageNum - 1) * perPageNum
    const paginatedCoins = coins.slice(startIndex, startIndex + perPageNum)

    // Return all coin IDs for WebSocket subscription
    const allCoinIds = coins.map((c: { id: string }) => c.id)

    return NextResponse.json({
      coins: paginatedCoins,
      allCoinIds,
      total: coins.length,
      page: pageNum,
      per_page: perPageNum,
      total_pages: Math.ceil(coins.length / perPageNum),
    })
  } catch (error) {
    console.error('Error fetching prices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch prices' },
      { status: 500 }
    )
  }
}
