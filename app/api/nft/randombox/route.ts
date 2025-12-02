import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { BoxType, NFTTier, BOX_INFO, NFT } from '@/types/nft'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Probability distribution for each box type
const PROBABILITIES: Record<BoxType, Record<NFTTier, number>> = {
  basic: {
    cadet: 0.7,
    navigator: 0.3,
    pilot: 0,
    commander: 0,
    admiral: 0,
  },
  premium: {
    cadet: 0,
    navigator: 0.5,
    pilot: 0.35,
    commander: 0.15,
    admiral: 0,
  },
  legendary: {
    cadet: 0,
    navigator: 0,
    pilot: 0.4,
    commander: 0.4,
    admiral: 0.2,
  },
}

// Generate random NFT based on probability
function getRandomTier(boxType: BoxType): NFTTier {
  const probs = PROBABILITIES[boxType]
  const rand = Math.random()
  let cumulative = 0

  for (const [tier, prob] of Object.entries(probs)) {
    cumulative += prob
    if (rand < cumulative) {
      return tier as NFTTier
    }
  }

  return BOX_INFO[boxType].tiers[0]
}

// Demo NFT names by tier
const NFT_NAMES: Record<NFTTier, string[]> = {
  cadet: ['Space Cadet', 'Star Trainee', 'Cosmic Rookie', 'Galaxy Novice'],
  navigator: ['Star Navigator', 'Cosmos Guide', 'Stellar Pathfinder', 'Space Wayfarer'],
  pilot: ['Nebula Pilot', 'Quantum Flyer', 'Void Aviator', 'Cosmic Ace'],
  commander: ['Galaxy Commander', 'Star General', 'Cosmic Warden', 'Void Master'],
  admiral: ['Supreme Admiral', 'Cosmic Emperor', 'Universal Sovereign', 'Celestial Overlord'],
}

function generateDemoNFT(tier: NFTTier): NFT {
  const names = NFT_NAMES[tier]
  const name = names[Math.floor(Math.random() * names.length)]
  const id = Math.floor(Math.random() * 9999)

  return {
    id: `nft-${Date.now()}-${id}`,
    name: `${name} #${id.toString().padStart(4, '0')}`,
    description: `A ${tier} tier NFT from the BeyondFleet collection`,
    image_url: `https://picsum.photos/seed/${Date.now()}-${id}/400/400`,
    tier,
    is_listed: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

export async function GET() {
  // Return probability info
  return NextResponse.json({
    probabilities: PROBABILITIES,
    boxes: BOX_INFO,
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { box_type, user_id } = body as { box_type: BoxType; user_id: string }

    if (!box_type || !user_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!BOX_INFO[box_type]) {
      return NextResponse.json({ error: 'Invalid box type' }, { status: 400 })
    }

    // Determine the tier
    const tier = getRandomTier(box_type)
    const price = BOX_INFO[box_type].price

    // Check if Supabase is configured
    if (!supabaseUrl || !supabaseServiceKey || supabaseUrl.includes('placeholder')) {
      // Demo mode
      const nft = generateDemoNFT(tier)

      return NextResponse.json({
        success: true,
        nft,
        history: {
          id: `history-${Date.now()}`,
          user_id,
          box_type,
          result_nft_id: nft.id,
          sol_amount: price,
          created_at: new Date().toISOString(),
        },
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Create new NFT
    const nftData = generateDemoNFT(tier)
    const { data: nft, error: nftError } = await supabase
      .from('nfts')
      .insert({
        name: nftData.name,
        description: nftData.description,
        image_url: nftData.image_url,
        tier,
        owner_id: user_id,
        is_listed: false,
      })
      .select()
      .single()

    if (nftError) throw nftError

    // Record history
    const { data: history, error: historyError } = await supabase
      .from('randombox_history')
      .insert({
        user_id,
        box_type,
        result_nft_id: nft.id,
        sol_amount: price,
      })
      .select()
      .single()

    if (historyError) throw historyError

    return NextResponse.json({
      success: true,
      nft,
      history,
    })
  } catch (error) {
    console.error('Error opening randombox:', error)
    return NextResponse.json({ error: 'Failed to open randombox' }, { status: 500 })
  }
}
