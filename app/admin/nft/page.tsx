'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { NFT, NFTTier, TIER_INFO } from '@/types/nft'
import { Plus, Edit2, Trash2, X, Search } from 'lucide-react'

export default function NFTManagementPage() {
  const [nfts, setNfts] = useState<NFT[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingNft, setEditingNft] = useState<NFT | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTier, setFilterTier] = useState<NFTTier | 'all'>('all')

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    tier: 'cadet' as NFTTier,
    price: 0,
    is_listed: false,
  })

  useEffect(() => {
    fetchNfts()
  }, [])

  async function fetchNfts() {
    try {
      const { data, error } = await supabase
        .from('nfts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setNfts(data || [])
    } catch (error) {
      console.error('Error fetching NFTs:', error)
    } finally {
      setLoading(false)
    }
  }

  function openModal(nft?: NFT) {
    if (nft) {
      setEditingNft(nft)
      setFormData({
        name: nft.name,
        description: nft.description || '',
        image_url: nft.image_url,
        tier: nft.tier,
        price: nft.price || 0,
        is_listed: nft.is_listed,
      })
    } else {
      setEditingNft(null)
      setFormData({
        name: '',
        description: '',
        image_url: '',
        tier: 'cadet',
        price: 0,
        is_listed: false,
      })
    }
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      if (editingNft) {
        const { error } = await supabase
          .from('nfts')
          .update({
            name: formData.name,
            description: formData.description,
            image_url: formData.image_url,
            tier: formData.tier,
            price: formData.price,
            is_listed: formData.is_listed,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingNft.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('nfts')
          .insert({
            name: formData.name,
            description: formData.description,
            image_url: formData.image_url,
            tier: formData.tier,
            price: formData.price,
            is_listed: formData.is_listed,
          })

        if (error) throw error
      }

      setShowModal(false)
      fetchNfts()
    } catch (error) {
      console.error('Error saving NFT:', error)
      alert('NFT 저장 중 오류가 발생했습니다.')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase
        .from('nfts')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchNfts()
    } catch (error) {
      console.error('Error deleting NFT:', error)
      alert('NFT 삭제 중 오류가 발생했습니다.')
    }
  }

  const filteredNfts = nfts.filter((nft) => {
    const matchesSearch = nft.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTier = filterTier === 'all' || nft.tier === filterTier
    return matchesSearch && matchesTier
  })

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
        <h1 className="text-2xl font-bold text-white">NFT 관리</h1>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          새 NFT 등록
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="NFT 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-space-800 border border-purple-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
          />
        </div>
        <select
          value={filterTier}
          onChange={(e) => setFilterTier(e.target.value as NFTTier | 'all')}
          className="px-4 py-2 bg-space-800 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
        >
          <option value="all">전체 등급</option>
          {Object.entries(TIER_INFO).map(([key, info]) => (
            <option key={key} value={key}>
              {info.icon} {info.nameKr}
            </option>
          ))}
        </select>
      </div>

      {/* NFT Table */}
      <div className="bg-space-800 rounded-xl border border-purple-500/20 overflow-hidden">
        <table className="w-full">
          <thead className="bg-space-900">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">이미지</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">이름</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">등급</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">가격</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">상태</th>
              <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-purple-500/10">
            {filteredNfts.map((nft) => (
              <tr key={nft.id} className="hover:bg-purple-500/5">
                <td className="px-6 py-4">
                  <img
                    src={nft.image_url}
                    alt={nft.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                </td>
                <td className="px-6 py-4 text-white">{nft.name}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm bg-gradient-to-r ${TIER_INFO[nft.tier].color} text-white`}>
                    {TIER_INFO[nft.tier].icon} {TIER_INFO[nft.tier].nameKr}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-300">
                  {nft.price ? `${nft.price} SOL` : '-'}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-sm ${nft.is_listed ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                    {nft.is_listed ? '판매중' : '비공개'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openModal(nft)}
                      className="p-2 text-gray-400 hover:text-purple-400 transition-colors"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(nft.id)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredNfts.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            등록된 NFT가 없습니다.
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-space-800 rounded-xl border border-purple-500/20 w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-purple-500/20">
              <h2 className="text-xl font-semibold text-white">
                {editingNft ? 'NFT 수정' : '새 NFT 등록'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">이름</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-space-900 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">설명</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-space-900 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">이미지 URL</label>
                <input
                  type="url"
                  required
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full px-4 py-2 bg-space-900 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">등급</label>
                  <select
                    value={formData.tier}
                    onChange={(e) => setFormData({ ...formData, tier: e.target.value as NFTTier })}
                    className="w-full px-4 py-2 bg-space-900 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  >
                    {Object.entries(TIER_INFO).map(([key, info]) => (
                      <option key={key} value={key}>
                        {info.icon} {info.nameKr}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">가격 (SOL)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 bg-space-900 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_listed"
                  checked={formData.is_listed}
                  onChange={(e) => setFormData({ ...formData, is_listed: e.target.checked })}
                  className="w-4 h-4 rounded border-purple-500/20 bg-space-900 text-purple-500 focus:ring-purple-500"
                />
                <label htmlFor="is_listed" className="text-gray-300">판매 목록에 공개</label>
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
                  {editingNft ? '수정' : '등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
