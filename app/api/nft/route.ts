import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { NFT, NFTTier } from '@/types/nft'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Demo NFT data for when Supabase is not configured
const DEMO_NFTS: NFT[] = [
  {
    id: '1',
    name: 'Cosmic Voyager #001',
    description: 'A rare cosmic voyager exploring the universe',
    image_url: 'https://picsum.photos/seed/nft1/400/400',
    tier: 'admiral',
    is_listed: true,
    price: 5.5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Star Commander #042',
    description: 'Leading the fleet through the stars',
    image_url: 'https://picsum.photos/seed/nft2/400/400',
    tier: 'commander',
    is_listed: true,
    price: 3.2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Nebula Pilot #156',
    description: 'Expert pilot navigating nebula storms',
    image_url: 'https://picsum.photos/seed/nft3/400/400',
    tier: 'pilot',
    is_listed: true,
    price: 1.8,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'Galaxy Navigator #789',
    description: 'Charting new paths across galaxies',
    image_url: 'https://picsum.photos/seed/nft4/400/400',
    tier: 'navigator',
    is_listed: true,
    price: 0.8,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '5',
    name: 'Space Cadet #1024',
    description: 'Beginning the journey into space',
    image_url: 'https://picsum.photos/seed/nft5/400/400',
    tier: 'cadet',
    is_listed: true,
    price: 0.3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '6',
    name: 'Stellar Admiral #007',
    description: 'Supreme commander of the stellar fleet',
    image_url: 'https://picsum.photos/seed/nft6/400/400',
    tier: 'admiral',
    is_listed: true,
    price: 8.0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '7',
    name: 'Aurora Commander #088',
    description: 'Master of aurora fields',
    image_url: 'https://picsum.photos/seed/nft7/400/400',
    tier: 'commander',
    is_listed: true,
    price: 2.5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '8',
    name: 'Quantum Pilot #333',
    description: 'Traversing quantum dimensions',
    image_url: 'https://picsum.photos/seed/nft8/400/400',
    tier: 'pilot',
    is_listed: true,
    price: 1.5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const tier = searchParams.get('tier') as NFTTier | 'all' | null
  const sort = searchParams.get('sort') || 'latest'
  const listed = searchParams.get('listed') === 'true'

  try {
    // Check if Supabase is configured
    if (!supabaseUrl || !supabaseServiceKey || supabaseUrl.includes('placeholder')) {
      // Return demo data
      let nfts = [...DEMO_NFTS]

      if (tier && tier !== 'all') {
        nfts = nfts.filter((n) => n.tier === tier)
      }

      if (listed) {
        nfts = nfts.filter((n) => n.is_listed)
      }

      if (sort === 'price_asc') {
        nfts.sort((a, b) => (a.price || 0) - (b.price || 0))
      } else if (sort === 'price_desc') {
        nfts.sort((a, b) => (b.price || 0) - (a.price || 0))
      }

      return NextResponse.json({ nfts, total: nfts.length })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    let query = supabase.from('nfts').select('*')

    if (tier && tier !== 'all') {
      query = query.eq('tier', tier)
    }

    if (listed) {
      query = query.eq('is_listed', true)
    }

    if (sort === 'price_asc') {
      query = query.order('price', { ascending: true })
    } else if (sort === 'price_desc') {
      query = query.order('price', { ascending: false })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    const { data: nfts, error } = await query

    if (error) throw error

    return NextResponse.json({ nfts: nfts || [], total: nfts?.length || 0 })
  } catch (error) {
    console.error('Error fetching NFTs:', error)
    return NextResponse.json({ error: 'Failed to fetch NFTs' }, { status: 500 })
  }
}
