import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Store nonces temporarily (in production, use Redis or database)
const usedNonces = new Set<string>()

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration missing')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, walletType, message, signature, nonce } = await request.json()

    // Validate required fields
    if (!walletAddress || !walletType || !message || !signature || !nonce) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // Check nonce hasn't been used (prevent replay attacks)
    if (usedNonces.has(nonce)) {
      return NextResponse.json(
        { error: 'Nonce가 이미 사용되었습니다. 다시 시도해주세요.' },
        { status: 400 }
      )
    }

    // Verify signature
    let isValid = false

    if (walletType === 'ethereum') {
      const { verifyMessage } = await import('viem')
      try {
        isValid = await verifyMessage({
          address: walletAddress as `0x${string}`,
          message,
          signature: signature as `0x${string}`,
        })
      } catch (e) {
        console.error('ETH verification error:', e)
      }
    } else if (walletType === 'solana') {
      try {
        const { PublicKey } = await import('@solana/web3.js')
        const nacl = await import('tweetnacl')

        const pubKey = new PublicKey(walletAddress)
        const messageBytes = new TextEncoder().encode(message)
        const signatureBytes = new Uint8Array(signature)

        isValid = nacl.sign.detached.verify(
          messageBytes,
          signatureBytes,
          pubKey.toBytes()
        )
      } catch (e) {
        console.error('Solana verification error:', e)
      }
    }

    if (!isValid) {
      return NextResponse.json(
        { error: '서명 검증에 실패했습니다.' },
        { status: 401 }
      )
    }

    // Mark nonce as used
    usedNonces.add(nonce)
    // Clean up old nonces (simple implementation - in production use TTL)
    if (usedNonces.size > 10000) {
      usedNonces.clear()
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Check if wallet is already linked to a user
    const walletField = walletType === 'ethereum' ? 'eth_wallet' : 'sol_wallet'
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq(walletField, walletAddress)
      .single()

    if (existingProfile) {
      // Wallet already linked - sign in the user
      return NextResponse.json({
        success: true,
        userId: existingProfile.id,
        isNew: false,
        message: '로그인 성공!',
      })
    }

    // Create new user with wallet
    const email = `${walletAddress.toLowerCase()}@wallet.beyondfleet.io`
    const password = `wallet_${nonce}_${Date.now()}`

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        [walletField]: walletAddress,
        membership_tier: 'cadet',
        vote_power: 1,
      },
    })

    if (authError) {
      // If email exists, try to link wallet to existing profile
      if (authError.message.includes('already registered')) {
        return NextResponse.json({
          success: false,
          requiresLink: true,
          message: '이 지갑을 기존 계정에 연결하려면 먼저 로그인하세요.',
        })
      }
      throw authError
    }

    // Update profile with wallet address
    if (authData.user) {
      await supabaseAdmin
        .from('profiles')
        .update({ [walletField]: walletAddress })
        .eq('id', authData.user.id)
    }

    return NextResponse.json({
      success: true,
      userId: authData.user?.id,
      isNew: true,
      message: '지갑으로 새 계정이 생성되었습니다!',
    })
  } catch (error) {
    console.error('Wallet auth error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
