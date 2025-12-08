// Metaplex Auction House 헬퍼 함수
// SOL ↔ NFT 교환을 위한 마켓플레이스 로직

import {
  publicKey,
  lamports,
  type Umi,
  type PublicKey as UmiPublicKey,
} from '@metaplex-foundation/umi'
import {
  getReadOnlyUmi,
  TREASURY_WALLET,
  SELLER_FEE_BASIS_POINTS,
  SolanaError,
  handleSolanaError
} from './umi'

// Auction House 설정 타입
export interface AuctionHouseConfig {
  address: string
  authority: string
  treasuryMint: string // SOL = native mint
  feeAccount: string
  treasuryAccount: string
  sellerFeeBasisPoints: number
}

// 리스팅 정보 타입
export interface Listing {
  id: string
  nftMint: string
  seller: string
  price: number // SOL
  createdAt: Date
  isActive: boolean
}

// 입찰 정보 타입
export interface Bid {
  id: string
  auctionId: string
  bidder: string
  amount: number // SOL
  createdAt: Date
  isWinning: boolean
}

// 경매 정보 타입
export interface Auction {
  id: string
  nftMint: string
  seller: string
  startPrice: number
  currentBid: number | null
  highestBidder: string | null
  startTime: Date
  endTime: Date
  originalEndTime: Date
  extensionCount: number
  maxExtensions: number
  status: 'active' | 'ended' | 'cancelled'
}

// 스나이핑 방지 설정
const ANTI_SNIPE_MINUTES = 5
const EXTENSION_MINUTES = 5
const MAX_EXTENSIONS = 12 // 최대 1시간 연장

/**
 * 고정가 구매를 위한 트랜잭션 instruction 생성
 * 프론트엔드에서 서명 후 전송
 */
export async function createBuyInstruction(params: {
  buyer: string
  nftMint: string
  price: number // SOL
  seller: string
}): Promise<{
  instructions: any[]
  message: string
}> {
  try {
    const umi = getReadOnlyUmi()

    // 가격을 lamports로 변환
    const priceInLamports = Math.floor(params.price * 1_000_000_000)

    // Auction House 구매 instruction 생성
    // 실제 구현에서는 mpl-auction-house 사용
    // 여기서는 간단한 SOL 전송으로 시뮬레이션

    return {
      instructions: [
        // 실제로는 Auction House buy + execute_sale instruction
        {
          type: 'buy',
          buyer: params.buyer,
          seller: params.seller,
          nftMint: params.nftMint,
          price: priceInLamports,
        }
      ],
      message: `${params.price} SOL로 NFT 구매`,
    }
  } catch (error) {
    handleSolanaError(error)
  }
}

/**
 * 경매 입찰을 위한 트랜잭션 instruction 생성
 */
export async function createBidInstruction(params: {
  bidder: string
  auctionId: string
  nftMint: string
  amount: number // SOL
}): Promise<{
  instructions: any[]
  message: string
}> {
  try {
    const amountInLamports = Math.floor(params.amount * 1_000_000_000)

    return {
      instructions: [
        {
          type: 'bid',
          bidder: params.bidder,
          auctionId: params.auctionId,
          nftMint: params.nftMint,
          amount: amountInLamports,
        }
      ],
      message: `${params.amount} SOL 입찰`,
    }
  } catch (error) {
    handleSolanaError(error)
  }
}

/**
 * 스나이핑 방지 로직 - 종료 5분 전 입찰 시 5분 연장
 */
export function calculateNewEndTime(
  currentEndTime: Date,
  extensionCount: number,
  maxExtensions: number = MAX_EXTENSIONS
): {
  newEndTime: Date
  extended: boolean
  newExtensionCount: number
} {
  const now = new Date()
  const timeUntilEnd = currentEndTime.getTime() - now.getTime()
  const fiveMinutes = ANTI_SNIPE_MINUTES * 60 * 1000

  // 종료 5분 전이고, 최대 연장 횟수 미만인 경우
  if (timeUntilEnd <= fiveMinutes && timeUntilEnd > 0 && extensionCount < maxExtensions) {
    const newEndTime = new Date(currentEndTime.getTime() + EXTENSION_MINUTES * 60 * 1000)
    return {
      newEndTime,
      extended: true,
      newExtensionCount: extensionCount + 1,
    }
  }

  return {
    newEndTime: currentEndTime,
    extended: false,
    newExtensionCount: extensionCount,
  }
}

/**
 * 입찰 유효성 검증
 */
export function validateBid(
  auction: Auction,
  bidAmount: number,
  bidderWallet: string
): { valid: boolean; error?: string } {
  const now = new Date()

  // 경매 상태 확인
  if (auction.status !== 'active') {
    return { valid: false, error: '경매가 종료되었습니다' }
  }

  // 시작 전 확인
  if (now < auction.startTime) {
    return { valid: false, error: '경매가 아직 시작되지 않았습니다' }
  }

  // 종료 후 확인
  if (now > auction.endTime) {
    return { valid: false, error: '경매가 종료되었습니다' }
  }

  // 자신의 NFT에 입찰 불가
  if (bidderWallet === auction.seller) {
    return { valid: false, error: '본인의 NFT에는 입찰할 수 없습니다' }
  }

  // 최소 입찰가 확인
  const minimumBid = auction.currentBid
    ? auction.currentBid * 1.05 // 현재 입찰가의 5% 이상
    : auction.startPrice

  if (bidAmount < minimumBid) {
    return {
      valid: false,
      error: `최소 ${minimumBid.toFixed(4)} SOL 이상 입찰해야 합니다`
    }
  }

  return { valid: true }
}

/**
 * 경매 정산 (종료 후 NFT 전송 및 SOL 분배)
 */
export async function settleAuction(auction: Auction): Promise<{
  success: boolean
  txSignature?: string
  error?: string
}> {
  try {
    if (auction.status !== 'active') {
      return { success: false, error: '이미 정산된 경매입니다' }
    }

    const now = new Date()
    if (now <= auction.endTime) {
      return { success: false, error: '경매가 아직 종료되지 않았습니다' }
    }

    if (!auction.highestBidder || !auction.currentBid) {
      // 입찰자 없음 - 경매 취소 처리
      return {
        success: true,
        txSignature: 'no-bids-cancelled'
      }
    }

    // 실제 구현에서는 Auction House execute_sale 호출
    // NFT: seller → highestBidder
    // SOL: highestBidder → seller (수수료 제외)
    // Fee: → treasury

    return {
      success: true,
      txSignature: 'simulated-settlement-tx',
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 가격을 SOL과 USD로 포맷
 */
export function formatPrice(
  solAmount: number,
  solPriceUsd?: number
): { sol: string; usd?: string } {
  const sol = `${solAmount.toFixed(4)} SOL`

  if (solPriceUsd) {
    const usd = `$${(solAmount * solPriceUsd).toFixed(2)}`
    return { sol, usd }
  }

  return { sol }
}

/**
 * 남은 시간 포맷
 */
export function formatTimeRemaining(endTime: Date): string {
  const now = new Date()
  const diff = endTime.getTime() - now.getTime()

  if (diff <= 0) return '종료됨'

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  if (hours > 0) {
    return `${hours}시간 ${minutes}분`
  }
  if (minutes > 0) {
    return `${minutes}분 ${seconds}초`
  }
  return `${seconds}초`
}
