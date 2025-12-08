/**
 * Metaplex Auction House 생성 스크립트
 *
 * 실행: npx tsx scripts/create-auction-house.ts
 */

import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from '@solana/web3.js'
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token'
import {
  createCreateAuctionHouseInstruction,
  PROGRAM_ID as AUCTION_HOUSE_PROGRAM_ID,
} from '@metaplex-foundation/mpl-auction-house'
import * as fs from 'fs'
import * as path from 'path'
import * as readline from 'readline'

// 환경 설정
const RPC_URL = process.env.SOLANA_RPC_URL || 'https://mainnet.helius-rpc.com/?api-key=dd17215b-6150-450a-99ac-102d3d964b0f'
const TREASURY_WALLET = process.env.TREASURY_WALLET || 'EoZQn7LSKUN4FKERtVfxTrZdCjJPzjjh43t8BcTHvJRi'
const SELLER_FEE_BASIS_POINTS = parseInt(process.env.SELLER_FEE_BASIS_POINTS || '250')

// Native SOL mint (Wrapped SOL)
const NATIVE_MINT = new PublicKey('So11111111111111111111111111111111111111112')

async function promptUser(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer)
    })
  })
}

// PDA 계산 함수들
function findAuctionHousePda(authority: PublicKey, treasuryMint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('auction_house'), authority.toBuffer(), treasuryMint.toBuffer()],
    AUCTION_HOUSE_PROGRAM_ID
  )
}

function findAuctionHouseFeePda(auctionHouse: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('auction_house'), auctionHouse.toBuffer(), Buffer.from('fee_payer')],
    AUCTION_HOUSE_PROGRAM_ID
  )
}

function findAuctionHouseTreasuryPda(auctionHouse: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('auction_house'), auctionHouse.toBuffer(), Buffer.from('treasury')],
    AUCTION_HOUSE_PROGRAM_ID
  )
}

async function main() {
  console.log('\n🏠 BeyondFleet Auction House 생성 스크립트\n')
  console.log('='.repeat(50))
  console.log(`RPC: ${RPC_URL.substring(0, 50)}...`)
  console.log(`Treasury: ${TREASURY_WALLET}`)
  console.log(`수수료: ${SELLER_FEE_BASIS_POINTS / 100}%`)
  console.log('='.repeat(50))

  // 키페어 로드
  const keypairPath = path.join(process.env.HOME || '', '.config/solana/id.json')

  if (!fs.existsSync(keypairPath)) {
    console.error('\n❌ 키페어 파일을 찾을 수 없습니다.')
    console.log('   먼저 실행: npx tsx scripts/generate-keypair.ts')
    process.exit(1)
  }

  const keypairData = JSON.parse(fs.readFileSync(keypairPath, 'utf-8'))
  const authority = Keypair.fromSecretKey(Uint8Array.from(keypairData))

  console.log(`\n👛 Authority: ${authority.publicKey.toString()}`)

  // 연결
  const connection = new Connection(RPC_URL, 'confirmed')

  // 잔액 확인
  const balance = await connection.getBalance(authority.publicKey)
  const balanceInSol = balance / LAMPORTS_PER_SOL
  console.log(`💰 잔액: ${balanceInSol.toFixed(4)} SOL`)

  if (balanceInSol < 0.005) {
    console.error('\n❌ 잔액 부족. 최소 0.005 SOL 필요')
    console.log(`   이 주소로 SOL 전송: ${authority.publicKey.toString()}`)
    process.exit(1)
  }

  // PDA 계산
  const [auctionHouse, ahBump] = findAuctionHousePda(authority.publicKey, NATIVE_MINT)
  const [auctionHouseFeeAccount, feeBump] = findAuctionHouseFeePda(auctionHouse)
  const [auctionHouseTreasury, treasuryBump] = findAuctionHouseTreasuryPda(auctionHouse)

  console.log(`\n🔍 Auction House PDA: ${auctionHouse.toString()}`)
  console.log(`   Fee Account: ${auctionHouseFeeAccount.toString()}`)
  console.log(`   Treasury: ${auctionHouseTreasury.toString()}`)

  // 이미 존재하는지 확인
  const ahInfo = await connection.getAccountInfo(auctionHouse)
  if (ahInfo) {
    console.log('\n✅ Auction House가 이미 존재합니다!')
    console.log(`   주소: ${auctionHouse.toString()}`)
    updateEnvFile(auctionHouse.toString())
    return
  }

  // Treasury 목적지 주소
  const treasuryWithdrawalDestinationOwner = new PublicKey(TREASURY_WALLET)

  // SOL인 경우 treasury withdrawal destination은 owner와 동일
  // (SPL 토큰인 경우 ATA가 필요)
  const treasuryWithdrawalDestination = treasuryWithdrawalDestinationOwner

  // 확인
  console.log('\n⚠️  Mainnet에서 Auction House를 생성합니다.')
  console.log(`   • Authority: ${authority.publicKey.toString()}`)
  console.log(`   • Treasury Mint: SOL (Native)`)
  console.log(`   • Seller Fee: ${SELLER_FEE_BASIS_POINTS} bp (${SELLER_FEE_BASIS_POINTS/100}%)`)
  console.log(`   • Treasury Destination: ${TREASURY_WALLET}`)

  const confirm = await promptUser('\n계속하시겠습니까? (y/N): ')
  if (confirm.toLowerCase() !== 'y') {
    console.log('취소됨')
    process.exit(0)
  }

  console.log('\n🔨 Auction House 생성 중...')

  try {
    // 인스트럭션 생성
    const instruction = createCreateAuctionHouseInstruction(
      {
        treasuryMint: NATIVE_MINT,
        payer: authority.publicKey,
        authority: authority.publicKey,
        feeWithdrawalDestination: authority.publicKey,
        treasuryWithdrawalDestination: treasuryWithdrawalDestination,
        treasuryWithdrawalDestinationOwner: treasuryWithdrawalDestinationOwner,
        auctionHouse: auctionHouse,
        auctionHouseFeeAccount: auctionHouseFeeAccount,
        auctionHouseTreasury: auctionHouseTreasury,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        ataProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
      },
      {
        bump: ahBump,
        feePayerBump: feeBump,
        treasuryBump: treasuryBump,
        sellerFeeBasisPoints: SELLER_FEE_BASIS_POINTS,
        requiresSignOff: false,
        canChangeSalePrice: true,
      }
    )

    const transaction = new Transaction().add(instruction)

    console.log('   트랜잭션 전송 중...')

    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [authority],
      {
        commitment: 'confirmed',
        preflightCommitment: 'confirmed',
      }
    )

    console.log('\n✅ Auction House 생성 완료!')
    console.log('='.repeat(50))
    console.log(`Auction House: ${auctionHouse.toString()}`)
    console.log(`Transaction: https://solscan.io/tx/${signature}`)
    console.log('='.repeat(50))

    updateEnvFile(auctionHouse.toString())

  } catch (error: any) {
    console.error('\n❌ 생성 실패:', error.message || error)

    if (error.logs) {
      console.log('\n📋 트랜잭션 로그:')
      error.logs.forEach((log: string) => console.log('   ', log))
    }

    console.log('\n💡 대안: Metaplex Sugar CLI 또는 Marketplace UI 사용')
    console.log('   https://www.metaplex.com/create-marketplace')

    process.exit(1)
  }
}

function updateEnvFile(auctionHouseAddress: string) {
  const envPath = path.join(process.cwd(), '.env.local')

  if (!fs.existsSync(envPath)) {
    console.log('\n⚠️  .env.local 파일이 없습니다.')
    console.log(`   수동으로 추가하세요: AUCTION_HOUSE_ADDRESS=${auctionHouseAddress}`)
    return
  }

  let envContent = fs.readFileSync(envPath, 'utf-8')

  if (envContent.includes('AUCTION_HOUSE_ADDRESS=')) {
    envContent = envContent.replace(
      /AUCTION_HOUSE_ADDRESS=.*/,
      `AUCTION_HOUSE_ADDRESS=${auctionHouseAddress}`
    )
  } else {
    envContent += `\nAUCTION_HOUSE_ADDRESS=${auctionHouseAddress}\n`
  }

  fs.writeFileSync(envPath, envContent)
  console.log('\n✅ .env.local 업데이트 완료!')
  console.log(`   AUCTION_HOUSE_ADDRESS=${auctionHouseAddress}`)
}

main().catch(console.error)
