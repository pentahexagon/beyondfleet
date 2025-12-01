import { CoinMarket } from '@/types'

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3'

export async function getMarketData(
  page: number = 1,
  perPage: number = 20,
  sparkline: boolean = false
): Promise<CoinMarket[]> {
  const url = new URL(`${COINGECKO_API_BASE}/coins/markets`)
  url.searchParams.set('vs_currency', 'usd')
  url.searchParams.set('order', 'market_cap_desc')
  url.searchParams.set('per_page', perPage.toString())
  url.searchParams.set('page', page.toString())
  url.searchParams.set('sparkline', sparkline.toString())

  const response = await fetch(url.toString(), {
    next: { revalidate: 60 }, // Cache for 60 seconds
    headers: {
      'Accept': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status}`)
  }

  return response.json()
}

export async function searchCoins(query: string): Promise<CoinMarket[]> {
  const allCoins = await getMarketData(1, 250) // Get top 250 coins

  const filtered = allCoins.filter(
    (coin) =>
      coin.name.toLowerCase().includes(query.toLowerCase()) ||
      coin.symbol.toLowerCase().includes(query.toLowerCase())
  )

  return filtered
}

export function formatPrice(price: number): string {
  if (price >= 1) {
    return price.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  // For very small prices, show more decimals
  return price.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  })
}

export function formatMarketCap(marketCap: number): string {
  if (marketCap >= 1e12) {
    return `$${(marketCap / 1e12).toFixed(2)}T`
  }
  if (marketCap >= 1e9) {
    return `$${(marketCap / 1e9).toFixed(2)}B`
  }
  if (marketCap >= 1e6) {
    return `$${(marketCap / 1e6).toFixed(2)}M`
  }
  return `$${marketCap.toLocaleString()}`
}

export function formatPercentage(percentage: number): string {
  const formatted = percentage.toFixed(2)
  return percentage >= 0 ? `+${formatted}%` : `${formatted}%`
}
