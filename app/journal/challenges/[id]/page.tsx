'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { useAccount } from 'wagmi'
import { useWallet } from '@solana/wallet-adapter-react'
import { ArrowLeft, Heart, Eye, TrendingUp, Calendar, Target, Award, Trash2, MessageCircle, Send } from 'lucide-react'

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

interface Comment {
  id: string
  journal_id: string
  user_id?: string
  wallet_address?: string
  author_name: string
  content: string
  created_at: string
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
  const [hasLiked, setHasLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [liking, setLiking] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [username, setUsername] = useState<string>('')

  // Web3 wallet states
  const { address: ethAddress, isConnected: isEthConnected } = useAccount()
  const { publicKey: solPublicKey, connected: isSolConnected } = useWallet()
  const isWalletConnected = isEthConnected || isSolConnected
  const walletAddress = ethAddress || solPublicKey?.toBase58() || null

  // 로그인 상태 (Supabase 또는 지갑)
  const isLoggedIn = !!user || isWalletConnected

  useEffect(() => {
    // 사용자 정보 가져오기
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user)
      if (user?.email && ADMIN_EMAILS.includes(user.email)) {
        setIsAdmin(true)
      }
      // 사용자 이름 가져오기
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single()
        if (profile?.username) {
          setUsername(profile.username)
        } else {
          setUsername(user.email?.split('@')[0] || '익명')
        }
      }
    })

    if (params.id) {
      fetchEntry(params.id as string)
      fetchComments(params.id as string)
      checkIfLiked(params.id as string)
    }
  }, [params.id])

  // 지갑 연결 시 사용자 이름 설정
  useEffect(() => {
    if (isWalletConnected && walletAddress && !user) {
      // 지갑 주소에서 닉네임 가져오기
      const fetchWalletUsername = async () => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('wallet_address', walletAddress)
          .single()
        if (profile?.username) {
          setUsername(profile.username)
        } else {
          // 지갑 주소 축약형으로 설정
          setUsername(`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`)
        }
      }
      fetchWalletUsername()
    }
  }, [isWalletConnected, walletAddress, user])

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
      setLikeCount(data.likes || 0)

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

  // 댓글 목록 가져오기 (로컬스토리지 + DB 하이브리드)
  async function fetchComments(journalId: string) {
    // 먼저 로컬스토리지에서 댓글 불러오기
    try {
      const localComments = JSON.parse(localStorage.getItem(`comments_${journalId}`) || '[]')
      setComments(localComments)
    } catch (err) {
      console.error('Error loading local comments:', err)
    }

    // DB에서도 시도 (테이블이 있으면)
    try {
      const { data, error } = await supabase
        .from('journal_comments')
        .select('*')
        .eq('journal_id', journalId)
        .order('created_at', { ascending: true })

      if (!error && data && data.length > 0) {
        setComments(data)
      }
    } catch (err) {
      // DB 테이블이 없으면 로컬스토리지 댓글만 사용
      console.log('Using local comments only')
    }
  }

  // 좋아요 여부 확인 (로컬스토리지 사용)
  function checkIfLiked(journalId: string) {
    try {
      const likedPosts = JSON.parse(localStorage.getItem('liked_journals') || '[]')
      if (likedPosts.includes(journalId)) {
        setHasLiked(true)
      }
    } catch (err) {
      // 로컬스토리지 오류 무시
    }
  }

  // 좋아요 토글 (간단 버전 - journal_entries의 likes만 업데이트)
  async function handleLike() {
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.')
      return
    }
    if (!entry || liking) return

    setLiking(true)
    try {
      // 로컬스토리지에서 좋아요 목록 가져오기
      const likedPosts = JSON.parse(localStorage.getItem('liked_journals') || '[]')

      if (hasLiked) {
        // 좋아요 취소
        const { error } = await supabase
          .from('journal_entries')
          .update({ likes: Math.max(0, likeCount - 1) })
          .eq('id', entry.id)

        if (error) throw error

        // 로컬스토리지에서 제거
        const newLikedPosts = likedPosts.filter((id: string) => id !== entry.id)
        localStorage.setItem('liked_journals', JSON.stringify(newLikedPosts))

        setHasLiked(false)
        setLikeCount(prev => Math.max(0, prev - 1))
      } else {
        // 좋아요 추가
        const { error } = await supabase
          .from('journal_entries')
          .update({ likes: likeCount + 1 })
          .eq('id', entry.id)

        if (error) throw error

        // 로컬스토리지에 추가
        likedPosts.push(entry.id)
        localStorage.setItem('liked_journals', JSON.stringify(likedPosts))

        setHasLiked(true)
        setLikeCount(prev => prev + 1)
      }
    } catch (err) {
      console.error('Like error:', err)
      alert('좋아요 처리에 실패했습니다.')
    } finally {
      setLiking(false)
    }
  }

  // 댓글 작성 (로컬스토리지 + DB 하이브리드)
  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault()
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.')
      return
    }
    if (!entry || !newComment.trim() || submittingComment) return

    setSubmittingComment(true)

    const newCommentData: Comment = {
      id: crypto.randomUUID(),
      journal_id: entry.id,
      user_id: user?.id,
      wallet_address: walletAddress || undefined,
      author_name: username || '익명',
      content: newComment.trim(),
      created_at: new Date().toISOString()
    }

    try {
      // 먼저 DB에 저장 시도
      const { data, error } = await supabase
        .from('journal_comments')
        .insert({
          journal_id: entry.id,
          author_name: username || '익명',
          content: newComment.trim(),
          user_id: user?.id || null,
          wallet_address: walletAddress || null
        })
        .select()
        .single()

      if (!error && data) {
        setComments(prev => [...prev, data])
        setNewComment('')
        return
      }
    } catch (err) {
      console.log('DB save failed, using localStorage')
    }

    // DB 실패 시 로컬스토리지에 저장
    try {
      const localComments = JSON.parse(localStorage.getItem(`comments_${entry.id}`) || '[]')
      localComments.push(newCommentData)
      localStorage.setItem(`comments_${entry.id}`, JSON.stringify(localComments))
      setComments(prev => [...prev, newCommentData])
      setNewComment('')
    } catch (err) {
      console.error('LocalStorage error:', err)
      alert('댓글 저장에 실패했습니다.')
    } finally {
      setSubmittingComment(false)
    }
  }

  // 댓글 삭제 (로컬스토리지 + DB 하이브리드)
  async function handleDeleteComment(commentId: string, commentUserId: string) {
    if (!isLoggedIn) return
    if (!entry) return

    if (!confirm('댓글을 삭제하시겠습니까?')) return

    // DB에서 삭제 시도
    try {
      await supabase
        .from('journal_comments')
        .delete()
        .eq('id', commentId)
    } catch (err) {
      console.log('DB delete failed')
    }

    // 로컬스토리지에서도 삭제
    try {
      const localComments = JSON.parse(localStorage.getItem(`comments_${entry.id}`) || '[]')
      const filtered = localComments.filter((c: Comment) => c.id !== commentId)
      localStorage.setItem(`comments_${entry.id}`, JSON.stringify(filtered))
    } catch (err) {
      console.log('LocalStorage delete failed')
    }

    // UI에서 제거
    setComments(prev => prev.filter(c => c.id !== commentId))
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
        <div className={`glass rounded-3xl overflow-hidden border ${isCompleted ? 'border-green-500/30' : 'border-purple-500/20'
          }`}>
          {/* Header */}
          <div className={`p-6 ${isCompleted
              ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10'
              : 'bg-gradient-to-r from-purple-500/10 to-pink-500/10'
            }`}>
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl font-bold ${isCompleted
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
                      className={`h-full rounded-full transition-all duration-500 ${isCompleted
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

            {/* Stats & Like Button */}
            <div className="flex items-center gap-6 pt-6 border-t border-purple-500/20">
              <button
                onClick={handleLike}
                disabled={liking}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${hasLiked
                    ? 'bg-pink-500/20 text-pink-400 hover:bg-pink-500/30'
                    : 'bg-space-800 text-gray-400 hover:text-pink-400 hover:bg-pink-500/10'
                  } disabled:opacity-50`}
              >
                <Heart className={`w-5 h-5 ${hasLiked ? 'fill-current' : ''}`} />
                <span>{likeCount} 좋아요</span>
              </button>
              <div className="flex items-center gap-2 text-gray-400">
                <MessageCircle className="w-5 h-5" />
                <span>{comments.length} 댓글</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Eye className="w-5 h-5" />
                <span>{(entry.views || 0) + 1} 조회</span>
              </div>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="mt-8 glass rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-cyan-400" />
            응원 댓글 ({comments.length})
          </h3>

          {/* Comment Input */}
          {isLoggedIn ? (
            <form onSubmit={handleSubmitComment} className="mb-6">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                  {username?.[0] || '?'}
                </div>
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="응원 메시지를 남겨주세요! 💪"
                    className="flex-1 bg-space-800 border border-purple-500/20 rounded-full px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
                    maxLength={200}
                  />
                  <button
                    type="submit"
                    disabled={!newComment.trim() || submittingComment}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full text-white font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">{submittingComment ? '전송 중...' : '응원'}</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="mb-6 p-4 bg-space-800/50 rounded-xl text-center text-gray-400">
              로그인하면 응원 댓글을 남길 수 있어요! 🚀
            </div>
          )}

          {/* Comments List */}
          {comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-4xl mb-2">💬</p>
              <p>아직 댓글이 없어요. 첫 응원을 남겨주세요!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 p-4 bg-space-800/30 rounded-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                    {comment.author_name?.[0] || '?'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-bold">{comment.author_name}</span>
                      <span className="text-gray-500 text-xs">
                        {new Date(comment.created_at).toLocaleDateString('ko-KR', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {/* 삭제 버튼 (본인 또는 관리자) */}
                      {isLoggedIn && (
                        (user && (user.id === comment.user_id || isAdmin)) ||
                        (walletAddress && comment.wallet_address &&
                          walletAddress.toLowerCase() === comment.wallet_address.toLowerCase())
                      ) && (
                          <button
                            onClick={() => handleDeleteComment(comment.id, comment.user_id || '')}
                            className="ml-auto flex items-center gap-1 px-2 py-1 text-xs text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded transition-colors"
                            title="삭제"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>삭제</span>
                          </button>
                        )}
                    </div>
                    <p className="text-gray-300">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
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
