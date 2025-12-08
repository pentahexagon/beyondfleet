/**
 * Solana 키페어 생성 스크립트
 * Solana CLI 없이 키페어를 생성합니다.
 */

import { Keypair } from '@solana/web3.js'
import * as fs from 'fs'
import * as path from 'path'

const CONFIG_DIR = path.join(process.env.HOME || '', '.config/solana')
const KEYPAIR_PATH = path.join(CONFIG_DIR, 'id.json')

async function main() {
  console.log('\n🔑 Solana 키페어 생성\n')

  // 이미 존재하는지 확인
  if (fs.existsSync(KEYPAIR_PATH)) {
    console.log('⚠️  키페어가 이미 존재합니다:', KEYPAIR_PATH)
    const existing = JSON.parse(fs.readFileSync(KEYPAIR_PATH, 'utf-8'))
    const keypair = Keypair.fromSecretKey(Uint8Array.from(existing))
    console.log('   주소:', keypair.publicKey.toString())
    return
  }

  // 디렉토리 생성
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true })
    console.log('📁 디렉토리 생성:', CONFIG_DIR)
  }

  // 새 키페어 생성
  const keypair = Keypair.generate()

  // 저장
  fs.writeFileSync(
    KEYPAIR_PATH,
    JSON.stringify(Array.from(keypair.secretKey)),
    { mode: 0o600 } // 소유자만 읽기/쓰기
  )

  console.log('✅ 키페어 생성 완료!')
  console.log('=' .repeat(50))
  console.log('📍 파일 위치:', KEYPAIR_PATH)
  console.log('👛 지갑 주소:', keypair.publicKey.toString())
  console.log('=' .repeat(50))

  console.log('\n⚠️  중요: 이 지갑에 SOL을 전송해야 Auction House를 생성할 수 있습니다.')
  console.log('   필요한 금액: 약 0.01 SOL\n')

  console.log('다음 단계:')
  console.log(`1. 위 지갑 주소로 SOL 전송 (최소 0.01 SOL)`)
  console.log('2. npx tsx scripts/create-auction-house.ts 실행\n')
}

main().catch(console.error)
