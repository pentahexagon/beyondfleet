'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Auction, NFT, TIER_INFO } from '@/types/nft'
import { supabase } from '@/lib/supabase/client'

interface AuctionWithNFT extends Auction {
  nft: NFT
}

function CountdownTimer({ endTime }: { endTime: string }) {
  const [timeLeft, setTimeLeft] = useState('')
  const [isUrgent, setIsUrgent] = useState(false)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const end = new Date(endTime).getTime()
      const now = Date.now()
      const diff = end - now

      if (diff <= 0) {
        setTimeLeft('종료됨')
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setIsUrgent(hours < 1)

      if (hours > 24) {
        const days = Math.floor(hours / 24)
        setTimeLeft(`${days}일 ${hours % 24}시간`)
      } else if (hours > 0) {
        setTimeLeft(`${hours}시간 ${minutes}분`)
      } else {
        setTimeLeft(`${minutes}분 ${seconds}초`)
      }
    }

    calculateTimeLeft()
    const interval = setInterval(calculateTimeLeft, 1000)
    return () => clearInterval(interval)
  }, [endTime])

  return (
    <span className={isUrgent ? 'text-red-400 animate-pulse' : 'text-cyan-400'}>
      {timeLeft}
    </span>
  )
}

export default function AuctionPage() {
  const [auctions, setAuctions] = useState<AuctionWithNFT[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [bidModal, setBidModal] = useState<{ auction: AuctionWithNFT } | null>(null)
  const [bidAmount, setBidAmount] = useState('')
  const [bidding, setBidding] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user ? { id: user.id } : null)
    })
  }, [])

  const fetchAuctions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/nft/auction?status=active')
      const data = await res.json()
      setAuctions(data.auctions || [])
    } catch (error) {
      console.error('Error fetching auctions:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAuctions()
    // Refresh every 30 seconds
    const interval = setInterval(fetchAuctions, 30000)
    return () => clearInterval(interval)
  }, [fetchAuctions])

  const handleBid = async () => {
    if (!bidModal || !user || !bidAmount) return

    const amount = parseFloat(bidAmount)
    const minBid = bidModal.auction.current_bid
      ? bidModal.auction.current_bid + 0.1
      : bidModal.auction.start_price

    if (amount < minBid) {
      alert(`최소 ${minBid} SOL 이상 입찰해야 합니다.`)
      return
    }

    setBidding(true)
    try {
      const res = await fetch('/api/nft/auction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auction_id: bidModal.auction.id,
          amount,
          user_id: user.id,
        }),
      })

      const data = await res.json()
      if (data.success) {
        alert('입찰이 완료되었습니다!')
        setBidModal(null)
        setBidAmount('')
        fetchAuctions()
      } else {
        alert(data.error || '입찰에 실패했습니다.')
      }
    } catch (error) {
      console.error('Error placing bid:', error)
      alert('입찰에 실패했습니다.')
    } finally {
      setBidding(false)
    }
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            NFT 옥션
          </h1>
          <p className="text-gray-400">
            실시간 경매에 참여하여 희귀한 NFT를 획득하세요
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          <Link
            href="/nft"
            className="px-6 py-3 rounded-xl bg-space-800/50 text-gray-400 hover:text-white hover:bg-space-700/50 transition-all font-medium"
          >
            마켓플레이스
          </Link>
          <Link
            href="/nft/auction"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-medium"
          >
            옥션
          </Link>
          <Link
            href="/nft/randombox"
            className="px-6 py-3 rounded-xl bg-space-800/50 text-gray-400 hover:text-white hover:bg-space-700/50 transition-all font-medium"
          >
            랜덤박스
          </Link>
        </div>

        {/* Auctions Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass rounded-xl overflow-hidden animate-pulse">
                <div className="aspect-square bg-purple-500/20" />
                <div className="p-4">
                  <div className="h-6 bg-purple-500/20 rounded w-3/4 mb-4" />
                  <div className="h-4 bg-purple-500/20 rounded w-1/2 mb-2" />
                  <div className="h-4 bg-purple-500/20 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : auctions.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center">
            <p className="text-gray-400 text-lg">진행 중인 경매가 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {auctions.map((auction) => (
              <div
                key={auction.id}
                className="glass rounded-xl overflow-hidden card-hover group"
              >
                {/* Image */}
                <div className="relative aspect-square bg-space-800/50">
                  <Image
                    src={auction.nft.image_url}
                    alt={auction.nft.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  {/* Tier Badge */}
                  <div className="absolute top-3 left-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${
                        TIER_INFO[auction.nft.tier].color
                      } text-white`}
                    >
                      {TIER_INFO[auction.nft.tier].icon} {TIER_INFO[auction.nft.tier].name}
                    </span>
                  </div>
                  {/* Timer Badge */}
                  <div className="absolute top-3 right-3">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-black/60 backdrop-blur-sm text-white flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <CountdownTimer endTime={auction.end_time} />
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-white font-bold text-lg mb-3 truncate group-hover:text-cyan-400 transition-colors">
                    {auction.nft.name}
                  </h3>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-sm">시작가</span>
                      <span className="text-gray-400">{auction.start_price} SOL</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-sm">현재 입찰가</span>
                      <span className="text-cyan-400 font-bold">
                        {auction.current_bid || auction.start_price} SOL
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (!user) {
                        alert('로그인이 필요합니다.')
                        return
                      }
                      setBidModal({ auction })
                      setBidAmount(
                        (
                          (auction.current_bid || auction.start_price) + 0.1
                        ).toFixed(1)
                      )
                    }}
                    className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-medium hover:opacity-90 transition-opacity"
                  >
                    입찰하기
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bid Modal */}
      {bidModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="glass rounded-2xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">입찰하기</h3>
              <button
                onClick={() => setBidModal(null)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="relative w-20 h-20 rounded-lg overflow-hidden">
                <Image
                  src={bidModal.auction.nft.image_url}
                  alt={bidModal.auction.nft.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h4 className="text-white font-bold">{bidModal.auction.nft.name}</h4>
                <p className="text-gray-400 text-sm">
                  현재 입찰가: {bidModal.auction.current_bid || bidModal.auction.start_price} SOL
                </p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-gray-400 text-sm mb-2">입찰 금액 (SOL)</label>
              <input
                type="number"
                step="0.1"
                min={(bidModal.auction.current_bid || bidModal.auction.start_price) + 0.1}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-space-800/50 border border-purple-500/30 text-white focus:border-purple-500 focus:outline-none"
                placeholder="입찰 금액을 입력하세요"
              />
              <p className="text-gray-500 text-xs mt-2">
                최소 입찰가: {((bidModal.auction.current_bid || bidModal.auction.start_price) + 0.1).toFixed(1)} SOL
              </p>
            </div>

            <button
              onClick={handleBid}
              disabled={bidding}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {bidding ? '입찰 중...' : '입찰 확인'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
