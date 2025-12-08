'use client'

import { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { Gavel, Loader2, Check, AlertCircle, TrendingUp } from 'lucide-react'

interface BidFormProps {
  auctionId: string
  nftName: string
  currentBid: number | null
  startPrice: number
  minIncrement?: number // 최소 증가율 (기본 5%)
  disabled?: boolean
  onSuccess?: (newBid: number, extended: boolean) => void
}

type BidState = 'idle' | 'loading' | 'signing' | 'confirming' | 'success' | 'error'

export default function BidForm({
  auctionId,
  nftName,
  currentBid,
  startPrice,
  minIncrement = 0.05, // 5%
  disabled = false,
  onSuccess,
}: BidFormProps) {
  const { connected, publicKey } = useWallet()
  const { setVisible } = useWalletModal()
  const [state, setState] = useState<BidState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [bidAmount, setBidAmount] = useState('')
  const [extended, setExtended] = useState(false)

  // 최소 입찰가 계산
  const minimumBid = currentBid
    ? Math.ceil((currentBid * (1 + minIncrement)) * 10000) / 10000
    : startPrice

  // 기본값 설정
  useEffect(() => {
    if (!bidAmount) {
      setBidAmount(minimumBid.toFixed(4))
    }
  }, [minimumBid])

  const quickBidOptions = [
    { label: '최소', amount: minimumBid },
    { label: '+10%', amount: Math.ceil(minimumBid * 1.1 * 10000) / 10000 },
    { label: '+20%', amount: Math.ceil(minimumBid * 1.2 * 10000) / 10000 },
  ]

  const handleBid = async () => {
    if (!connected || !publicKey) {
      setVisible(true)
      return
    }

    const amount = parseFloat(bidAmount)
    if (isNaN(amount) || amount < minimumBid) {
      setError(`최소 ${minimumBid.toFixed(4)} SOL 이상 입찰해야 합니다`)
      return
    }

    setError(null)
    setExtended(false)
    setState('loading')

    try {
      // 1. 입찰 트랜잭션 요청
      const response = await fetch('/api/nft/auction/bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auctionId,
          bidderWallet: publicKey.toString(),
          amount,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '입찰 요청 실패')
      }

      setState('signing')

      // 2. 지갑 서명 요청 (시뮬레이션)
      await new Promise(resolve => setTimeout(resolve, 1500))

      const simulatedTxSignature = `bid_${Date.now()}_${Math.random().toString(36).slice(2)}`

      setState('confirming')

      // 3. 입찰 확인 요청
      const confirmResponse = await fetch('/api/nft/auction/bid', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auctionId,
          bidderWallet: publicKey.toString(),
          amount,
          txSignature: simulatedTxSignature,
          timeExtended: data.transaction.timeExtended,
          newEndTime: data.transaction.newEndTime,
          extensionCount: data.transaction.extensionCount,
        }),
      })

      const confirmData = await confirmResponse.json()

      if (!confirmResponse.ok) {
        throw new Error(confirmData.error || '입찰 확인 실패')
      }

      setState('success')
      setExtended(data.transaction.timeExtended)
      onSuccess?.(amount, data.transaction.timeExtended)

      // 3초 후 초기화
      setTimeout(() => {
        setState('idle')
        setExtended(false)
        // 다음 최소 입찰가로 업데이트
        const nextMinimum = Math.ceil(amount * (1 + minIncrement) * 10000) / 10000
        setBidAmount(nextMinimum.toFixed(4))
      }, 3000)

    } catch (err) {
      console.error('Bid error:', err)
      setError(err instanceof Error ? err.message : '입찰 실패')
      setState('error')

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
            <span>입찰 확인 중...</span>
          </>
        )
      case 'success':
        return (
          <>
            <Check className="w-5 h-5" />
            <span>{extended ? '입찰 완료! +5분 연장' : '입찰 완료!'}</span>
          </>
        )
      case 'error':
        return (
          <>
            <AlertCircle className="w-5 h-5" />
            <span>입찰 실패</span>
          </>
        )
      default:
        return (
          <>
            <Gavel className="w-5 h-5" />
            <span>{connected ? '입찰하기' : '지갑 연결'}</span>
          </>
        )
    }
  }

  const getButtonClass = () => {
    const baseClass = 'flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl font-bold transition-all duration-200'

    switch (state) {
      case 'success':
        return `${baseClass} ${extended ? 'bg-yellow-500' : 'bg-green-500'} text-white`
      case 'error':
        return `${baseClass} bg-red-500 text-white`
      case 'loading':
      case 'signing':
      case 'confirming':
        return `${baseClass} bg-amber-500/50 text-white cursor-wait`
      default:
        return `${baseClass} bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed`
    }
  }

  const isProcessing = state !== 'idle' && state !== 'error'

  return (
    <div className="space-y-4">
      {/* 현재 입찰가 */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">현재 입찰가</span>
        <span className="text-white font-bold">
          {currentBid ? `${currentBid} SOL` : '입찰 없음'}
        </span>
      </div>

      {/* 빠른 입찰 버튼 */}
      <div className="flex gap-2">
        {quickBidOptions.map((option) => (
          <button
            key={option.label}
            onClick={() => setBidAmount(option.amount.toFixed(4))}
            disabled={isProcessing || disabled}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all
              ${bidAmount === option.amount.toFixed(4)
                ? 'bg-amber-500 text-white'
                : 'bg-space-800 text-gray-300 hover:bg-space-700'
              } disabled:opacity-50`}
          >
            {option.label}
            <div className="text-xs opacity-75">{option.amount.toFixed(2)}</div>
          </button>
        ))}
      </div>

      {/* 입찰 금액 입력 */}
      <div className="relative">
        <input
          type="number"
          value={bidAmount}
          onChange={(e) => setBidAmount(e.target.value)}
          disabled={isProcessing || disabled}
          step="0.0001"
          min={minimumBid}
          placeholder={`최소 ${minimumBid.toFixed(4)} SOL`}
          className="w-full bg-space-800 border border-purple-500/20 rounded-xl py-3 px-4 pr-16
            text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50
            disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
          SOL
        </span>
      </div>

      {/* 최소 입찰가 안내 */}
      <div className="flex items-center gap-1 text-xs text-gray-500">
        <TrendingUp className="w-3 h-3" />
        <span>최소 입찰가: {minimumBid.toFixed(4)} SOL (+{minIncrement * 100}%)</span>
      </div>

      {/* 입찰 버튼 */}
      <button
        onClick={handleBid}
        disabled={disabled || isProcessing}
        className={getButtonClass()}
      >
        {getButtonContent()}
      </button>

      {/* 에러 메시지 */}
      {error && (
        <p className="text-red-400 text-sm text-center">{error}</p>
      )}

      {/* 안내 문구 */}
      {state === 'idle' && connected && (
        <p className="text-gray-400 text-xs text-center">
          입찰 시 SOL이 에스크로에 예치됩니다. 더 높은 입찰 시 자동 환불됩니다.
        </p>
      )}
    </div>
  )
}
