import { NextRequest, NextResponse } from 'next/server'

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const searchParams = request.nextUrl.searchParams
  const days = searchParams.get('days') || '7'

  try {
    // Fetch coin details and market chart in parallel
    const [detailsRes, chartRes] = await Promise.all([
      fetch(`${COINGECKO_API_BASE}/coins/${id}?localization=false&tickers=false&community_data=false&developer_data=false`, {
        next: { revalidate: 60 },
        headers: { Accept: 'application/json' },
      }),
      fetch(`${COINGECKO_API_BASE}/coins/${id}/market_chart?vs_currency=usd&days=${days}`, {
        next: { revalidate: 300 },
        headers: { Accept: 'application/json' },
      }),
    ])

    if (!detailsRes.ok) {
      throw new Error(`CoinGecko API error: ${detailsRes.status}`)
    }

    const details = await detailsRes.json()
    const chartData = chartRes.ok ? await chartRes.json() : { prices: [] }

    // Format chart data for recharts
    const priceHistory = chartData.prices?.map(([timestamp, price]: [number, number]) => ({
      time: timestamp,
      date: new Date(timestamp).toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
        hour: days === '1' ? '2-digit' : undefined,
      }),
      price,
    })) || []

    return NextResponse.json({
      id: details.id,
      name: details.name,
      symbol: details.symbol?.toUpperCase(),
      image: details.image?.large,
      description: details.description?.ko || details.description?.en || '',
      current_price: details.market_data?.current_price?.usd,
      price_change_24h: details.market_data?.price_change_percentage_24h,
      price_change_7d: details.market_data?.price_change_percentage_7d,
      price_change_30d: details.market_data?.price_change_percentage_30d,
      market_cap: details.market_data?.market_cap?.usd,
      market_cap_rank: details.market_cap_rank,
      total_volume: details.market_data?.total_volume?.usd,
      circulating_supply: details.market_data?.circulating_supply,
      total_supply: details.market_data?.total_supply,
      max_supply: details.market_data?.max_supply,
      ath: details.market_data?.ath?.usd,
      ath_date: details.market_data?.ath_date?.usd,
      atl: details.market_data?.atl?.usd,
      atl_date: details.market_data?.atl_date?.usd,
      high_24h: details.market_data?.high_24h?.usd,
      low_24h: details.market_data?.low_24h?.usd,
      price_history: priceHistory,
      links: {
        homepage: details.links?.homepage?.[0],
        twitter: details.links?.twitter_screen_name,
        github: details.links?.repos_url?.github?.[0],
      },
    })
  } catch (error) {
    console.error('Error fetching coin details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch coin details' },
      { status: 500 }
    )
  }
}
