'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { MembershipTier, MEMBERSHIP_TIERS, UserRole } from '@/types'
import { Search, Edit2, X, Shield, ShieldOff } from 'lucide-react'

interface Profile {
  id: string
  email: string
  username: string | null
  avatar_url: string | null
  membership_tier: MembershipTier
  vote_power: number
  role: UserRole
  eth_wallet: string | null
  sol_wallet: string | null
  created_at: string
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTier, setFilterTier] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<Profile | null>(null)

  const [formData, setFormData] = useState({
    membership_tier: 'cadet' as MembershipTier,
    role: 'user' as UserRole,
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  function openModal(user: Profile) {
    setEditingUser(user)
    setFormData({
      membership_tier: user.membership_tier || 'cadet',
      role: user.role || 'user',
    })
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingUser) return

    try {
      const votePower = MEMBERSHIP_TIERS[formData.membership_tier].votePower

      const { error } = await supabase
        .from('profiles')
        .update({
          membership_tier: formData.membership_tier,
          vote_power: votePower,
          role: formData.role,
        })
        .eq('id', editingUser.id)

      if (error) throw error

      setShowModal(false)
      fetchUsers()
    } catch (error) {
      console.error('Error updating user:', error)
      alert('회원 정보 수정 중 오류가 발생했습니다.')
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      (user.email?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (user.username?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (user.eth_wallet?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (user.sol_wallet?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
    const matchesTier = filterTier === 'all' || user.membership_tier === filterTier
    return matchesSearch && matchesTier
  })

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  function shortenAddress(address: string | null) {
    if (!address) return null
    return `${address.slice(0, 6)}...${address.slice(-4)}`
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
        <h1 className="text-2xl font-bold text-white">회원 관리</h1>
        <div className="text-gray-400">총 {users.length}명</div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="이메일, 유저네임, 지갑 주소 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-space-800 border border-purple-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
          />
        </div>
        <select
          value={filterTier}
          onChange={(e) => setFilterTier(e.target.value)}
          className="px-4 py-2 bg-space-800 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
        >
          <option value="all">전체 등급</option>
          {Object.entries(MEMBERSHIP_TIERS).map(([key, info]) => (
            <option key={key} value={key}>
              {info.icon} {info.nameKr}
            </option>
          ))}
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-space-800 rounded-xl border border-purple-500/20 overflow-hidden">
        <table className="w-full">
          <thead className="bg-space-900">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">회원</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">멤버십</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">투표권</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">지갑</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">가입일</th>
              <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-purple-500/10">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-purple-500/5">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-medium">
                      {user.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-white">{user.username || user.email}</p>
                        {user.role === 'admin' && (
                          <span className="px-1.5 py-0.5 rounded text-xs bg-amber-500/20 text-amber-400 flex items-center gap-1">
                            <Shield className="w-3 h-3" /> 관리자
                          </span>
                        )}
                      </div>
                      {user.username && <p className="text-gray-500 text-sm">{user.email}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm bg-gradient-to-r ${MEMBERSHIP_TIERS[user.membership_tier || 'cadet'].color} text-white`}>
                    {MEMBERSHIP_TIERS[user.membership_tier || 'cadet'].icon} {MEMBERSHIP_TIERS[user.membership_tier || 'cadet'].nameKr}
                  </span>
                </td>
                <td className="px-6 py-4 text-cyan-400 font-medium">
                  {user.vote_power || 1}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm space-y-1">
                    {user.eth_wallet && (
                      <div className="text-gray-400">
                        <span className="text-gray-500">ETH:</span> {shortenAddress(user.eth_wallet)}
                      </div>
                    )}
                    {user.sol_wallet && (
                      <div className="text-gray-400">
                        <span className="text-gray-500">SOL:</span> {shortenAddress(user.sol_wallet)}
                      </div>
                    )}
                    {!user.eth_wallet && !user.sol_wallet && (
                      <span className="text-gray-600">-</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-400 text-sm">{formatDate(user.created_at)}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openModal(user)}
                      className="p-2 text-gray-400 hover:text-purple-400 transition-colors"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            {searchQuery ? '검색 결과가 없습니다.' : '등록된 회원이 없습니다.'}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-space-800 rounded-xl border border-purple-500/20 w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-purple-500/20">
              <h2 className="text-xl font-semibold text-white">회원 정보 수정</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="flex items-center gap-3 p-4 bg-space-900 rounded-lg">
                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-medium text-lg">
                  {editingUser.username?.[0]?.toUpperCase() || editingUser.email?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="text-white font-medium">{editingUser.username || editingUser.email}</p>
                  {editingUser.username && <p className="text-gray-500 text-sm">{editingUser.email}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">멤버십 등급</label>
                <select
                  value={formData.membership_tier}
                  onChange={(e) => setFormData({ ...formData, membership_tier: e.target.value as MembershipTier })}
                  className="w-full px-4 py-2 bg-space-900 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  {Object.entries(MEMBERSHIP_TIERS).map(([key, info]) => (
                    <option key={key} value={key}>
                      {info.icon} {info.nameKr} (투표권: {info.votePower})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">역할</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'user' })}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
                      formData.role === 'user'
                        ? 'border-purple-500 bg-purple-500/20 text-white'
                        : 'border-purple-500/20 text-gray-400 hover:border-purple-500/40'
                    }`}
                  >
                    <ShieldOff className="w-5 h-5" />
                    일반 회원
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'admin' })}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
                      formData.role === 'admin'
                        ? 'border-amber-500 bg-amber-500/20 text-amber-400'
                        : 'border-purple-500/20 text-gray-400 hover:border-purple-500/40'
                    }`}
                  >
                    <Shield className="w-5 h-5" />
                    관리자
                  </button>
                </div>
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
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
