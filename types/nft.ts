export type NFTTier = 'cadet' | 'navigator' | 'pilot' | 'commander' | 'admiral'

export interface NFT {
  id: string
  name: string
  description?: string
  image_url: string
  tier: NFTTier
  owner_id?: string
  is_listed: boolean
  price?: number
  created_at: string
  updated_at: string
}

export interface Auction {
  id: string
  nft_id: string
  nft?: NFT
  seller_id: string
  start_price: number
  current_bid?: number
  highest_bidder?: string
  start_time: string
  end_time: string
  status: 'active' | 'ended' | 'cancelled'
  created_at: string
}

export interface Bid {
  id: string
  auction_id: string
  user_id: string
  amount: number
  created_at: string
}

export type BoxType = 'basic' | 'premium' | 'legendary'

export interface RandomboxHistory {
  id: string
  user_id: string
  box_type: BoxType
  result_nft_id: string
  result_nft?: NFT
  sol_amount: number
  created_at: string
}

export interface Gift {
  id: string
  from_user: string
  to_wallet: string
  nft_id: string
  nft?: NFT
  message?: string
  created_at: string
}

export const TIER_INFO: Record<NFTTier, { name: string; nameKr: string; icon: string; color: string }> = {
  cadet: { name: 'Cadet', nameKr: '훈련생', icon: '🌱', color: 'from-green-400 to-green-600' },
  navigator: { name: 'Navigator', nameKr: '항해사', icon: '⭐', color: 'from-blue-400 to-blue-600' },
  pilot: { name: 'Pilot', nameKr: '조종사', icon: '🚀', color: 'from-purple-400 to-purple-600' },
  commander: { name: 'Commander', nameKr: '사령관', icon: '🌟', color: 'from-amber-400 to-amber-600' },
  admiral: { name: 'Admiral', nameKr: '제독', icon: '🌌', color: 'from-rose-400 to-rose-600' },
}

export const BOX_INFO: Record<BoxType, { name: string; price: number; icon: string; tiers: NFTTier[]; color: string }> = {
  basic: {
    name: 'Basic Box',
    price: 0.1,
    icon: '🎁',
    tiers: ['cadet', 'navigator'],
    color: 'from-green-500 to-blue-500',
  },
  premium: {
    name: 'Premium Box',
    price: 0.5,
    icon: '🎁',
    tiers: ['navigator', 'pilot', 'commander'],
    color: 'from-purple-500 to-pink-500',
  },
  legendary: {
    name: 'Legendary Box',
    price: 1.0,
    icon: '🎁',
    tiers: ['pilot', 'commander', 'admiral'],
    color: 'from-amber-500 to-rose-500',
  },
}
