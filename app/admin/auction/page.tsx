'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Auction, NFT, Bid, TIER_INFO } from '@/types/nft'
import { Plus, Play, Square, Eye, X } from 'lucide-react'

interface AuctionWithNFT extends Auction {
  nft: NFT
}

export default function AuctionManagementPage() {
  const [auctions, setAuctions] = useState<AuctionWithNFT[]>([])
  const [availableNfts, setAvailableNfts] = useState<NFT[]>([])
  const [bids, setBids] = useState<Bid[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showBidsModal, setShowBidsModal] = useState(false)
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null)

  const [formData, setFormData] = useState({
    nft_id: '',
    start_price: 0.1,
    start_time: '',
    end_time: '',
  })

  useEffect(() => {
    fetchAuctions()
    fetchAvailableNfts()
  }, [])

  async function fetchAuctions() {
    try {
      const { data, error } = await supabase
        .from('auctions')
        .select('*, nft:nfts(*)')
        .order('created_at', { ascending: false })

      if (error) throw error
      setAuctions(data || [])
    } catch (error) {
      console.error('Error fetching auctions:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchAvailableNfts() {
    try {
      const { data, error } = await supabase
        .from('nfts')
        .select('*')
        .is('owner_id', null)

      if (error) throw error
      setAvailableNfts(data || [])
    } catch (error) {
      console.error('Error fetching NFTs:', error)
    }
  }

  async function fetchBids(auctionId: string) {
    try {
      const { data, error } = await supabase
        .from('bids')
        .select('*')
        .eq('auction_id', auctionId)
        .order('amount', { ascending: false })

      if (error) throw error
      setBids(data || [])
    } catch (error) {
      console.error('Error fetching bids:', error)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('auctions')
        .insert({
          nft_id: formData.nft_id,
          seller_id: user.id,
          start_price: formData.start_price,
          start_time: new Date(formData.start_time).toISOString(),
          end_time: new Date(formData.end_time).toISOString(),
          status: 'active',
        })

      if (error) throw error

      setShowModal(false)
      fetchAuctions()
    } catch (error) {
      console.error('Error creating auction:', error)
      alert('옥션 생성 중 오류가 발생했습니다.')
    }
  }

  async function handleStatusChange(auction: Auction, newStatus: 'active' | 'ended' | 'cancelled') {
    try {
      const { error } = await supabase
        .from('auctions')
        .update({ status: newStatus })
        .eq('id', auction.id)

      if (error) throw error
      fetchAuctions()
    } catch (error) {
      console.error('Error updating auction status:', error)
      alert('상태 변경 중 오류가 발생했습니다.')
    }
  }

  function openBidsModal(auction: Auction) {
    setSelectedAuction(auction)
    fetchBids(auction.id)
    setShowBidsModal(true)
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 rounded text-sm bg-green-500/20 text-green-400">진행중</span>
      case 'ended':
        return <span className="px-2 py-1 rounded text-sm bg-purple-500/20 text-purple-400">종료</span>
      case 'cancelled':
        return <span className="px-2 py-1 rounded text-sm bg-red-500/20 text-red-400">취소됨</span>
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">옥션 관리</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          새 옥션 등록
        </button>
      </div>

      {/* Auctions Table */}
      <div className="bg-space-800 rounded-xl border border-purple-500/20 overflow-hidden">
        <table className="w-full">
          <thead className="bg-space-900">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">NFT</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">시작가</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">현재 입찰</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">시작</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">종료</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">상태</th>
              <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-purple-500/10">
            {auctions.map((auction) => (
              <tr key={auction.id} className="hover:bg-purple-500/5">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={auction.nft?.image_url}
                      alt={auction.nft?.name}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                    <div>
                      <p className="text-white">{auction.nft?.name}</p>
                      <span className={`text-xs bg-gradient-to-r ${TIER_INFO[auction.nft?.tier || 'cadet'].color} text-transparent bg-clip-text`}>
                        {TIER_INFO[auction.nft?.tier || 'cadet'].nameKr}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-300">{auction.start_price} SOL</td>
                <td className="px-6 py-4 text-cyan-400">
                  {auction.current_bid ? `${auction.current_bid} SOL` : '-'}
                </td>
                <td className="px-6 py-4 text-gray-400 text-sm">{formatDate(auction.start_time)}</td>
                <td className="px-6 py-4 text-gray-400 text-sm">{formatDate(auction.end_time)}</td>
                <td className="px-6 py-4">{getStatusBadge(auction.status)}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openBidsModal(auction)}
                      className="p-2 text-gray-400 hover:text-cyan-400 transition-colors"
                      title="입찰 내역"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    {auction.status === 'active' ? (
                      <button
                        onClick={() => handleStatusChange(auction, 'ended')}
                        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                        title="종료"
                      >
                        <Square className="w-5 h-5" />
                      </button>
                    ) : auction.status === 'ended' ? (
                      <button
                        onClick={() => handleStatusChange(auction, 'active')}
                        className="p-2 text-gray-400 hover:text-green-400 transition-colors"
                        title="재시작"
                      >
                        <Play className="w-5 h-5" />
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {auctions.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            등록된 옥션이 없습니다.
          </div>
        )}
      </div>

      {/* Create Auction Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-space-800 rounded-xl border border-purple-500/20 w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-purple-500/20">
              <h2 className="text-xl font-semibold text-white">새 옥션 등록</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">NFT 선택</label>
                <select
                  required
                  value={formData.nft_id}
                  onChange={(e) => setFormData({ ...formData, nft_id: e.target.value })}
                  className="w-full px-4 py-2 bg-space-900 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="">NFT를 선택하세요</option>
                  {availableNfts.map((nft) => (
                    <option key={nft.id} value={nft.id}>
                      {TIER_INFO[nft.tier].icon} {nft.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">시작 가격 (SOL)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.start_price}
                  onChange={(e) => setFormData({ ...formData, start_price: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 bg-space-900 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">시작 시간</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="w-full px-4 py-2 bg-space-900 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">종료 시간</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="w-full px-4 py-2 bg-space-900 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  등록
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bids Modal */}
      {showBidsModal && selectedAuction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-space-800 rounded-xl border border-purple-500/20 w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-purple-500/20">
              <h2 className="text-xl font-semibold text-white">입찰 내역</h2>
              <button onClick={() => setShowBidsModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 max-h-96 overflow-y-auto">
              {bids.length > 0 ? (
                <div className="space-y-3">
                  {bids.map((bid, index) => (
                    <div
                      key={bid.id}
                      className={`flex items-center justify-between p-4 rounded-lg ${
                        index === 0 ? 'bg-purple-500/20 border border-purple-500/30' : 'bg-space-900'
                      }`}
                    >
                      <div>
                        <p className="text-gray-400 text-sm">
                          {bid.user_id.slice(0, 8)}...
                          {index === 0 && <span className="ml-2 text-purple-400">(최고 입찰)</span>}
                        </p>
                        <p className="text-gray-500 text-xs mt-1">{formatDate(bid.created_at)}</p>
                      </div>
                      <span className="text-cyan-400 font-semibold">{bid.amount} SOL</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">입찰 내역이 없습니다.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
