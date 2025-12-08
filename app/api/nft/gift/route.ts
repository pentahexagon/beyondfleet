import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const user_id = searchParams.get('user_id')

  if (!user_id) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 })
  }

  try {
    // Check if Supabase is configured
    if (!supabaseUrl || !supabaseServiceKey || supabaseUrl.includes('placeholder')) {
      // Demo mode
      return NextResponse.json({ gifts: [], total: 0 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: gifts, error } = await supabase
      .from('gifts')
      .select('*, nft:nfts(*)')
      .eq('from_user', user_id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ gifts: gifts || [], total: gifts?.length || 0 })
  } catch (error) {
    console.error('Error fetching gifts:', error)
    return NextResponse.json({ error: 'Failed to fetch gifts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nft_id, from_user, to_wallet, message } = body

    if (!nft_id || !from_user || !to_wallet) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate wallet address (basic check)
    if (to_wallet.length < 32 || to_wallet.length > 44) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 })
    }

    // Check if Supabase is configured
    if (!supabaseUrl || !supabaseServiceKey || supabaseUrl.includes('placeholder')) {
      // Demo mode
      return NextResponse.json({
        success: true,
        gift: {
          id: `gift-${Date.now()}`,
          from_user,
          to_wallet,
          nft_id,
          message,
          created_at: new Date().toISOString(),
        },
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify NFT ownership
    const { data: nft, error: nftError } = await supabase
      .from('nfts')
      .select('*')
      .eq('id', nft_id)
      .eq('owner_id', from_user)
      .single()

    if (nftError || !nft) {
      return NextResponse.json({ error: 'NFT not found or not owned by user' }, { status: 404 })
    }

    // Create gift record
    const { data: gift, error: giftError } = await supabase
      .from('gifts')
      .insert({
        from_user,
        to_wallet,
        nft_id,
        message,
      })
      .select()
      .single()

    if (giftError) throw giftError

    // Update NFT ownership (set to null or find user by wallet)
    // In a real implementation, you would transfer to the recipient's account
    const { error: updateError } = await supabase
      .from('nfts')
      .update({ owner_id: null, is_listed: false })
      .eq('id', nft_id)

    if (updateError) throw updateError

    return NextResponse.json({ success: true, gift })
  } catch (error) {
    console.error('Error sending gift:', error)
    return NextResponse.json({ error: 'Failed to send gift' }, { status: 500 })
  }
}
