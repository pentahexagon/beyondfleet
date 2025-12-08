// Metaplex Umi 인스턴스 설정
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata'
import {
  publicKey,
  createSignerFromKeypair,
  signerIdentity,
  type Umi,
  type Signer
} from '@metaplex-foundation/umi'
import { fromWeb3JsPublicKey, toWeb3JsPublicKey } from '@metaplex-foundation/umi-web3js-adapters'
import { PublicKey } from '@solana/web3.js'

// RPC 엔드포인트 (Mainnet)
const RPC_ENDPOINT = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'

// Treasury 지갑 (수수료 수령)
export const TREASURY_WALLET = process.env.TREASURY_WALLET || ''

// Auction House 주소 (생성 후 설정)
export const AUCTION_HOUSE_ADDRESS = process.env.AUCTION_HOUSE_ADDRESS || ''

// 수수료 설정 (basis points: 250 = 2.5%)
export const SELLER_FEE_BASIS_POINTS = parseInt(process.env.SELLER_FEE_BASIS_POINTS || '250')

// Umi 인스턴스 생성 (서버 사이드용)
export function createServerUmi(): Umi {
  const umi = createUmi(RPC_ENDPOINT)
    .use(mplTokenMetadata())

  return umi
}

// 읽기 전용 Umi (조회용)
let readOnlyUmi: Umi | null = null

export function getReadOnlyUmi(): Umi {
  if (!readOnlyUmi) {
    readOnlyUmi = createServerUmi()
  }
  return readOnlyUmi
}

// PublicKey 변환 유틸리티
export function toUmiPublicKey(address: string | PublicKey) {
  if (typeof address === 'string') {
    return publicKey(address)
  }
  return fromWeb3JsPublicKey(address)
}

export function toSolanaPublicKey(address: string) {
  return new PublicKey(address)
}

// NFT 메타데이터 타입
export interface NFTMetadata {
  name: string
  symbol: string
  description: string
  image: string
  attributes?: Array<{
    trait_type: string
    value: string | number
  }>
  properties?: {
    files?: Array<{
      uri: string
      type: string
    }>
    category?: string
  }
}

// BeyondFleet NFT 티어별 메타데이터 생성
export function createBeyondFleetMetadata(
  name: string,
  tier: 'cadet' | 'navigator' | 'pilot' | 'commander' | 'admiral',
  imageUrl: string,
  description?: string
): NFTMetadata {
  const tierInfo = {
    cadet: { symbol: 'BFCDT', rarity: 'Common' },
    navigator: { symbol: 'BFNAV', rarity: 'Uncommon' },
    pilot: { symbol: 'BFPLT', rarity: 'Rare' },
    commander: { symbol: 'BFCMD', rarity: 'Epic' },
    admiral: { symbol: 'BFADM', rarity: 'Legendary' },
  }

  return {
    name,
    symbol: tierInfo[tier].symbol,
    description: description || `BeyondFleet ${tier.charAt(0).toUpperCase() + tier.slice(1)} NFT`,
    image: imageUrl,
    attributes: [
      { trait_type: 'Tier', value: tier },
      { trait_type: 'Rarity', value: tierInfo[tier].rarity },
      { trait_type: 'Collection', value: 'BeyondFleet' },
    ],
    properties: {
      files: [{ uri: imageUrl, type: 'image/png' }],
      category: 'image',
    },
  }
}

// 트랜잭션 확인 대기
export async function confirmTransaction(
  umi: Umi,
  signature: string,
  maxRetries = 30
): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await umi.rpc.getTransaction(
        Buffer.from(signature, 'base64') as any
      )
      if (result) {
        return true
      }
    } catch {
      // 아직 확인 안됨
    }
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  return false
}

// SOL 잔액 조회
export async function getSolBalance(umi: Umi, address: string): Promise<number> {
  const balance = await umi.rpc.getBalance(publicKey(address))
  return Number(balance.basisPoints) / 1_000_000_000 // lamports to SOL
}

// 에러 타입
export class SolanaError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'SolanaError'
  }
}

// 공통 에러 핸들링
export function handleSolanaError(error: unknown): never {
  if (error instanceof SolanaError) {
    throw error
  }

  const message = error instanceof Error ? error.message : 'Unknown error'

  if (message.includes('insufficient funds')) {
    throw new SolanaError('잔액이 부족합니다', 'INSUFFICIENT_FUNDS')
  }

  if (message.includes('blockhash not found')) {
    throw new SolanaError('트랜잭션이 만료되었습니다. 다시 시도해주세요', 'EXPIRED_BLOCKHASH')
  }

  if (message.includes('Transaction simulation failed')) {
    throw new SolanaError('트랜잭션 시뮬레이션 실패', 'SIMULATION_FAILED', error)
  }

  throw new SolanaError(message, 'UNKNOWN_ERROR', error)
}
