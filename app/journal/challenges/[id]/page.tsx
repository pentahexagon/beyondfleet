'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { ArrowLeft, Heart, Eye, TrendingUp, Calendar, Target, Award, Trash2 } from 'lucide-react'

interface JournalEntry {
  id: string
  user_id?: string
  author_name: string
  title: string
  content: string
  goal_amount?: number
  current_amount?: number
  status: 'in_progress' | 'completed'
  likes: number
  views: number
  created_at: string
  updated_at: string
}

// 관리자 이메일 목록
const ADMIN_EMAILS = ['coinkim00@gmail.com']

export default function ChallengeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [entry, setEntry] = useState<JournalEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    // 사용자 정보 가져오기
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user?.email && ADMIN_EMAILS.includes(user.email)) {
        setIsAdmin(true)
      }
    })

    if (params.id) {
      fetchEntry(params.id as string)
    }
  }, [params.id])

  async function fetchEntry(id: string) {
    setLoading(true)
    setError(null)
    try {
      const { data, error: queryError } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('id', id)
        .eq('is_public', true)
        .single()

      if (queryError) {
        if (queryError.code === 'PGRST116') {
          setError('도전기를 찾을 수 없습니다.')
        } else {
          setError('도전기를 불러오는 중 오류가 발생했습니다.')
        }
        return
      }

      setEntry(data)

      // 본인 글인지 확인
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (currentUser && data.user_id === currentUser.id) {
        setIsOwner(true)
      }

      // 조회수 증가
      await supabase
        .from('journal_entries')
        .update({ views: (data.views || 0) + 1 })
        .eq('id', id)

    } catch (err) {
      console.error('Error fetching entry:', err)
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
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

  // 삭제 가능 여부 (본인 또는 관리자)
  const canDelete = isOwner || isAdmin

  // 삭제 처리
  const handleDelete = async () => {
    if (!entry) return

    const confirmMessage = isAdmin && !isOwner
      ? '관리자 권한으로 이 도전기를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.'
      : '정말로 이 도전기를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.'

    if (!confirm(confirmMessage)) return

    setDeleting(true)
    try {
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', entry.id)

      if (error) throw error

      alert('도전기가 삭제되었습니다.')
      router.push('/journal/challenges')
    } catch (err) {
      console.error('Delete error:', err)
      alert('삭제 중 오류가 발생했습니다.')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="glass rounded-2xl p-8 animate-pulse">
            <div className="h-8 bg-purple-500/20 rounded w-3/4 mb-4" />
            <div className="h-4 bg-purple-500/20 rounded w-1/4 mb-8" />
            <div className="space-y-3">
              <div className="h-4 bg-purple-500/20 rounded w-full" />
              <div className="h-4 bg-purple-500/20 rounded w-full" />
              <div className="h-4 bg-purple-500/20 rounded w-2/3" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !entry) {
    return (
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <Link href="/journal/challenges" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>도전기 게시판으로 돌아가기</span>
          </Link>

          <div className="glass rounded-2xl p-12 text-center">
            <div className="text-6xl mb-4">😢</div>
            <h2 className="text-2xl font-bold text-white mb-2 font-comic">
              {error || '도전기를 찾을 수 없습니다'}
            </h2>
            <p className="text-gray-400 mb-6">
              삭제되었거나 비공개로 전환된 도전기일 수 있습니다.
            </p>
            <button
              onClick={() => router.push('/journal/challenges')}
              className="doge-button font-comic text-white"
            >
              다른 도전기 보기
            </button>
          </div>
        </div>
      </div>
    )
  }

  const progress = calculateProgress(entry.current_amount, entry.goal_amount)
  const isCompleted = entry.status === 'completed'

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Back Link */}
        <Link href="/journal/challenges" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>도전기 게시판으로 돌아가기</span>
        </Link>

        {/* Main Card */}
        <div className={`glass rounded-3xl overflow-hidden border ${
          isCompleted ? 'border-green-500/30' : 'border-purple-500/20'
        }`}>
          {/* Header */}
          <div className={`p-6 ${
            isCompleted
              ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10'
              : 'bg-gradient-to-r from-purple-500/10 to-pink-500/10'
          }`}>
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl font-bold ${
                isCompleted
                  ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                  : 'bg-gradient-to-br from-purple-500 to-pink-500'
              }`}>
                {entry.author_name?.[0] || '?'}
              </div>
              <div className="flex-1">
                <p className="text-white font-bold text-lg">{entry.author_name || '익명'}</p>
                <p className="text-gray-400 text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {new Date(entry.created_at).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              {isCompleted && (
                <div className="flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-full">
                  <Award className="w-5 h-5" />
                  <span className="font-bold">달성 완료!</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-white font-comic">
                {entry.title}
              </h1>

              {/* 삭제 버튼 (본인 또는 관리자만 표시) */}
              {canDelete && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors disabled:opacity-50"
                  title={isAdmin && !isOwner ? '관리자 권한으로 삭제' : '삭제'}
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-sm">
                    {deleting ? '삭제 중...' : isAdmin && !isOwner ? '관리자 삭제' : '삭제'}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Progress Section */}
            {entry.goal_amount && (
              <div className="mb-8 p-6 bg-space-800/50 rounded-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-purple-400" />
                  <span className="text-white font-bold">목표 달성 현황</span>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">진행률</span>
                    <span className={`font-bold ${isCompleted ? 'text-green-400' : 'text-cyan-400'}`}>
                      {progress.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-4 bg-space-900 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCompleted
                          ? 'bg-gradient-to-r from-green-500 to-emerald-400'
                          : 'bg-gradient-to-r from-purple-500 to-pink-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-space-900/50 rounded-xl">
                    <p className="text-gray-400 text-sm mb-1">현재 달성</p>
                    <p className="text-cyan-400 text-xl font-bold font-mono">
                      {formatCurrency(entry.current_amount || 0)}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-space-900/50 rounded-xl">
                    <p className="text-gray-400 text-sm mb-1">최종 목표</p>
                    <p className="text-purple-400 text-xl font-bold font-mono">
                      {formatCurrency(entry.goal_amount)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Content Text */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                도전 스토리
              </h3>
              <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                {entry.content || '아직 스토리가 작성되지 않았습니다.'}
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 pt-6 border-t border-purple-500/20">
              <div className="flex items-center gap-2 text-gray-400">
                <Heart className="w-5 h-5" />
                <span>{entry.likes || 0} 좋아요</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Eye className="w-5 h-5" />
                <span>{(entry.views || 0) + 1} 조회</span>
              </div>
            </div>
          </div>
        </div>

        {/* Encouragement Banner */}
        <div className="mt-8 glass rounded-2xl p-6 text-center bg-gradient-to-r from-purple-500/5 to-cyan-500/5">
          <p className="text-2xl mb-2">💪🦦</p>
          <p className="text-gray-400 font-gaegu text-lg">
            {isCompleted
              ? '축하합니다! 이 도전자는 목표를 달성했어요!'
              : '응원해주세요! 작은 응원이 큰 힘이 됩니다!'}
          </p>
        </div>
      </div>
    </div>
  )
}
