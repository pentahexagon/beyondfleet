import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Auction, NFT } from '@/types/nft'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Demo auction data
const DEMO_AUCTIONS: (Auction & { nft: NFT })[] = [
  {
    id: 'auction-1',
    nft_id: 'nft-a1',
    seller_id: 'seller-1',
    start_price: 2.0,
    current_bid: 3.5,
    highest_bidder: 'bidder-1',
    start_time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
    status: 'active',
    created_at: new Date().toISOString(),
    nft: {
      id: 'nft-a1',
      name: 'Legendary Phoenix #001',
      description: 'A mythical phoenix rising from cosmic ashes',
      image_url: 'https://picsum.photos/seed/auction1/400/400',
      tier: 'admiral',
      is_listed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  {
    id: 'auction-2',
    nft_id: 'nft-a2',
    seller_id: 'seller-2',
    start_price: 1.0,
    current_bid: 1.8,
    highest_bidder: 'bidder-2',
    start_time: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(), // 5 hours from now
    status: 'active',
    created_at: new Date().toISOString(),
    nft: {
      id: 'nft-a2',
      name: 'Galaxy Warden #042',
      description: 'Protector of the galactic frontier',
      image_url: 'https://picsum.photos/seed/auction2/400/400',
      tier: 'commander',
      is_listed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  {
    id: 'auction-3',
    nft_id: 'nft-a3',
    seller_id: 'seller-3',
    start_price: 0.5,
    current_bid: 0.9,
    highest_bidder: 'bidder-3',
    start_time: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
    status: 'active',
    created_at: new Date().toISOString(),
    nft: {
      id: 'nft-a3',
      name: 'Nebula Rider #156',
      description: 'Surfing through cosmic nebulae',
      image_url: 'https://picsum.photos/seed/auction3/400/400',
      tier: 'pilot',
      is_listed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  {
    id: 'auction-4',
    nft_id: 'nft-a4',
    seller_id: 'seller-4',
    start_price: 0.3,
    current_bid: undefined,
    highest_bidder: undefined,
    start_time: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString(), // 23 hours from now
    status: 'active',
    created_at: new Date().toISOString(),
    nft: {
      id: 'nft-a4',
      name: 'Star Seeker #789',
      description: 'Searching for new worlds',
      image_url: 'https://picsum.photos/seed/auction4/400/400',
      tier: 'navigator',
      is_listed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
]

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const status = searchParams.get('status') || 'active'

  try {
    // Check if Supabase is configured
    if (!supabaseUrl || !supabaseServiceKey || supabaseUrl.includes('placeholder')) {
      // Return demo data
      let auctions = DEMO_AUCTIONS.filter((a) => a.status === status)
      return NextResponse.json({ auctions, total: auctions.length })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: auctions, error } = await supabase
      .from('auctions')
      .select('*, nft:nfts(*)')
      .eq('status', status)
      .order('end_time', { ascending: true })

    if (error) throw error

    return NextResponse.json({ auctions: auctions || [], total: auctions?.length || 0 })
  } catch (error) {
    console.error('Error fetching auctions:', error)
    return NextResponse.json({ error: 'Failed to fetch auctions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { auction_id, amount, user_id } = body

    if (!auction_id || !amount || !user_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if Supabase is configured
    if (!supabaseUrl || !supabaseServiceKey || supabaseUrl.includes('placeholder')) {
      // Demo mode - just return success
      return NextResponse.json({
        success: true,
        bid: {
          id: `bid-${Date.now()}`,
          auction_id,
          user_id,
          amount,
          created_at: new Date().toISOString(),
        },
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get auction
    const { data: auction, error: auctionError } = await supabase
      .from('auctions')
      .select('*')
      .eq('id', auction_id)
      .single()

    if (auctionError || !auction) {
      return NextResponse.json({ error: 'Auction not found' }, { status: 404 })
    }

    // Check if auction is still active
    if (auction.status !== 'active' || new Date(auction.end_time) < new Date()) {
      return NextResponse.json({ error: 'Auction has ended' }, { status: 400 })
    }

    // Check if bid is higher than current
    const minBid = auction.current_bid ? auction.current_bid + 0.1 : auction.start_price
    if (amount < minBid) {
      return NextResponse.json({ error: `Bid must be at least ${minBid} SOL` }, { status: 400 })
    }

    // Create bid
    const { data: bid, error: bidError } = await supabase
      .from('bids')
      .insert({ auction_id, user_id, amount })
      .select()
      .single()

    if (bidError) throw bidError

    // Update auction
    const { error: updateError } = await supabase
      .from('auctions')
      .update({ current_bid: amount, highest_bidder: user_id })
      .eq('id', auction_id)

    if (updateError) throw updateError

    return NextResponse.json({ success: true, bid })
  } catch (error) {
    console.error('Error placing bid:', error)
    return NextResponse.json({ error: 'Failed to place bid' }, { status: 500 })
  }
}
