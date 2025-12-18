// Binance API 유틸리티
// 실시간 가격 데이터 및 시장 정보 조회

export interface CryptoPrice {
  symbol: string
  price: number
  change24h: number
  changePercent24h: number
  high24h: number
  low24h: number
  volume24h: number
}

export interface MarketOverview {
  btc: CryptoPrice
  eth: CryptoPrice
  sol: CryptoPrice
  xrp: CryptoPrice
  totalMarketCap?: number
  btcDominance?: number
}

// Binance API에서 단일 심볼 가격 조회
async function fetchTickerPrice(symbol: string): Promise<CryptoPrice | null> {
  try {
    const response = await fetch(
      `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}USDT`,
      { next: { revalidate: 60 } } // 1분 캐시
    )

    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`)
    }

    const data = await response.json()

    return {
      symbol: symbol,
      price: parseFloat(data.lastPrice),
      change24h: parseFloat(data.priceChange),
      changePercent24h: parseFloat(data.priceChangePercent),
      high24h: parseFloat(data.highPrice),
      low24h: parseFloat(data.lowPrice),
      volume24h: parseFloat(data.volume),
    }
  } catch (error) {
    console.error(`Error fetching ${symbol} price:`, error)
    return null
  }
}

// 여러 심볼 가격 한번에 조회
export async function fetchMarketOverview(): Promise<MarketOverview> {
  const symbols = ['BTC', 'ETH', 'SOL', 'XRP']

  const results = await Promise.all(
    symbols.map(symbol => fetchTickerPrice(symbol))
  )

  const defaultPrice: CryptoPrice = {
    symbol: '',
    price: 0,
    change24h: 0,
    changePercent24h: 0,
    high24h: 0,
    low24h: 0,
    volume24h: 0,
  }

  return {
    btc: results[0] || { ...defaultPrice, symbol: 'BTC' },
    eth: results[1] || { ...defaultPrice, symbol: 'ETH' },
    sol: results[2] || { ...defaultPrice, symbol: 'SOL' },
    xrp: results[3] || { ...defaultPrice, symbol: 'XRP' },
  }
}

// 가격 포맷팅
export function formatPrice(price: number, symbol: string = 'BTC'): string {
  if (symbol === 'XRP' || symbol === 'SOL') {
    return price.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    })
  }
  return price.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

// Fear & Greed Index 조회 (Alternative.me API)
export async function fetchFearGreedIndex(): Promise<number> {
  try {
    const response = await fetch(
      'https://api.alternative.me/fng/?limit=1',
      { next: { revalidate: 3600 } } // 1시간 캐시
    )

    if (!response.ok) {
      throw new Error('Fear & Greed API error')
    }

    const data = await response.json()
    return parseInt(data.data[0].value)
  } catch (error) {
    console.error('Error fetching Fear & Greed Index:', error)
    return 50 // 기본값: 중립
  }
}

// 시장 분석용 데이터 수집
export async function collectMarketData(): Promise<{
  prices: MarketOverview
  fearGreedIndex: number
  timestamp: string
}> {
  const [prices, fearGreedIndex] = await Promise.all([
    fetchMarketOverview(),
    fetchFearGreedIndex(),
  ])

  return {
    prices,
    fearGreedIndex,
    timestamp: new Date().toISOString(),
  }
}
