'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { useAccount } from 'wagmi'
import { useWallet } from '@solana/wallet-adapter-react'
import { BookOpen, PenTool, Users, TrendingUp, Heart, MessageCircle, Eye, ChevronRight } from 'lucide-react'

interface PublicJournal {
  id: string
  user_id?: string
  wallet_address?: string
  author_name: string
  title: string
  content: string
  goal_amount?: number
  current_amount?: number
  status: 'in_progress' | 'completed'
  likes: number
  views: number
  created_at: string
}

export default function JournalPage() {
  const [user, setUser] = useState<User | null>(null)
  const [publicJournals, setPublicJournals] = useState<PublicJournal[]>([])
  const [loading, setLoading] = useState(true)
  const [myJournalCount, setMyJournalCount] = useState(0)

  // Web3 wallet states
  const { address: ethAddress, isConnected: isEthConnected } = useAccount()
  const { publicKey: solPublicKey, connected: isSolConnected } = useWallet()
  const isWalletConnected = isEthConnected || isSolConnected
  const walletAddress = ethAddress || solPublicKey?.toBase58() || null

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      // Fetch public journals
      await fetchPublicJournals()

      // Fetch my journal count
      if (user || walletAddress) {
        await fetchMyJournalCount(user?.id, walletAddress)
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      if (session?.user || walletAddress) {
        await fetchMyJournalCount(session?.user?.id, walletAddress)
      }
    })

    return () => subscription.unsubscribe()
  }, [walletAddress])

  async function fetchPublicJournals() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      setPublicJournals(data || [])
    } catch (error) {
      console.error('Error fetching public journals:', error)
      // 테이블이 없거나 에러 시 빈 배열
      setPublicJournals([])
    } finally {
      setLoading(false)
    }
  }

  async function fetchMyJournalCount(userId?: string, wallet?: string | null) {
    try {
      let query = supabase.from('journal_entries').select('id', { count: 'exact' })

      if (userId) {
        query = query.eq('user_id', userId)
      } else if (wallet) {
        query = query.eq('wallet_address', wallet.toLowerCase())
      } else {
        return
      }

      const { count, error } = await query
      if (!error && count !== null) {
        setMyJournalCount(count)
      }
    } catch (error) {
      console.error('Error fetching journal count:', error)
    }
  }

  const calculateProgress = (current?: number, goal?: number) => {
    if (!current || !goal || goal === 0) return 0
    return Math.min((current / goal) * 100, 100)
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 100000000) return `${(amount / 100000000).toFixed(1)}억`
    if (amount >= 10000) return `${(amount / 10000).toFixed(0)}만`
    return amount.toLocaleString()
  }

  const isLoggedIn = user || isWalletConnected

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white font-comic mb-4">
            📝 도전일지
          </h1>
          <p className="text-gray-400 font-gaegu text-xl">
            나만의 투자 목표를 기록하고, 다른 사람들의 도전기도 확인해보세요!
          </p>
        </div>

        {/* Two Main Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* My Journal Card */}
          <Link href={isLoggedIn ? "/journal/my" : "#"} onClick={(e) => {
            if (!isLoggedIn) {
              e.preventDefault()
              alert('로그인이 필요합니다.')
            }
          }}>
            <div className={`glass rounded-3xl p-8 h-full card-bounce border-2 ${
              isLoggedIn ? 'border-cyan-500/30 hover:border-cyan-500/60' : 'border-gray-600/30'
            } transition-all`}>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center">
                  <PenTool className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white font-comic">내 도전일지</h2>
                  <p className="text-gray-400">나만 볼 수 있는 비공개 기록</p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 text-gray-300">
                  <span className="text-2xl">🔒</span>
                  <span>비공개로 안전하게 기록</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <span className="text-2xl">🎯</span>
                  <span>목표 금액 & 진행률 추적</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <span className="text-2xl">📊</span>
                  <span>나의 성장 기록 관리</span>
                </div>
              </div>

              {isLoggedIn ? (
                <div className="flex items-center justify-between">
                  <span className="text-cyan-400 font-comic">
                    {myJournalCount > 0 ? `${myJournalCount}개의 도전 기록` : '첫 도전을 시작하세요!'}
                  </span>
                  <ChevronRight className="w-6 h-6 text-cyan-400" />
                </div>
              ) : (
                <div className="text-center py-3 bg-gray-700/50 rounded-xl text-gray-400">
                  로그인이 필요합니다
                </div>
              )}
            </div>
          </Link>

          {/* Public Challenges Card */}
          <Link href="/journal/challenges">
            <div className="glass rounded-3xl p-8 h-full card-bounce border-2 border-purple-500/30 hover:border-purple-500/60 transition-all">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white font-comic">도전기 게시판</h2>
                  <p className="text-gray-400">다른 사람들의 도전 스토리</p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 text-gray-300">
                  <span className="text-2xl">🌟</span>
                  <span>성공 스토리 & 노하우 공유</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <span className="text-2xl">💪</span>
                  <span>서로 응원하며 동기부여</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <span className="text-2xl">🏆</span>
                  <span>인기 도전기 랭킹</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-purple-400 font-comic">
                  {publicJournals.length > 0 ? `${publicJournals.length}개의 도전기` : '도전기를 확인하세요!'}
                </span>
                <ChevronRight className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Public Challenges Preview */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white font-comic flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-purple-400" />
              최근 도전기
            </h2>
            <Link href="/journal/challenges" className="text-purple-400 hover:text-purple-300 font-comic flex items-center gap-1">
              전체보기 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="glass rounded-2xl p-6 animate-pulse">
                  <div className="h-4 bg-purple-500/20 rounded w-3/4 mb-4" />
                  <div className="h-3 bg-purple-500/20 rounded w-full mb-2" />
                  <div className="h-3 bg-purple-500/20 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : publicJournals.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center">
              <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 font-gaegu text-xl">아직 공개된 도전기가 없어요</p>
              <p className="text-gray-500 mt-2">첫 번째 도전기를 공유해보세요! 🚀</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {publicJournals.slice(0, 3).map((journal) => {
                const progress = calculateProgress(journal.current_amount, journal.goal_amount)

                return (
                  <Link key={journal.id} href={`/journal/challenges/${journal.id}`}>
                    <div className="glass rounded-2xl p-6 h-full card-bounce hover:border-purple-500/30 border border-transparent transition-all">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {journal.author_name?.[0] || '?'}
                        </div>
                        <span className="text-gray-400 text-sm">{journal.author_name || '익명'}</span>
                        {journal.status === 'completed' && (
                          <span className="ml-auto text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                            달성!
                          </span>
                        )}
                      </div>

                      <h3 className="text-white font-bold mb-2 line-clamp-1">{journal.title}</h3>
                      <p className="text-gray-400 text-sm mb-4 line-clamp-2">{journal.content}</p>

                      {journal.goal_amount && (
                        <div className="mb-4">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>진행률</span>
                            <span>{progress.toFixed(0)}%</span>
                          </div>
                          <div className="h-2 bg-space-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-gray-500 text-sm">
                        <span className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          {journal.likes || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {journal.views || 0}
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Motivational Banner */}
        <div className="glass rounded-3xl p-8 text-center bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20">
          <div className="text-6xl mb-4">🦦💪</div>
          <h3 className="text-2xl font-bold text-white font-comic mb-2">
            "작은 시작이 큰 변화를 만듭니다"
          </h3>
          <p className="text-gray-400 font-gaegu text-lg">
            오늘의 도전이 내일의 성공이 됩니다. 함께 우주로 떠나요! 🚀
          </p>
        </div>
      </div>
    </div>
  )
}
