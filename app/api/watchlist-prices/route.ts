import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const ids = searchParams.get('ids')

  if (!ids) {
    return NextResponse.json({ coins: [] })
  }

  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false`,
      {
        headers: {
          'Accept': 'application/json',
        },
        next: { revalidate: 30 }, // Cache for 30 seconds
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch from CoinGecko')
    }

    const data = await response.json()

    const coins = data.map((coin: {
      id: string
      name: string
      symbol: string
      image: string
      current_price: number
      price_change_percentage_24h: number
      market_cap: number
      market_cap_rank: number
    }) => ({
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol.toUpperCase(),
      image: coin.image,
      current_price: coin.current_price,
      price_change_percentage_24h: coin.price_change_percentage_24h,
      market_cap: coin.market_cap,
      market_cap_rank: coin.market_cap_rank,
    }))

    return NextResponse.json({ coins })
  } catch (error) {
    console.error('Error fetching watchlist prices:', error)
    return NextResponse.json({ coins: [] }, { status: 500 })
  }
}
