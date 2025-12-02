import { supabase } from '@/lib/supabase/client'
import bs58 from 'bs58'

// Generate nonce for wallet authentication
export function generateNonce(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

// Create message to sign
export function createSignMessage(address: string, nonce: string): string {
  return `BeyondFleet 로그인

지갑 주소: ${address}
Nonce: ${nonce}
시간: ${new Date().toISOString()}

이 메시지에 서명하면 BeyondFleet에 로그인됩니다.
이 작업은 가스 비용이 들지 않습니다.`
}

// Verify Ethereum signature
export async function verifyEthSignature(
  address: string,
  message: string,
  signature: string
): Promise<boolean> {
  try {
    const { verifyMessage } = await import('viem')
    const isValid = await verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    })
    return isValid
  } catch (error) {
    console.error('ETH signature verification failed:', error)
    return false
  }
}

// Verify Solana signature
export async function verifySolanaSignature(
  publicKey: string,
  message: string,
  signature: Uint8Array
): Promise<boolean> {
  try {
    const { PublicKey } = await import('@solana/web3.js')
    const nacl = await import('tweetnacl')

    const pubKey = new PublicKey(publicKey)
    const messageBytes = new TextEncoder().encode(message)

    return nacl.sign.detached.verify(messageBytes, signature, pubKey.toBytes())
  } catch (error) {
    console.error('Solana signature verification failed:', error)
    return false
  }
}

// Save wallet to Supabase profile
export async function linkWalletToProfile(
  userId: string,
  walletAddress: string,
  walletType: 'ethereum' | 'solana'
): Promise<boolean> {
  try {
    const updateField = walletType === 'ethereum' ? 'eth_wallet' : 'sol_wallet'

    const { error } = await supabase
      .from('profiles')
      .update({ [updateField]: walletAddress })
      .eq('id', userId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Failed to link wallet:', error)
    return false
  }
}

// Get or create user by wallet
export async function getOrCreateWalletUser(
  walletAddress: string,
  walletType: 'ethereum' | 'solana'
): Promise<{ userId: string | null; isNew: boolean }> {
  try {
    const walletField = walletType === 'ethereum' ? 'eth_wallet' : 'sol_wallet'

    // Check if wallet already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq(walletField, walletAddress)
      .single()

    if (existingUser) {
      return { userId: existingUser.id, isNew: false }
    }

    // Wallet not linked to any account
    return { userId: null, isNew: true }
  } catch (error) {
    console.error('Error checking wallet user:', error)
    return { userId: null, isNew: true }
  }
}
