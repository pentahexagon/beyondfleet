'use client'

import { useState, useCallback } from 'react'
import { useAccount, useSignMessage, useDisconnect } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import Button from '@/components/ui/Button'
import { generateNonce, createSignMessage } from '@/lib/web3/auth'

interface Web3LoginProps {
  onSuccess: () => void
  onError: (error: string) => void
}

export default function Web3Login({ onSuccess, onError }: Web3LoginProps) {
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'connect' | 'sign'>('connect')

  // Ethereum (wagmi + rainbowkit)
  const { address: ethAddress, isConnected: isEthConnected } = useAccount()
  const { openConnectModal } = useConnectModal()
  const { signMessageAsync } = useSignMessage()
  const { disconnect: disconnectEth } = useDisconnect()

  // Solana (wallet-adapter)
  const { publicKey, signMessage: signSolanaMessage, disconnect: disconnectSolana, connected: isSolConnected } = useWallet()
  const { setVisible: setSolanaModalVisible } = useWalletModal()

  const solAddress = publicKey?.toBase58()

  // Handle Ethereum wallet connect
  const handleEthConnect = useCallback(() => {
    if (openConnectModal) {
      openConnectModal()
    }
  }, [openConnectModal])

  // Handle Solana wallet connect
  const handleSolConnect = useCallback(() => {
    setSolanaModalVisible(true)
  }, [setSolanaModalVisible])

  // Sign message with Ethereum wallet
  const handleEthSign = useCallback(async () => {
    if (!ethAddress) return

    setLoading(true)
    try {
      const nonce = generateNonce()
      const message = createSignMessage(ethAddress, nonce)

      const signature = await signMessageAsync({ message })

      // Verify signature on server
      const response = await fetch('/api/auth/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: ethAddress,
          walletType: 'ethereum',
          message,
          signature,
          nonce,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '인증에 실패했습니다.')
      }

      onSuccess()
    } catch (error) {
      console.error('ETH sign error:', error)
      onError(error instanceof Error ? error.message : '서명에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }, [ethAddress, signMessageAsync, onSuccess, onError])

  // Sign message with Solana wallet
  const handleSolSign = useCallback(async () => {
    if (!publicKey || !signSolanaMessage) return

    setLoading(true)
    try {
      const nonce = generateNonce()
      const message = createSignMessage(publicKey.toBase58(), nonce)
      const messageBytes = new TextEncoder().encode(message)

      const signature = await signSolanaMessage(messageBytes)

      // Verify signature on server
      const response = await fetch('/api/auth/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey.toBase58(),
          walletType: 'solana',
          message,
          signature: Array.from(signature),
          nonce,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '인증에 실패했습니다.')
      }

      onSuccess()
    } catch (error) {
      console.error('SOL sign error:', error)
      onError(error instanceof Error ? error.message : '서명에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }, [publicKey, signSolanaMessage, onSuccess, onError])

  // Disconnect all wallets
  const handleDisconnect = () => {
    if (isEthConnected) disconnectEth()
    if (isSolConnected) disconnectSolana()
    setStep('connect')
  }

  const isConnected = isEthConnected || isSolConnected
  const connectedAddress = ethAddress || solAddress
  const walletType = isEthConnected ? 'Ethereum' : isSolConnected ? 'Solana' : null

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      {isConnected && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-400 text-sm font-medium">{walletType} 지갑 연결됨</p>
              <p className="text-gray-400 text-xs font-mono mt-1">
                {connectedAddress?.slice(0, 6)}...{connectedAddress?.slice(-4)}
              </p>
            </div>
            <button
              onClick={handleDisconnect}
              className="text-gray-400 hover:text-white text-sm"
            >
              연결 해제
            </button>
          </div>
        </div>
      )}

      {/* Wallet Connect Buttons */}
      {!isConnected && (
        <>
          <div className="text-center mb-4">
            <p className="text-gray-400 text-sm">지갑을 연결하여 로그인하세요</p>
          </div>

          {/* Ethereum Wallets */}
          <div className="space-y-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Ethereum</p>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleEthConnect}
            >
              <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" className="w-6 h-6 mr-3" />
              MetaMask / WalletConnect
            </Button>
          </div>

          {/* Solana Wallets */}
          <div className="space-y-3 mt-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Solana</p>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleSolConnect}
            >
              <img src="https://phantom.app/img/phantom-icon-purple.svg" alt="Phantom" className="w-6 h-6 mr-3" />
              Phantom / Solflare
            </Button>
          </div>
        </>
      )}

      {/* Sign Message Button */}
      {isConnected && (
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-2">
              지갑 소유권을 확인하기 위해 메시지에 서명해주세요.
            </p>
            <p className="text-gray-500 text-xs">
              이 작업은 가스 비용이 들지 않습니다.
            </p>
          </div>

          <Button
            className="w-full"
            onClick={isEthConnected ? handleEthSign : handleSolSign}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                서명 중...
              </span>
            ) : (
              '🔐 메시지 서명하기'
            )}
          </Button>
        </div>
      )}

      {/* Security Notice */}
      <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
        <p className="text-gray-400 text-xs">
          <span className="text-purple-400">🔒 보안 안내:</span> 서명은 지갑 소유권 확인에만 사용되며,
          자산 이동이나 승인 권한을 요청하지 않습니다.
        </p>
      </div>
    </div>
  )
}
