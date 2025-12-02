'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useAccount, useDisconnect } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import Button from '@/components/ui/Button'

interface Web3LoginProps {
  onSuccess: () => void
  onError: (error: string) => void
}

export default function Web3Login({ onSuccess, onError }: Web3LoginProps) {
  const [countdown, setCountdown] = useState<number | null>(null)
  const hasCalledSuccess = useRef(false)

  // Ethereum (wagmi + rainbowkit)
  const { address: ethAddress, isConnected: isEthConnected } = useAccount()
  const { openConnectModal } = useConnectModal()
  const { disconnect: disconnectEth } = useDisconnect()

  // Solana (wallet-adapter)
  const { publicKey, disconnect: disconnectSolana, connected: isSolConnected } = useWallet()
  const { setVisible: setSolanaModalVisible } = useWalletModal()

  const solAddress = publicKey?.toBase58()
  const isConnected = isEthConnected || isSolConnected

  // 지갑 연결되면 2초 후 자동으로 모달 닫기
  useEffect(() => {
    if (isConnected && !hasCalledSuccess.current) {
      setCountdown(2)

      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(timer)
            if (!hasCalledSuccess.current) {
              hasCalledSuccess.current = true
              onSuccess()
            }
            return null
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [isConnected, onSuccess])

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

  // Disconnect all wallets
  const handleDisconnect = () => {
    hasCalledSuccess.current = false
    setCountdown(null)
    if (isEthConnected) disconnectEth()
    if (isSolConnected) disconnectSolana()
  }

  const connectedAddress = ethAddress || solAddress
  const walletType = isEthConnected ? 'Ethereum' : isSolConnected ? 'Solana' : null

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      {isConnected && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-400 text-sm font-medium flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                {walletType} 지갑 연결됨
              </p>
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
          {countdown !== null && (
            <p className="text-cyan-400 text-sm mt-3 text-center">
              {countdown}초 후 자동으로 닫힙니다...
            </p>
          )}
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

      {/* Security Notice */}
      <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
        <p className="text-gray-400 text-xs">
          <span className="text-purple-400">🔒 보안 안내:</span> 지갑 연결은 주소 확인에만 사용되며,
          자산 이동이나 승인 권한을 요청하지 않습니다.
        </p>
      </div>
    </div>
  )
}
