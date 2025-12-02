'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { NFT, NFTTier, TIER_INFO } from '@/types/nft'
import { supabase } from '@/lib/supabase/client'

type SortType = 'latest' | 'price_asc' | 'price_desc'
type ViewMode = 'marketplace' | 'my-nfts'

const TIERS: { label: string; value: NFTTier | 'all'; icon: string }[] = [
  { label: '전체', value: 'all', icon: '🌌' },
  { label: 'Cadet', value: 'cadet', icon: '🌱' },
  { label: 'Navigator', value: 'navigator', icon: '⭐' },
  { label: 'Pilot', value: 'pilot', icon: '🚀' },
  { label: 'Commander', value: 'commander', icon: '🌟' },
  { label: 'Admiral', value: 'admiral', icon: '🌌' },
]

const SORTS: { label: string; value: SortType }[] = [
  { label: '최신순', value: 'latest' },
  { label: '가격 낮은순', value: 'price_asc' },
  { label: '가격 높은순', value: 'price_desc' },
]

export default function NFTMarketplace() {
  const [nfts, setNfts] = useState<NFT[]>([])
  const [loading, setLoading] = useState(true)
  const [tier, setTier] = useState<NFTTier | 'all'>('all')
  const [sort, setSort] = useState<SortType>('latest')
  const [viewMode, setViewMode] = useState<ViewMode>('marketplace')
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [giftModal, setGiftModal] = useState<{ nft: NFT } | null>(null)
  const [giftAddress, setGiftAddress] = useState('')
  const [giftMessage, setGiftMessage] = useState('')
  const [gifting, setGifting] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user ? { id: user.id } : null)
    })
  }, [])

  useEffect(() => {
    fetchNFTs()
  }, [tier, sort, viewMode])

  const fetchNFTs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        tier,
        sort,
        listed: viewMode === 'marketplace' ? 'true' : 'false',
      })
      const res = await fetch(`/api/nft?${params}`)
      const data = await res.json()
      setNfts(data.nfts || [])
    } catch (error) {
      console.error('Error fetching NFTs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGift = async () => {
    if (!giftModal || !user || !giftAddress) return

    if (giftAddress.length < 32 || giftAddress.length > 44) {
      alert('유효한 지갑 주소를 입력해주세요.')
      return
    }

    setGifting(true)
    try {
      const res = await fetch('/api/nft/gift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nft_id: giftModal.nft.id,
          from_user: user.id,
          to_wallet: giftAddress,
          message: giftMessage,
        }),
      })

      const data = await res.json()
      if (data.success) {
        alert('NFT가 성공적으로 전송되었습니다!')
        setGiftModal(null)
        setGiftAddress('')
        setGiftMessage('')
        fetchNFTs()
      } else {
        alert(data.error || '선물 전송에 실패했습니다.')
      }
    } catch (error) {
      console.error('Error sending gift:', error)
      alert('선물 전송에 실패했습니다.')
    } finally {
      setGifting(false)
    }
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            NFT 마켓플레이스
          </h1>
          <p className="text-gray-400">
            BeyondFleet의 독점 NFT 컬렉션을 만나보세요
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          <Link
            href="/nft"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-medium"
          >
            마켓플레이스
          </Link>
          <Link
            href="/nft/auction"
            className="px-6 py-3 rounded-xl bg-space-800/50 text-gray-400 hover:text-white hover:bg-space-700/50 transition-all font-medium"
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

        {/* View Mode Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setViewMode('marketplace')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'marketplace'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'bg-space-800/50 text-gray-400 hover:text-white'
            }`}
          >
            마켓플레이스
          </button>
          <button
            onClick={() => setViewMode('my-nfts')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'my-nfts'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'bg-space-800/50 text-gray-400 hover:text-white'
            }`}
          >
            내 NFT
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          {/* Tier Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {TIERS.map((t) => (
              <button
                key={t.value}
                onClick={() => setTier(t.value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                  tier === t.value
                    ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white'
                    : 'bg-space-800/50 text-gray-400 hover:text-white hover:bg-space-700/50'
                }`}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="ml-auto">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortType)}
              className="px-4 py-2 rounded-xl bg-space-800/50 text-gray-300 border border-purple-500/30 focus:border-purple-500 focus:outline-none"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* NFT Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="glass rounded-xl overflow-hidden animate-pulse">
                <div className="aspect-square bg-purple-500/20" />
                <div className="p-4">
                  <div className="h-4 bg-purple-500/20 rounded w-1/4 mb-3" />
                  <div className="h-6 bg-purple-500/20 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-purple-500/20 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : nfts.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center">
            <p className="text-gray-400 text-lg">등록된 NFT가 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {nfts.map((nft) => (
              <div
                key={nft.id}
                className="glass rounded-xl overflow-hidden card-hover group"
              >
                {/* Image */}
                <div className="relative aspect-square bg-space-800/50">
                  <Image
                    src={nft.image_url}
                    alt={nft.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  {/* Tier Badge */}
                  <div className="absolute top-3 left-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${
                        TIER_INFO[nft.tier].color
                      } text-white`}
                    >
                      {TIER_INFO[nft.tier].icon} {TIER_INFO[nft.tier].name}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-white font-bold text-lg mb-2 truncate group-hover:text-cyan-400 transition-colors">
                    {nft.name}
                  </h3>
                  {nft.description && (
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                      {nft.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">가격</p>
                      <p className="text-lg font-bold text-cyan-400">
                        {nft.price} SOL
                      </p>
                    </div>
                    {viewMode === 'marketplace' ? (
                      <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-medium text-sm hover:opacity-90 transition-opacity">
                        구매하기
                      </button>
                    ) : (
                      <button
                        onClick={() => setGiftModal({ nft })}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium text-sm hover:opacity-90 transition-opacity flex items-center gap-1"
                      >
                        <span>🎁</span> 선물
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Gift Modal */}
      {giftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="glass rounded-2xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">NFT 선물하기</h3>
              <button
                onClick={() => setGiftModal(null)}
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
                  src={giftModal.nft.image_url}
                  alt={giftModal.nft.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h4 className="text-white font-bold">{giftModal.nft.name}</h4>
                <p className="text-gray-400 text-sm">
                  {TIER_INFO[giftModal.nft.tier].icon} {TIER_INFO[giftModal.nft.tier].name}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-400 text-sm mb-2">받는 사람 지갑 주소</label>
              <input
                type="text"
                value={giftAddress}
                onChange={(e) => setGiftAddress(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-space-800/50 border border-purple-500/30 text-white focus:border-purple-500 focus:outline-none font-mono text-sm"
                placeholder="Solana 지갑 주소를 입력하세요"
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-400 text-sm mb-2">메시지 (선택)</label>
              <textarea
                value={giftMessage}
                onChange={(e) => setGiftMessage(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-space-800/50 border border-purple-500/30 text-white focus:border-purple-500 focus:outline-none resize-none"
                rows={3}
                placeholder="선물과 함께 보낼 메시지를 입력하세요"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setGiftModal(null)}
                className="flex-1 py-3 rounded-lg bg-space-700/50 text-gray-300 hover:text-white transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleGift}
                disabled={gifting || !giftAddress}
                className="flex-1 py-3 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {gifting ? '전송 중...' : '🎁 선물하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
