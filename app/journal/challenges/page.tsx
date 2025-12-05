'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft, Heart, Eye, TrendingUp, Clock, Award, Search, Filter } from 'lucide-react'

interface PublicJournal {
  id: string
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

type SortOption = 'latest' | 'popular' | 'completed'

export default function ChallengesPage() {
  const [journals, setJournals] = useState<PublicJournal[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<SortOption>('latest')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchJournals()
  }, [sortBy])

  async function fetchJournals() {
    setLoading(true)
    try {
      let query = supabase
        .from('journal_entries')
        .select('*')
        .eq('is_public', true)

      if (sortBy === 'latest') {
        query = query.order('created_at', { ascending: false })
      } else if (sortBy === 'popular') {
        query = query.order('likes', { ascending: false })
      } else if (sortBy === 'completed') {
        query = query.eq('status', 'completed').order('created_at', { ascending: false })
      }

      const { data, error } = await query.limit(50)

      if (error) throw error
      setJournals(data || [])
    } catch (error) {
      console.error('Error fetching journals:', error)
      setJournals([])
    } finally {
      setLoading(false)
    }
  }

  const calculateProgress = (current?: number, goal?: number) => {
    if (!current || !goal || goal === 0) return 0
    return Math.min((current / goal) * 100, 100)
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 100000000) return `${(amount / 100000000).toFixed(1)}억원`
    if (amount >= 10000) return `${(amount / 10000).toFixed(0)}만원`
    return `${amount.toLocaleString()}원`
  }

  const filteredJournals = journals.filter(journal =>
    journal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    journal.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    journal.author_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const completedCount = journals.filter(j => j.status === 'completed').length
  const totalGoal = journals.reduce((sum, j) => sum + (j.goal_amount || 0), 0)

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/journal" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>도전일지로 돌아가기</span>
          </Link>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white font-comic flex items-center gap-3">
                🏆 도전기 게시판
              </h1>
              <p className="text-gray-400 font-gaegu text-lg mt-2">
                다른 사람들의 도전 스토리를 확인하고 응원해주세요!
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="glass rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white font-comic">{journals.length}</div>
            <div className="text-sm text-gray-400">전체 도전기</div>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-400 font-comic">{completedCount}</div>
            <div className="text-sm text-gray-400">달성 완료</div>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <div className="text-xl font-bold text-purple-400 font-comic">{formatCurrency(totalGoal)}</div>
            <div className="text-sm text-gray-400">총 목표액</div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="도전기 검색..."
              className="w-full pl-12 pr-4 py-3 bg-space-800 border border-purple-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Sort */}
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy('latest')}
              className={`px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 ${
                sortBy === 'latest'
                  ? 'bg-purple-500 text-white'
                  : 'bg-space-800 text-gray-400 hover:text-white'
              }`}
            >
              <Clock className="w-4 h-4" />
              최신
            </button>
            <button
              onClick={() => setSortBy('popular')}
              className={`px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 ${
                sortBy === 'popular'
                  ? 'bg-purple-500 text-white'
                  : 'bg-space-800 text-gray-400 hover:text-white'
              }`}
            >
              <Heart className="w-4 h-4" />
              인기
            </button>
            <button
              onClick={() => setSortBy('completed')}
              className={`px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 ${
                sortBy === 'completed'
                  ? 'bg-green-500 text-white'
                  : 'bg-space-800 text-gray-400 hover:text-white'
              }`}
            >
              <Award className="w-4 h-4" />
              달성
            </button>
          </div>
        </div>

        {/* Journals List */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass rounded-2xl p-6 animate-pulse">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-full" />
                  <div className="w-24 h-4 bg-purple-500/20 rounded" />
                </div>
                <div className="h-5 bg-purple-500/20 rounded w-3/4 mb-3" />
                <div className="h-4 bg-purple-500/20 rounded w-full mb-2" />
                <div className="h-4 bg-purple-500/20 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : filteredJournals.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-400 font-gaegu text-xl">
              {searchTerm ? '검색 결과가 없어요' : '아직 공개된 도전기가 없어요'}
            </p>
            <p className="text-gray-500 mt-2">
              {searchTerm ? '다른 검색어로 시도해보세요' : '첫 번째 도전기를 공유해보세요! 🚀'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJournals.map((journal) => {
              const progress = calculateProgress(journal.current_amount, journal.goal_amount)
              const isCompleted = journal.status === 'completed'

              return (
                <Link key={journal.id} href={`/journal/challenges/${journal.id}`}>
                  <div className={`glass rounded-2xl p-6 h-full card-bounce border transition-all ${
                    isCompleted
                      ? 'border-green-500/30 hover:border-green-500/50'
                      : 'border-purple-500/20 hover:border-purple-500/40'
                  }`}>
                    {/* Author */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                        isCompleted
                          ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                          : 'bg-gradient-to-br from-purple-500 to-pink-500'
                      }`}>
                        {journal.author_name?.[0] || '?'}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{journal.author_name || '익명'}</p>
                        <p className="text-gray-500 text-xs">
                          {new Date(journal.created_at).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                      {isCompleted && (
                        <span className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-full font-medium">
                          🎉 달성!
                        </span>
                      )}
                    </div>

                    {/* Title & Content */}
                    <h3 className="text-xl font-bold text-white mb-2 line-clamp-1 font-comic">
                      {journal.title}
                    </h3>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                      {journal.content || '내용이 없습니다.'}
                    </p>

                    {/* Progress */}
                    {journal.goal_amount && (
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-500">진행률</span>
                          <span className={isCompleted ? 'text-green-400' : 'text-cyan-400'}>
                            {progress.toFixed(0)}%
                          </span>
                        </div>
                        <div className="h-2 bg-space-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isCompleted
                                ? 'bg-gradient-to-r from-green-500 to-emerald-400'
                                : 'bg-gradient-to-r from-purple-500 to-pink-500'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>{formatCurrency(journal.current_amount || 0)}</span>
                          <span>{formatCurrency(journal.goal_amount)}</span>
                        </div>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 pt-4 border-t border-purple-500/10">
                      <span className="flex items-center gap-1 text-gray-500 text-sm">
                        <Heart className="w-4 h-4" />
                        {journal.likes || 0}
                      </span>
                      <span className="flex items-center gap-1 text-gray-500 text-sm">
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

        {/* CTA Banner */}
        <div className="mt-12 glass rounded-3xl p-8 text-center bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20">
          <div className="text-5xl mb-4">✍️</div>
          <h3 className="text-2xl font-bold text-white font-comic mb-2">
            나도 도전기를 공유하고 싶다면?
          </h3>
          <p className="text-gray-400 font-gaegu text-lg mb-6">
            내 도전일지에서 공개 설정을 켜면 여기에 자동으로 게시됩니다!
          </p>
          <Link href="/journal/my">
            <button className="doge-button font-comic text-white">
              내 도전일지 가기 →
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
