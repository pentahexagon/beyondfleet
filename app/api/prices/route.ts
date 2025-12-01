import { NextRequest, NextResponse } from 'next/server'

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const page = searchParams.get('page') || '1'
  const perPage = searchParams.get('per_page') || '20'
  const search = searchParams.get('search') || ''

  try {
    const url = new URL(`${COINGECKO_API_BASE}/coins/markets`)
    url.searchParams.set('vs_currency', 'usd')
    url.searchParams.set('order', 'market_cap_desc')
    url.searchParams.set('per_page', search ? '250' : perPage)
    url.searchParams.set('page', search ? '1' : page)
    url.searchParams.set('sparkline', 'false')

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

    return NextResponse.json({
      coins,
      total: coins.length,
      page: parseInt(page),
      per_page: parseInt(perPage),
    })
  } catch (error) {
    console.error('Error fetching prices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch prices' },
      { status: 500 }
    )
  }
}
