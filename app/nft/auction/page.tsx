'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Auction, NFT, TIER_INFO } from '@/types/nft'
import { supabase } from '@/lib/supabase/client'
import {
  getAuctionSchedule,
  formatTimeRemaining,
  formatKoreanDateTime,
  AuctionSchedule,
} from '@/lib/auction-schedule'

interface AuctionWithNFT extends Auction {
  nft: NFT
}

// Demo past auctions
const DEMO_PAST_AUCTIONS = [
  {
    id: 'past-1',
    nft: {
      id: 'nft-p1',
      name: 'Stellar Phoenix #042',
      image_url: 'https://picsum.photos/seed/past1/400/400',
      tier: 'admiral' as const,
    },
    final_bid: 12.5,
    winner: '7xKXt...9mPq',
    ended_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'past-2',
    nft: {
      id: 'nft-p2',
      name: 'Cosmic Warrior #156',
      image_url: 'https://picsum.photos/seed/past2/400/400',
      tier: 'commander' as const,
    },
    final_bid: 8.2,
    winner: '3mNxt...2kLp',
    ended_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'past-3',
    nft: {
      id: 'nft-p3',
      name: 'Void Navigator #089',
      image_url: 'https://picsum.photos/seed/past3/400/400',
      tier: 'pilot' as const,
    },
    final_bid: 4.8,
    winner: '9pQrt...7jKm',
    ended_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

function CountdownTimer({ targetTime, onComplete }: { targetTime: Date; onComplete?: () => void }) {
  const [timeLeft, setTimeLeft] = useState('')
  const [isUrgent, setIsUrgent] = useState(false)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Date.now()
      const diff = targetTime.getTime() - now

      if (diff <= 0) {
        setTimeLeft('종료됨')
        onComplete?.()
        return
      }

      setTimeLeft(formatTimeRemaining(diff))
      setIsUrgent(diff < 30 * 60 * 1000) // Less than 30 minutes
    }

    calculateTimeLeft()
    const interval = setInterval(calculateTimeLeft, 1000)
    return () => clearInterval(interval)
  }, [targetTime, onComplete])

  return (
    <span className={isUrgent ? 'text-red-400 animate-pulse' : 'text-cyan-400'}>
      {timeLeft}
    </span>
  )
}

export default function AuctionPage() {
  const [schedule, setSchedule] = useState<AuctionSchedule | null>(null)
  const [auctions, setAuctions] = useState<AuctionWithNFT[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [bidModal, setBidModal] = useState<{ auction: AuctionWithNFT } | null>(null)
  const [bidAmount, setBidAmount] = useState('')
  const [bidding, setBidding] = useState(false)
  const [showPastAuctions, setShowPastAuctions] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user ? { id: user.id } : null)
    })
  }, [])

  useEffect(() => {
    const updateSchedule = () => {
      setSchedule(getAuctionSchedule())
    }
    updateSchedule()
    const interval = setInterval(updateSchedule, 1000)
    return () => clearInterval(interval)
  }, [])

  const fetchAuctions = useCallback(async () => {
    if (!schedule?.isActive) {
      setLoading(false)
      return
    }

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
  }, [schedule?.isActive])

  useEffect(() => {
    fetchAuctions()
    if (schedule?.isActive) {
      const interval = setInterval(fetchAuctions, 30000)
      return () => clearInterval(interval)
    }
  }, [fetchAuctions, schedule?.isActive])

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
            매주 목요일 저녁 8시, 희귀한 NFT를 경매로 획득하세요
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

        {/* Auction Schedule Banner */}
        {schedule && (
          <div className="glass rounded-2xl p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`w-3 h-3 rounded-full ${schedule.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                  <span className={`text-lg font-bold ${schedule.isActive ? 'text-green-400' : 'text-gray-400'}`}>
                    {schedule.isActive ? '옥션 진행 중!' : '옥션 준비 중'}
                  </span>
                </div>
                {schedule.isActive ? (
                  <p className="text-gray-300">
                    경매 종료까지: <CountdownTimer targetTime={schedule.currentAuctionEnd!} />
                  </p>
                ) : (
                  <p className="text-gray-300">
                    다음 옥션: <span className="text-cyan-400">{formatKoreanDateTime(schedule.nextAuctionStart)}</span>
                  </p>
                )}
              </div>

              {!schedule.isActive && (
                <div className="text-center md:text-right">
                  <p className="text-sm text-gray-500 mb-1">옥션 시작까지</p>
                  <div className="text-2xl font-bold text-white">
                    <CountdownTimer targetTime={schedule.nextAuctionStart} />
                  </div>
                </div>
              )}
            </div>

            {/* Schedule Info */}
            <div className="mt-4 pt-4 border-t border-purple-500/20 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span>매주 목요일 20:00 KST</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>2시간 동안 진행</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span>희귀 NFT 출품</span>
              </div>
            </div>
          </div>
        )}

        {/* Auction Content */}
        {schedule?.isActive ? (
          // Active Auction
          loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="glass rounded-xl overflow-hidden animate-pulse">
                  <div className="aspect-square bg-purple-500/20" />
                  <div className="p-4">
                    <div className="h-6 bg-purple-500/20 rounded w-3/4 mb-4" />
                    <div className="h-4 bg-purple-500/20 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : auctions.length === 0 ? (
            <div className="glass rounded-xl p-12 text-center">
              <p className="text-4xl mb-4">🎭</p>
              <p className="text-gray-400 text-lg">현재 진행 중인 경매가 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {auctions.map((auction) => (
                <div
                  key={auction.id}
                  className="glass rounded-xl overflow-hidden card-hover group relative"
                >
                  {/* Live Badge */}
                  <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-red-500/90 px-3 py-1 rounded-full">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    <span className="text-white text-xs font-bold">LIVE</span>
                  </div>

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
                        <span className="text-cyan-400 font-bold text-lg">
                          {auction.current_bid || auction.start_price} SOL
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 text-sm">남은 시간</span>
                        <CountdownTimer targetTime={schedule.currentAuctionEnd!} />
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
                          ((auction.current_bid || auction.start_price) + 0.1).toFixed(1)
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
          )
        ) : (
          // Auction Not Active
          <div className="space-y-8">
            {/* Coming Soon */}
            <div className="glass rounded-2xl p-8 text-center">
              <div className="text-6xl mb-4">⏰</div>
              <h3 className="text-2xl font-bold text-white mb-2">
                옥션이 진행 중이 아닙니다
              </h3>
              <p className="text-gray-400 mb-6">
                다음 옥션은 <span className="text-cyan-400 font-bold">{schedule ? formatKoreanDateTime(schedule.nextAuctionStart) : ''}</span>에 시작됩니다
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 text-purple-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                </svg>
                <span>알림 받기</span>
              </div>
            </div>

            {/* Past Auctions Toggle */}
            <div>
              <button
                onClick={() => setShowPastAuctions(!showPastAuctions)}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
              >
                <svg
                  className={`w-5 h-5 transition-transform ${showPastAuctions ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <span className="font-medium">지난 옥션 결과</span>
              </button>

              {showPastAuctions && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {DEMO_PAST_AUCTIONS.map((past) => (
                    <div key={past.id} className="glass rounded-xl overflow-hidden opacity-75">
                      <div className="relative aspect-square bg-space-800/50">
                        <Image
                          src={past.nft.image_url}
                          alt={past.nft.name}
                          fill
                          className="object-cover grayscale"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="px-4 py-2 rounded-full bg-green-500/90 text-white font-bold">
                            낙찰됨
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        <h4 className="text-white font-bold mb-2">{past.nft.name}</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">낙찰가</span>
                            <span className="text-cyan-400 font-bold">{past.final_bid} SOL</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">낙찰자</span>
                            <span className="text-gray-400 font-mono">{past.winner}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
