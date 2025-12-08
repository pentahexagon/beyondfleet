'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { useAccount } from 'wagmi'
import { useWallet } from '@solana/wallet-adapter-react'
import { Plus, Trash2, Edit3, Target, TrendingUp, CheckCircle2, Circle, ArrowLeft, Share2, Lock } from 'lucide-react'

interface JournalEntry {
  id: string
  user_id?: string
  title: string
  content: string
  goal_amount?: number
  current_amount?: number
  status: 'in_progress' | 'completed' | 'paused' | 'draft'
  is_public: boolean
  created_at: string
  updated_at: string
}

export default function MyJournalPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null)
  const [username, setUsername] = useState<string | null>(null)

  // Form states
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [goalAmount, setGoalAmount] = useState('')
  const [currentAmount, setCurrentAmount] = useState('')
  const [isPublic, setIsPublic] = useState(false)

  // Web3 wallet states
  const { address: ethAddress, isConnected: isEthConnected } = useAccount()
  const { publicKey: solPublicKey, connected: isSolConnected } = useWallet()
  const isWalletConnected = isEthConnected || isSolConnected
  const walletAddress = ethAddress || solPublicKey?.toBase58() || null

  // profiles 테이블에서 username 가져오기
  async function fetchUsername(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', userId)
        .single()

      if (!error && data?.username) {
        setUsername(data.username)
      }
    } catch (error) {
      console.error('Error fetching username:', error)
    }
  }

  // 로그인 상태 (Supabase 또는 지갑)
  const isLoggedIn = !!user || isWalletConnected

  useEffect(() => {
    async function init() {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)

      if (currentUser) {
        await fetchUsername(currentUser.id)
        await fetchEntriesByUser(currentUser.id)
      } else if (isWalletConnected && walletAddress) {
        // 지갑 사용자의 경우 닉네임 가져오기
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('wallet_address', walletAddress)
          .single()
        if (profile?.username) {
          setUsername(profile.username)
        } else {
          setUsername(`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`)
        }
        await fetchEntriesByWallet(walletAddress)
      } else {
        // 지갑도 연결 안 되어 있고 user도 없으면 잠시 대기
        // (지갑 상태가 아직 로드 중일 수 있음)
        setLoading(false)
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchUsername(session.user.id)
        await fetchEntriesByUser(session.user.id)
      }
    })

    return () => subscription.unsubscribe()
  }, [isWalletConnected, walletAddress])

  async function fetchEntriesByUser(userId: string) {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setEntries(data || [])
    } catch (error) {
      console.error('Error fetching journal entries:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchEntriesByWallet(address: string) {
    // wallet_address 컬럼이 없으므로 author_name으로 조회
    const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('author_name', shortAddress)
        .order('created_at', { ascending: false })

      if (error) throw error
      setEntries(data || [])
    } catch (error) {
      console.error('Error fetching journal entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAuthorName = () => {
    // 1순위: profiles 테이블의 username
    if (username) {
      return username
    }
    // 2순위: 이메일 앞부분 (지갑 주소 형식이 아닌 경우)
    if (user?.email && !user.email.includes('@wallet.')) {
      return user.email.split('@')[0]
    }
    // 3순위: 익명
    return '익명 도전자'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user && !walletAddress) return
    if (!title.trim()) return

    const entryData: Record<string, unknown> = {
      title: title.trim(),
      content: content.trim(),
      goal_amount: goalAmount ? parseFloat(goalAmount) : null,
      current_amount: currentAmount ? parseFloat(currentAmount) : null,
      status: 'in_progress',
      is_public: isPublic,
      author_name: getAuthorName(),
    }

    if (user) {
      entryData.user_id = user.id
    }

    try {
      if (editingEntry) {
        const { error } = await supabase
          .from('journal_entries')
          .update({
            ...entryData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingEntry.id)

        if (error) {
          console.error('Update error:', error)
          throw error
        }

        setEntries(prev =>
          prev.map(entry =>
            entry.id === editingEntry.id
              ? { ...entry, ...entryData, updated_at: new Date().toISOString() } as JournalEntry
              : entry
          )
        )
      } else {
        const { data, error } = await supabase
          .from('journal_entries')
          .insert([entryData])
          .select()
          .single()

        if (error) {
          console.error('Insert error:', error)
          // Check if table doesn't exist
          if (error.code === '42P01' || error.message?.includes('does not exist')) {
            alert('데이터베이스 테이블이 없습니다. 관리자에게 문의하세요.')
            return
          }
          throw error
        }
        if (data) {
          setEntries(prev => [data, ...prev])
        }
      }

      resetForm()
    } catch (error: unknown) {
      console.error('Error saving journal entry:', error)
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
      const supabaseError = error as { code?: string; message?: string; details?: string }

      if (supabaseError.code === '42P01') {
        alert('journal_entries 테이블이 존재하지 않습니다. Supabase에서 테이블을 생성해주세요.')
      } else if (supabaseError.code === '42501') {
        alert('권한이 없습니다. RLS 정책을 확인해주세요.')
      } else if (supabaseError.code === '23503') {
        alert('외래 키 오류: 유효하지 않은 사용자 ID입니다.')
      } else {
        alert(`저장 중 오류가 발생했습니다: ${supabaseError.message || errorMessage}`)
      }
    }
  }

  const handleEdit = (entry: JournalEntry) => {
    setEditingEntry(entry)
    setTitle(entry.title)
    setContent(entry.content)
    setGoalAmount(entry.goal_amount?.toString() || '')
    setCurrentAmount(entry.current_amount?.toString() || '')
    setIsPublic(entry.is_public || false)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', id)

      if (error) throw error
      setEntries(prev => prev.filter(entry => entry.id !== id))
    } catch (error) {
      console.error('Error deleting journal entry:', error)
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  const toggleStatus = async (entry: JournalEntry) => {
    const newStatus = entry.status === 'completed' ? 'in_progress' : 'completed'

    try {
      const { error } = await supabase
        .from('journal_entries')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', entry.id)

      if (error) throw error

      setEntries(prev =>
        prev.map(e =>
          e.id === entry.id ? { ...e, status: newStatus } : e
        )
      )
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const togglePublic = async (entry: JournalEntry) => {
    const newIsPublic = !entry.is_public

    try {
      const { error } = await supabase
        .from('journal_entries')
        .update({ is_public: newIsPublic, updated_at: new Date().toISOString() })
        .eq('id', entry.id)

      if (error) throw error

      setEntries(prev =>
        prev.map(e =>
          e.id === entry.id ? { ...e, is_public: newIsPublic } : e
        )
      )
    } catch (error) {
      console.error('Error updating public status:', error)
    }
  }

  const resetForm = () => {
    setTitle('')
    setContent('')
    setGoalAmount('')
    setCurrentAmount('')
    setIsPublic(false)
    setEditingEntry(null)
    setShowForm(false)
  }

  const calculateProgress = (current?: number, goal?: number) => {
    if (!current || !goal || goal === 0) return 0
    return Math.min((current / goal) * 100, 100)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="h-10 bg-purple-500/20 rounded w-48 mb-2 animate-pulse" />
            <div className="h-4 bg-purple-500/20 rounded w-32 animate-pulse" />
          </div>
          <div className="glass rounded-xl p-8">
            <div className="animate-pulse space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-purple-500/20 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 로그인 안 되어 있으면 안내 메시지 표시
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/journal" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>도전일지로 돌아가기</span>
          </Link>

          <div className="glass rounded-2xl p-12 text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-white mb-2 font-comic">
              로그인이 필요합니다
            </h2>
            <p className="text-gray-400 mb-6">
              도전일지를 작성하려면 로그인해주세요.
            </p>
            <button
              onClick={() => router.push('/journal')}
              className="doge-button font-comic text-white"
            >
              도전일지 메인으로
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/journal" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>도전일지로 돌아가기</span>
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl">🔒</span>
                <h1 className="text-3xl md:text-4xl font-bold text-white font-comic">
                  내 도전일지
                </h1>
              </div>
              <p className="text-gray-400 font-gaegu text-lg">
                {entries.length}개의 도전 기록 | 완료: {entries.filter(e => e.status === 'completed').length}개
              </p>
            </div>
            <button
              onClick={() => {
                resetForm()
                setShowForm(true)
              }}
              className="doge-button font-comic text-white flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              새 도전
            </button>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="glass rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-white mb-6 font-comic">
                {editingEntry ? '도전 수정' : '새 도전 추가'} 🎯
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    도전 제목 *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="예: 비트코인 1개 모으기"
                    className="w-full px-4 py-3 bg-space-800 border border-purple-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    내용 / 메모
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="도전에 대한 상세 내용이나 메모..."
                    rows={4}
                    className="w-full px-4 py-3 bg-space-800 border border-purple-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      목표 금액 (원)
                    </label>
                    <input
                      type="number"
                      value={goalAmount}
                      onChange={(e) => setGoalAmount(e.target.value)}
                      placeholder="10000000"
                      className="w-full px-4 py-3 bg-space-800 border border-purple-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      현재 금액 (원)
                    </label>
                    <input
                      type="number"
                      value={currentAmount}
                      onChange={(e) => setCurrentAmount(e.target.value)}
                      placeholder="5000000"
                      className="w-full px-4 py-3 bg-space-800 border border-purple-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* Public Toggle */}
                <div className="flex items-center justify-between p-4 bg-space-800 rounded-xl border border-purple-500/30">
                  <div className="flex items-center gap-3">
                    {isPublic ? (
                      <Share2 className="w-5 h-5 text-purple-400" />
                    ) : (
                      <Lock className="w-5 h-5 text-gray-500" />
                    )}
                    <div>
                      <p className="text-white font-medium">도전기 게시판에 공개</p>
                      <p className="text-gray-500 text-sm">다른 사람들이 내 도전을 볼 수 있습니다</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPublic(!isPublic)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      isPublic ? 'bg-purple-500' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      isPublic ? 'translate-x-7' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 py-3 bg-gray-700 text-white rounded-xl font-medium hover:bg-gray-600 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
                  >
                    {editingEntry ? '수정하기' : '추가하기'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Entries List */}
        {entries.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center">
            <Target className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-4 font-gaegu text-xl">아직 도전 기록이 없어요!</p>
            <p className="text-gray-500 mb-6">첫 번째 도전을 시작해보세요 🚀</p>
            <button
              onClick={() => setShowForm(true)}
              className="doge-button font-comic text-white"
            >
              첫 도전 시작하기
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => {
              const progress = calculateProgress(entry.current_amount, entry.goal_amount)
              const isCompleted = entry.status === 'completed'

              return (
                <div
                  key={entry.id}
                  className={`glass rounded-2xl p-6 card-bounce border ${
                    isCompleted
                      ? 'border-green-500/30 bg-green-500/5'
                      : 'border-purple-500/20'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleStatus(entry)}
                        className="mt-1 transition-transform hover:scale-110"
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-6 h-6 text-green-400" />
                        ) : (
                          <Circle className="w-6 h-6 text-gray-500 hover:text-cyan-400" />
                        )}
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className={`text-xl font-bold font-comic ${
                            isCompleted ? 'text-green-400 line-through' : 'text-white'
                          }`}>
                            {entry.title}
                          </h3>
                          {entry.is_public ? (
                            <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Share2 className="w-3 h-3" />
                              공개
                            </span>
                          ) : (
                            <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              비공개
                            </span>
                          )}
                        </div>
                        {entry.content && (
                          <p className="text-gray-400 mt-1 whitespace-pre-wrap">
                            {entry.content}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => togglePublic(entry)}
                        className={`p-2 transition-colors ${
                          entry.is_public ? 'text-purple-400 hover:text-purple-300' : 'text-gray-500 hover:text-gray-400'
                        }`}
                        title={entry.is_public ? '비공개로 전환' : '공개로 전환'}
                      >
                        {entry.is_public ? <Share2 className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleEdit(entry)}
                        className="p-2 text-gray-500 hover:text-cyan-400 transition-colors"
                        title="수정"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {entry.goal_amount && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-400 flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          진행률
                        </span>
                        <span className="text-cyan-400 font-mono">
                          {progress.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-3 bg-space-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isCompleted
                              ? 'bg-gradient-to-r from-green-500 to-emerald-400'
                              : 'bg-gradient-to-r from-cyan-500 to-purple-500'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-sm mt-2">
                        <span className="text-gray-500">
                          현재: {formatCurrency(entry.current_amount || 0)}
                        </span>
                        <span className="text-gray-500">
                          목표: {formatCurrency(entry.goal_amount)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Meta Info */}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>
                      생성: {new Date(entry.created_at).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Stats Summary */}
        {entries.length > 0 && (
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">🎯</div>
              <div className="text-2xl font-bold text-white font-comic">{entries.length}</div>
              <div className="text-sm text-gray-400">총 도전</div>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">✅</div>
              <div className="text-2xl font-bold text-green-400 font-comic">
                {entries.filter(e => e.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-400">완료</div>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">🔓</div>
              <div className="text-2xl font-bold text-purple-400 font-comic">
                {entries.filter(e => e.is_public).length}
              </div>
              <div className="text-sm text-gray-400">공개</div>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">💰</div>
              <div className="text-lg font-bold text-cyan-400 font-comic">
                {formatCurrency(entries.reduce((sum, e) => sum + (e.current_amount || 0), 0))}
              </div>
              <div className="text-sm text-gray-400">총 달성액</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
