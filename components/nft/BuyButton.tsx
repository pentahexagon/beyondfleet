'use client'

import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { ShoppingCart, Loader2, Check, AlertCircle } from 'lucide-react'

interface BuyButtonProps {
  nftId: string
  nftName: string
  price: number
  disabled?: boolean
  onSuccess?: () => void
}

type PurchaseState = 'idle' | 'loading' | 'signing' | 'confirming' | 'success' | 'error'

export default function BuyButton({
  nftId,
  nftName,
  price,
  disabled = false,
  onSuccess,
}: BuyButtonProps) {
  const { connected, publicKey, signTransaction } = useWallet()
  const { setVisible } = useWalletModal()
  const [state, setState] = useState<PurchaseState>('idle')
  const [error, setError] = useState<string | null>(null)

  const handleBuy = async () => {
    if (!connected || !publicKey) {
      setVisible(true)
      return
    }

    setError(null)
    setState('loading')

    try {
      // 1. 구매 트랜잭션 요청
      const response = await fetch('/api/nft/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nftId,
          buyerWallet: publicKey.toString(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '구매 요청 실패')
      }

      setState('signing')

      // 2. 지갑 서명 요청 (실제 구현에서는 트랜잭션 생성 및 서명)
      // 여기서는 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1500))

      // 시뮬레이션된 트랜잭션 서명
      const simulatedTxSignature = `sim_${Date.now()}_${Math.random().toString(36).slice(2)}`

      setState('confirming')

      // 3. 트랜잭션 확인 요청
      const confirmResponse = await fetch('/api/nft/purchase', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nftId,
          buyerWallet: publicKey.toString(),
          txSignature: simulatedTxSignature,
        }),
      })

      const confirmData = await confirmResponse.json()

      if (!confirmResponse.ok) {
        throw new Error(confirmData.error || '구매 확인 실패')
      }

      setState('success')
      onSuccess?.()

      // 3초 후 초기화
      setTimeout(() => {
        setState('idle')
      }, 3000)

    } catch (err) {
      console.error('Purchase error:', err)
      setError(err instanceof Error ? err.message : '구매 실패')
      setState('error')

      // 5초 후 에러 상태 초기화
      setTimeout(() => {
        setState('idle')
        setError(null)
      }, 5000)
    }
  }

  const getButtonContent = () => {
    switch (state) {
      case 'loading':
        return (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>처리 중...</span>
          </>
        )
      case 'signing':
        return (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>지갑 서명 대기...</span>
          </>
        )
      case 'confirming':
        return (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>트랜잭션 확인 중...</span>
          </>
        )
      case 'success':
        return (
          <>
            <Check className="w-5 h-5" />
            <span>구매 완료!</span>
          </>
        )
      case 'error':
        return (
          <>
            <AlertCircle className="w-5 h-5" />
            <span>구매 실패</span>
          </>
        )
      default:
        return (
          <>
            <ShoppingCart className="w-5 h-5" />
            <span>{connected ? `${price} SOL 구매` : '지갑 연결'}</span>
          </>
        )
    }
  }

  const getButtonClass = () => {
    const baseClass = 'flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl font-bold transition-all duration-200'

    switch (state) {
      case 'success':
        return `${baseClass} bg-green-500 text-white`
      case 'error':
        return `${baseClass} bg-red-500 text-white`
      case 'loading':
      case 'signing':
      case 'confirming':
        return `${baseClass} bg-purple-500/50 text-white cursor-wait`
      default:
        return `${baseClass} bg-gradient-to-r from-purple-500 to-cyan-500 text-white hover:from-purple-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed`
    }
  }

  const isDisabled = disabled || state !== 'idle'

  return (
    <div className="space-y-2">
      <button
        onClick={handleBuy}
        disabled={isDisabled}
        className={getButtonClass()}
      >
        {getButtonContent()}
      </button>

      {error && (
        <p className="text-red-400 text-sm text-center">{error}</p>
      )}

      {state === 'idle' && connected && (
        <p className="text-gray-400 text-xs text-center">
          구매 시 지갑에서 서명을 요청합니다
        </p>
      )}
    </div>
  )
}
