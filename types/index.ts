// CoinGecko API Types
export interface CoinMarket {
  id: string
  symbol: string
  name: string
  image: string
  current_price: number
  market_cap: number
  market_cap_rank: number
  fully_diluted_valuation: number | null
  total_volume: number
  high_24h: number
  low_24h: number
  price_change_24h: number
  price_change_percentage_24h: number
  market_cap_change_24h: number
  market_cap_change_percentage_24h: number
  circulating_supply: number
  total_supply: number | null
  max_supply: number | null
  ath: number
  ath_change_percentage: number
  ath_date: string
  atl: number
  atl_change_percentage: number
  atl_date: string
  last_updated: string
  sparkline_in_7d?: {
    price: number[]
  }
}

// Membership Types
export type MembershipTier = 'cadet' | 'navigator' | 'pilot' | 'commander' | 'admiral'

export interface MembershipInfo {
  tier: MembershipTier
  name: string
  nameKr: string
  icon: string
  votePower: number
  benefits: string[]
  color: string
}

export const MEMBERSHIP_TIERS: Record<MembershipTier, MembershipInfo> = {
  cadet: {
    tier: 'cadet',
    name: 'Cadet',
    nameKr: '훈련생',
    icon: '🌱',
    votePower: 1,
    benefits: ['기본 시세 확인', '커뮤니티 접근', '무료 교육 콘텐츠'],
    color: 'from-green-400 to-green-600',
  },
  navigator: {
    tier: 'navigator',
    name: 'Navigator',
    nameKr: '항해사',
    icon: '⭐',
    votePower: 2,
    benefits: ['주간 마켓 리포트', '중급 교육 콘텐츠', '가격 알림 5개'],
    color: 'from-blue-400 to-blue-600',
  },
  pilot: {
    tier: 'pilot',
    name: 'Pilot',
    nameKr: '조종사',
    icon: '🚀',
    votePower: 3,
    benefits: ['실시간 가격 알림', '고급 교육 콘텐츠', '가격 알림 20개'],
    color: 'from-purple-400 to-purple-600',
  },
  commander: {
    tier: 'commander',
    name: 'Commander',
    nameKr: '사령관',
    icon: '🌟',
    votePower: 5,
    benefits: ['1:1 멘토링 세션', '프리미엄 리포트', '무제한 알림'],
    color: 'from-amber-400 to-amber-600',
  },
  admiral: {
    tier: 'admiral',
    name: 'Admiral',
    nameKr: '제독',
    icon: '🌌',
    votePower: 10,
    benefits: ['VIP 모든 혜택', '비공개 채널 접근', '운영진 투표권'],
    color: 'from-rose-400 to-rose-600',
  },
}

// User Types
export interface User {
  id: string
  email: string
  username: string | null
  avatar_url: string | null
  membership_tier: MembershipTier
  vote_power: number
  created_at: string
}

// API Response Types
export interface PricesResponse {
  coins: CoinMarket[]
  total: number
  page: number
  per_page: number
}
