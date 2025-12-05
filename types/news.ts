export interface News {
  id: string
  title: string
  content: string
  summary?: string
  source?: string
  source_url?: string
  image_url?: string
  category: string
  is_published: boolean
  published_at?: string
  created_at: string
  updated_at: string
}

export const NEWS_CATEGORIES = [
  { value: 'general', label: '일반' },
  { value: 'bitcoin', label: '비트코인' },
  { value: 'ethereum', label: '이더리움' },
  { value: 'altcoin', label: '알트코인' },
  { value: 'defi', label: 'DeFi' },
  { value: 'nft', label: 'NFT' },
  { value: 'regulation', label: '규제' },
  { value: 'market', label: '시장' },
]
