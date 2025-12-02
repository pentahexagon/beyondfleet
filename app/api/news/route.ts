import { NextRequest, NextResponse } from 'next/server'

const CRYPTOCOMPARE_API_BASE = 'https://min-api.cryptocompare.com/data/v2'

interface CryptoCompareNews {
  id: string
  title: string
  body: string
  categories: string
  url: string
  imageurl: string
  source: string
  published_on: number
}

// Category mapping for CryptoCompare
const CATEGORY_MAP: Record<string, string> = {
  all: '',
  bitcoin: 'BTC',
  ethereum: 'ETH',
  defi: 'DEFI',
  nft: 'NFT',
  regulation: 'Regulation',
}

// Simple AI summary generator (keyword extraction based)
function generateAISummary(body: string, title: string): string {
  // Clean HTML tags
  const cleanBody = body.replace(/<[^>]*>/g, '').trim()

  // Get first 2-3 sentences as summary
  const sentences = cleanBody.split(/[.!?]+/).filter(s => s.trim().length > 20)
  const summary = sentences.slice(0, 2).join('. ').trim()

  if (summary.length > 200) {
    return summary.slice(0, 197) + '...'
  }

  return summary || title
}

// Map CryptoCompare categories to our categories
function mapCategory(categories: string): string {
  const cats = categories.toLowerCase()
  if (cats.includes('btc') || cats.includes('bitcoin')) return 'bitcoin'
  if (cats.includes('eth') || cats.includes('ethereum')) return 'ethereum'
  if (cats.includes('defi')) return 'defi'
  if (cats.includes('nft')) return 'nft'
  if (cats.includes('regulation') || cats.includes('law') || cats.includes('government')) return 'regulation'
  return 'all'
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const category = searchParams.get('category') || 'all'
  const page = parseInt(searchParams.get('page') || '1')
  const perPage = 12

  try {
    // Build CryptoCompare API URL
    let url = `${CRYPTOCOMPARE_API_BASE}/news/?lang=EN`

    // Add category filter if not 'all'
    if (category !== 'all' && CATEGORY_MAP[category]) {
      url += `&categories=${CATEGORY_MAP[category]}`
    }

    const response = await fetch(url, {
      next: { revalidate: 300 }, // Cache for 5 minutes
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`CryptoCompare API error: ${response.status}`)
    }

    const data = await response.json()
    let news = data.Data || []

    // Filter by category if needed
    if (category !== 'all') {
      news = news.filter((item: CryptoCompareNews) => {
        const itemCategory = mapCategory(item.categories)
        return itemCategory === category || category === 'all'
      })
    }

    // Map to our format
    const formattedNews = news.map((item: CryptoCompareNews) => ({
      id: item.id,
      title: item.title,
      summary: generateAISummary(item.body, item.title),
      category: mapCategory(item.categories),
      source: item.source,
      source_url: item.url,
      image_url: item.imageurl,
      published_at: new Date(item.published_on * 1000).toISOString(),
    }))

    // Paginate
    const startIndex = (page - 1) * perPage
    const paginatedNews = formattedNews.slice(startIndex, startIndex + perPage)
    const totalPages = Math.ceil(formattedNews.length / perPage)

    return NextResponse.json({
      news: paginatedNews,
      total: formattedNews.length,
      page,
      per_page: perPage,
      total_pages: totalPages,
    })
  } catch (error) {
    console.error('Error fetching news:', error)
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    )
  }
}
