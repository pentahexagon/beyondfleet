// NFT 고정가 구매 API
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Connection, PublicKey } from '@solana/web3.js'
import { createBuyInstruction, formatPrice } from '@/lib/solana/auction-house'
import { TREASURY_WALLET, SolanaError } from '@/lib/solana/umi'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const solanaRpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'

// POST: 구매 트랜잭션 생성 요청
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nftId, buyerWallet } = body

    // 입력 검증
    if (!nftId || !buyerWallet) {
      return NextResponse.json(
        { error: 'nftId와 buyerWallet이 필요합니다' },
        { status: 400 }
      )
    }

    // 지갑 주소 유효성 검사
    try {
      new PublicKey(buyerWallet)
    } catch {
      return NextResponse.json(
        { error: '유효하지 않은 지갑 주소입니다' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // NFT 정보 조회
    const { data: nft, error: nftError } = await supabase
      .from('nfts')
      .select('*')
      .eq('id', nftId)
      .single()

    if (nftError || !nft) {
      return NextResponse.json(
        { error: 'NFT를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 판매 중인지 확인
    if (!nft.is_listed) {
      return NextResponse.json(
        { error: '판매 중인 NFT가 아닙니다' },
        { status: 400 }
      )
    }

    // 가격 확인
    if (!nft.price || nft.price <= 0) {
      return NextResponse.json(
        { error: '유효하지 않은 가격입니다' },
        { status: 400 }
      )
    }

    // 본인 NFT 구매 방지
    if (nft.owner_wallet === buyerWallet) {
      return NextResponse.json(
        { error: '본인의 NFT는 구매할 수 없습니다' },
        { status: 400 }
      )
    }

    // 구매 트랜잭션 instruction 생성
    const { instructions, message } = await createBuyInstruction({
      buyer: buyerWallet,
      nftMint: nft.mint_address || nftId, // 온체인 민트 주소
      price: nft.price,
      seller: nft.owner_wallet || TREASURY_WALLET,
    })

    // 프론트엔드에서 서명할 트랜잭션 데이터 반환
    return NextResponse.json({
      success: true,
      transaction: {
        nftId: nft.id,
        nftName: nft.name,
        price: nft.price,
        priceFormatted: formatPrice(nft.price),
        seller: nft.owner_wallet || TREASURY_WALLET,
        buyer: buyerWallet,
        instructions,
        message,
      }
    })

  } catch (error) {
    console.error('Purchase error:', error)

    if (error instanceof SolanaError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: '구매 처리 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// PUT: 트랜잭션 확인 및 DB 업데이트
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { nftId, buyerWallet, txSignature } = body

    if (!nftId || !buyerWallet || !txSignature) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다' },
        { status: 400 }
      )
    }

    // Solana 트랜잭션 확인
    const connection = new Connection(solanaRpcUrl, 'confirmed')

    try {
      const tx = await connection.getTransaction(txSignature, {
        maxSupportedTransactionVersion: 0,
      })

      if (!tx) {
        return NextResponse.json(
          { error: '트랜잭션을 찾을 수 없습니다. 잠시 후 다시 시도해주세요.' },
          { status: 400 }
        )
      }

      // 트랜잭션 실패 확인
      if (tx.meta?.err) {
        return NextResponse.json(
          { error: '트랜잭션이 실패했습니다', details: tx.meta.err },
          { status: 400 }
        )
      }
    } catch (error) {
      console.error('Transaction verification error:', error)
      return NextResponse.json(
        { error: '트랜잭션 확인 중 오류가 발생했습니다' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // NFT 정보 조회
    const { data: nft, error: nftError } = await supabase
      .from('nfts')
      .select('*')
      .eq('id', nftId)
      .single()

    if (nftError || !nft) {
      return NextResponse.json(
        { error: 'NFT를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 이미 판매 완료된 경우
    if (!nft.is_listed) {
      return NextResponse.json(
        { error: '이미 판매 완료된 NFT입니다' },
        { status: 400 }
      )
    }

    // DB 트랜잭션: NFT 소유권 이전 + 구매 기록
    const previousOwner = nft.owner_wallet || nft.owner_id

    // NFT 소유권 업데이트
    const { error: updateError } = await supabase
      .from('nfts')
      .update({
        owner_wallet: buyerWallet,
        is_listed: false,
        price: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', nftId)

    if (updateError) {
      console.error('NFT update error:', updateError)
      return NextResponse.json(
        { error: 'NFT 소유권 업데이트 실패' },
        { status: 500 }
      )
    }

    // 구매 기록 저장
    const { error: purchaseError } = await supabase
      .from('nft_purchases')
      .insert({
        nft_id: nftId,
        buyer_wallet: buyerWallet,
        seller_wallet: previousOwner,
        price: nft.price,
        tx_signature: txSignature,
        purchase_type: 'fixed',
      })

    if (purchaseError) {
      console.error('Purchase record error:', purchaseError)
      // 구매 기록 실패는 치명적이지 않음 - 로그만 남기고 진행
    }

    return NextResponse.json({
      success: true,
      message: '구매가 완료되었습니다!',
      nft: {
        id: nftId,
        name: nft.name,
        newOwner: buyerWallet,
      },
      txSignature,
    })

  } catch (error) {
    console.error('Purchase confirmation error:', error)
    return NextResponse.json(
      { error: '구매 확인 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
