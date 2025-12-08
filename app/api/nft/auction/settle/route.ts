// 경매 정산 API - 종료된 경매의 NFT 전송 및 SOL 분배
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { settleAuction, type Auction } from '@/lib/solana/auction-house'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// POST: 경매 정산 실행
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { auctionId } = body

    if (!auctionId) {
      return NextResponse.json(
        { error: 'auctionId가 필요합니다' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 경매 정보 조회
    const { data: auctionData, error: auctionError } = await supabase
      .from('auctions')
      .select('*, nft:nfts(*)')
      .eq('id', auctionId)
      .single()

    if (auctionError || !auctionData) {
      return NextResponse.json(
        { error: '경매를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 이미 정산된 경매인지 확인
    if (auctionData.status !== 'active') {
      return NextResponse.json(
        { error: '이미 정산된 경매입니다' },
        { status: 400 }
      )
    }

    // 종료 시간 확인
    const now = new Date()
    const endTime = new Date(auctionData.end_time)
    if (now <= endTime) {
      return NextResponse.json(
        { error: '경매가 아직 종료되지 않았습니다' },
        { status: 400 }
      )
    }

    // Auction 타입으로 변환
    const auction: Auction = {
      id: auctionData.id,
      nftMint: auctionData.nft?.mint_address || auctionData.nft_id,
      seller: auctionData.seller_wallet || auctionData.seller_id,
      startPrice: auctionData.start_price,
      currentBid: auctionData.current_bid,
      highestBidder: auctionData.highest_bidder,
      startTime: new Date(auctionData.start_time),
      endTime: endTime,
      originalEndTime: new Date(auctionData.original_end_time || auctionData.end_time),
      extensionCount: auctionData.extension_count || 0,
      maxExtensions: auctionData.max_extensions || 12,
      status: auctionData.status,
    }

    // 입찰자가 없는 경우
    if (!auction.highestBidder || !auction.currentBid) {
      // 경매 취소 처리
      const { error: cancelError } = await supabase
        .from('auctions')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', auctionId)

      if (cancelError) {
        console.error('Auction cancel error:', cancelError)
        return NextResponse.json(
          { error: '경매 취소 처리 실패' },
          { status: 500 }
        )
      }

      // NFT를 다시 판매 가능 상태로
      await supabase
        .from('nfts')
        .update({
          is_listed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', auctionData.nft_id)

      return NextResponse.json({
        success: true,
        message: '입찰자가 없어 경매가 취소되었습니다.',
        status: 'cancelled',
      })
    }

    // 정산 실행 (온체인 트랜잭션)
    const settlementResult = await settleAuction(auction)

    if (!settlementResult.success) {
      return NextResponse.json(
        { error: settlementResult.error || '정산 실패' },
        { status: 500 }
      )
    }

    // DB 업데이트: 경매 상태
    const { error: updateAuctionError } = await supabase
      .from('auctions')
      .update({
        status: 'ended',
        settled_at: new Date().toISOString(),
        settlement_tx: settlementResult.txSignature,
        updated_at: new Date().toISOString(),
      })
      .eq('id', auctionId)

    if (updateAuctionError) {
      console.error('Auction settlement update error:', updateAuctionError)
    }

    // DB 업데이트: NFT 소유권 이전
    const { error: updateNftError } = await supabase
      .from('nfts')
      .update({
        owner_wallet: auction.highestBidder,
        is_listed: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', auctionData.nft_id)

    if (updateNftError) {
      console.error('NFT ownership update error:', updateNftError)
    }

    // 구매 기록 저장
    const { error: purchaseError } = await supabase
      .from('nft_purchases')
      .insert({
        nft_id: auctionData.nft_id,
        buyer_wallet: auction.highestBidder,
        seller_wallet: auction.seller,
        price: auction.currentBid,
        tx_signature: settlementResult.txSignature,
        purchase_type: 'auction',
      })

    if (purchaseError) {
      console.error('Purchase record error:', purchaseError)
    }

    return NextResponse.json({
      success: true,
      message: '경매 정산이 완료되었습니다!',
      settlement: {
        auctionId,
        nftId: auctionData.nft_id,
        nftName: auctionData.nft?.name,
        winner: auction.highestBidder,
        finalPrice: auction.currentBid,
        seller: auction.seller,
        txSignature: settlementResult.txSignature,
      }
    })

  } catch (error) {
    console.error('Settlement error:', error)
    return NextResponse.json(
      { error: '정산 처리 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// GET: 정산 대기 중인 경매 목록 조회
export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 종료되었지만 아직 정산되지 않은 경매 조회
    const { data: pendingAuctions, error } = await supabase
      .from('auctions')
      .select('*, nft:nfts(*)')
      .eq('status', 'active')
      .lt('end_time', new Date().toISOString())
      .order('end_time', { ascending: true })

    if (error) {
      console.error('Pending auctions fetch error:', error)
      return NextResponse.json(
        { error: '정산 대기 경매 조회 실패' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      pendingSettlements: pendingAuctions || [],
      count: pendingAuctions?.length || 0,
    })

  } catch (error) {
    console.error('Pending settlements fetch error:', error)
    return NextResponse.json(
      { error: '조회 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
