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
  // Ad-related fields
  is_ad?: boolean
  sponsored?: boolean
  tags?: string
}

// Ad filtering keywords (case-insensitive)
const AD_KEYWORDS = [
  'sponsored',
  'advertisement',
  'promoted',
  'partner content',
  'paid content',
  'press release',
  'promo',
  'affiliate',
]

// Check if news item is an ad
function isAdContent(item: CryptoCompareNews): boolean {
  // Check explicit ad flags
  if (item.is_ad || item.sponsored) return true

  // Check title and body for ad keywords
  const titleLower = item.title.toLowerCase()
  const bodyLower = item.body.toLowerCase()
  const sourceLower = item.source.toLowerCase()

  for (const keyword of AD_KEYWORDS) {
    if (titleLower.includes(keyword) || bodyLower.includes(keyword)) {
      return true
    }
  }

  // Filter out known ad sources
  const adSources = ['pressat', 'accesswire', 'newsbtc', 'ambcrypto']
  for (const adSource of adSources) {
    if (sourceLower.includes(adSource)) {
      return true
    }
  }

  return false
}

// Content-based category detection
function detectCategory(title: string, body: string): string {
  const content = (title + ' ' + body).toLowerCase()

  // Bitcoin keywords
  if (content.includes('bitcoin') || content.includes('btc') || content.includes('비트코인')) {
    return 'bitcoin'
  }

  // Ethereum keywords
  if (content.includes('ethereum') || content.includes('eth') || content.includes('이더리움') || content.includes('vitalik')) {
    return 'ethereum'
  }

  // DeFi keywords
  if (content.includes('defi') || content.includes('decentralized finance') || content.includes('uniswap') ||
      content.includes('aave') || content.includes('compound') || content.includes('liquidity') ||
      content.includes('yield') || content.includes('staking')) {
    return 'defi'
  }

  // NFT keywords
  if (content.includes('nft') || content.includes('non-fungible') || content.includes('opensea') ||
      content.includes('collectible') || content.includes('digital art')) {
    return 'nft'
  }

  // Regulation keywords
  if (content.includes('regulation') || content.includes('sec') || content.includes('regulat') ||
      content.includes('법') || content.includes('규제') || content.includes('government') ||
      content.includes('legal') || content.includes('compliance') || content.includes('law') ||
      content.includes('cftc') || content.includes('congress')) {
    return 'regulation'
  }

  return 'all'
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

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const category = searchParams.get('category') || 'all'
  const page = parseInt(searchParams.get('page') || '1')
  const perPage = 12

  try {
    // Fetch more news to have enough after filtering
    const url = `${CRYPTOCOMPARE_API_BASE}/news/?lang=EN&limit=100`

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
    let news: CryptoCompareNews[] = data.Data || []

    // Step 1: Filter out ads
    news = news.filter((item: CryptoCompareNews) => !isAdContent(item))

    // Step 2: Detect and assign categories based on content
    const newsWithCategories = news.map((item: CryptoCompareNews) => ({
      ...item,
      detectedCategory: detectCategory(item.title, item.body),
    }))

    // Step 3: Filter by category if not 'all'
    let filteredNews = newsWithCategories
    if (category !== 'all') {
      filteredNews = newsWithCategories.filter(
        (item) => item.detectedCategory === category
      )
    }

    // Map to our format
    const formattedNews = filteredNews.map((item) => ({
      id: item.id,
      title: item.title,
      summary: generateAISummary(item.body, item.title),
      category: item.detectedCategory,
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
