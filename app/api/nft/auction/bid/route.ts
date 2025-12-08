// 경매 입찰 API - 스나이핑 방지 포함
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PublicKey } from '@solana/web3.js'
import {
  validateBid,
  calculateNewEndTime,
  createBidInstruction,
  type Auction
} from '@/lib/solana/auction-house'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// POST: 입찰 트랜잭션 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { auctionId, bidderWallet, amount } = body

    // 입력 검증
    if (!auctionId || !bidderWallet || !amount) {
      return NextResponse.json(
        { error: 'auctionId, bidderWallet, amount가 필요합니다' },
        { status: 400 }
      )
    }

    // 지갑 주소 유효성 검사
    try {
      new PublicKey(bidderWallet)
    } catch {
      return NextResponse.json(
        { error: '유효하지 않은 지갑 주소입니다' },
        { status: 400 }
      )
    }

    // 금액 유효성 검사
    const bidAmount = parseFloat(amount)
    if (isNaN(bidAmount) || bidAmount <= 0) {
      return NextResponse.json(
        { error: '유효하지 않은 입찰 금액입니다' },
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

    // DB 데이터를 Auction 타입으로 변환
    const auction: Auction = {
      id: auctionData.id,
      nftMint: auctionData.nft?.mint_address || auctionData.nft_id,
      seller: auctionData.seller_wallet || auctionData.seller_id,
      startPrice: auctionData.start_price,
      currentBid: auctionData.current_bid,
      highestBidder: auctionData.highest_bidder,
      startTime: new Date(auctionData.start_time),
      endTime: new Date(auctionData.end_time),
      originalEndTime: new Date(auctionData.original_end_time || auctionData.end_time),
      extensionCount: auctionData.extension_count || 0,
      maxExtensions: auctionData.max_extensions || 12,
      status: auctionData.status,
    }

    // 입찰 유효성 검증
    const validation = validateBid(auction, bidAmount, bidderWallet)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // 스나이핑 방지: 종료 5분 전 입찰 시 5분 연장
    const { newEndTime, extended, newExtensionCount } = calculateNewEndTime(
      auction.endTime,
      auction.extensionCount,
      auction.maxExtensions
    )

    // 입찰 트랜잭션 instruction 생성
    const { instructions, message } = await createBidInstruction({
      bidder: bidderWallet,
      auctionId: auctionId,
      nftMint: auction.nftMint,
      amount: bidAmount,
    })

    return NextResponse.json({
      success: true,
      transaction: {
        auctionId,
        nftName: auctionData.nft?.name,
        amount: bidAmount,
        previousBid: auction.currentBid,
        bidder: bidderWallet,
        instructions,
        message,
        // 스나이핑 방지 정보
        timeExtended: extended,
        newEndTime: newEndTime.toISOString(),
        extensionCount: newExtensionCount,
      }
    })

  } catch (error) {
    console.error('Bid creation error:', error)
    return NextResponse.json(
      { error: '입찰 처리 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// PUT: 입찰 트랜잭션 확인 및 DB 업데이트
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { auctionId, bidderWallet, amount, txSignature, timeExtended, newEndTime, extensionCount } = body

    if (!auctionId || !bidderWallet || !amount || !txSignature) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 경매 정보 조회
    const { data: auction, error: auctionError } = await supabase
      .from('auctions')
      .select('*')
      .eq('id', auctionId)
      .single()

    if (auctionError || !auction) {
      return NextResponse.json(
        { error: '경매를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 경매가 아직 활성 상태인지 확인
    if (auction.status !== 'active') {
      return NextResponse.json(
        { error: '경매가 종료되었습니다' },
        { status: 400 }
      )
    }

    // 입찰 기록 생성
    const { data: bid, error: bidError } = await supabase
      .from('bids')
      .insert({
        auction_id: auctionId,
        bidder_wallet: bidderWallet,
        amount: amount,
        tx_signature: txSignature,
      })
      .select()
      .single()

    if (bidError) {
      console.error('Bid insert error:', bidError)
      return NextResponse.json(
        { error: '입찰 기록 저장 실패' },
        { status: 500 }
      )
    }

    // 경매 업데이트 (현재 입찰가, 최고 입찰자, 종료시간 연장)
    const updateData: Record<string, any> = {
      current_bid: amount,
      highest_bidder: bidderWallet,
      updated_at: new Date().toISOString(),
    }

    // 스나이핑 방지로 시간이 연장된 경우
    if (timeExtended && newEndTime) {
      updateData.end_time = newEndTime
      updateData.extension_count = extensionCount
    }

    const { error: updateError } = await supabase
      .from('auctions')
      .update(updateData)
      .eq('id', auctionId)

    if (updateError) {
      console.error('Auction update error:', updateError)
      return NextResponse.json(
        { error: '경매 업데이트 실패' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: timeExtended
        ? `입찰 완료! 경매 시간이 5분 연장되었습니다.`
        : '입찰이 완료되었습니다!',
      bid: {
        id: bid.id,
        amount,
        bidder: bidderWallet,
      },
      auction: {
        id: auctionId,
        currentBid: amount,
        highestBidder: bidderWallet,
        endTime: timeExtended ? newEndTime : auction.end_time,
        extensionCount: timeExtended ? extensionCount : auction.extension_count,
      },
      txSignature,
    })

  } catch (error) {
    console.error('Bid confirmation error:', error)
    return NextResponse.json(
      { error: '입찰 확인 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
