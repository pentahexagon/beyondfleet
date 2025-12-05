'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { News, NEWS_CATEGORIES } from '@/types/news'
import { Plus, Edit2, Trash2, X, Search, Sparkles, Eye, EyeOff, Play, RefreshCw, CheckCircle, XCircle, Clock, Bot } from 'lucide-react'

interface DailyReport {
  id: string
  date: string
  tier: string
  title: string
  content: string
  summary: string
  market_sentiment: 'bullish' | 'bearish' | 'neutral'
  created_at: string
}

interface AnalysisJob {
  id: string
  job_type: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  started_at: string | null
  completed_at: string | null
  error_message: string | null
  created_at: string
}

const TIERS = ['cadet', 'navigator', 'pilot', 'commander', 'admiral']

const TIER_LABELS: Record<string, string> = {
  cadet: 'Cadet (무료)',
  navigator: 'Navigator',
  pilot: 'Pilot',
  commander: 'Commander',
  admiral: 'Admiral',
}

const SENTIMENT_COLORS: Record<string, string> = {
  bullish: 'text-green-400 bg-green-500/20',
  bearish: 'text-red-400 bg-red-500/20',
  neutral: 'text-gray-400 bg-gray-500/20',
}

export default function NewsManagementPage() {
  const [news, setNews] = useState<News[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingNews, setEditingNews] = useState<News | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [generatingSummary, setGeneratingSummary] = useState(false)

  // AI Automation states
  const [activeTab, setActiveTab] = useState<'news' | 'ai'>('news')
  const [reports, setReports] = useState<DailyReport[]>([])
  const [jobs, setJobs] = useState<AnalysisJob[]>([])
  const [isRunningAnalysis, setIsRunningAnalysis] = useState(false)
  const [selectedTier, setSelectedTier] = useState<string>('all')
  const [previewReport, setPreviewReport] = useState<DailyReport | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    summary: '',
    source: '',
    source_url: '',
    image_url: '',
    category: 'general',
    is_published: false,
  })

  useEffect(() => {
    fetchNews()
    fetchReports()
    fetchJobs()
  }, [])

  async function fetchNews() {
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setNews(data || [])
    } catch (error) {
      console.error('Error fetching news:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchReports() {
    try {
      let query = supabase
        .from('daily_reports')
        .select('*')
        .order('date', { ascending: false })
        .limit(50)

      if (selectedTier !== 'all') {
        query = query.eq('tier', selectedTier)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching reports:', error)
      } else {
        setReports(data || [])
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  async function fetchJobs() {
    try {
      const { data, error } = await supabase
        .from('ai_analysis_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Error fetching jobs:', error)
      } else {
        setJobs(data || [])
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  async function runAnalysis(tier: string = 'all') {
    setIsRunningAnalysis(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ tier }),
      })

      const data = await response.json()

      if (response.ok) {
        alert(`분석 완료! ${data.reports_created}개의 리포트가 생성되었습니다.`)
        fetchReports()
        fetchJobs()
      } else {
        alert(`오류: ${data.error}`)
      }
    } catch (error) {
      console.error('Analysis error:', error)
      alert('분석 중 오류가 발생했습니다.')
    } finally {
      setIsRunningAnalysis(false)
    }
  }

  async function deleteReport(id: string) {
    if (!confirm('이 리포트를 삭제하시겠습니까?')) return

    const { error } = await supabase
      .from('daily_reports')
      .delete()
      .eq('id', id)

    if (error) {
      alert('삭제 중 오류가 발생했습니다.')
    } else {
      fetchReports()
    }
  }

  function openModal(item?: News) {
    if (item) {
      setEditingNews(item)
      setFormData({
        title: item.title,
        content: item.content,
        summary: item.summary || '',
        source: item.source || '',
        source_url: item.source_url || '',
        image_url: item.image_url || '',
        category: item.category,
        is_published: item.is_published,
      })
    } else {
      setEditingNews(null)
      setFormData({
        title: '',
        content: '',
        summary: '',
        source: '',
        source_url: '',
        image_url: '',
        category: 'general',
        is_published: false,
      })
    }
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      const newsData = {
        title: formData.title,
        content: formData.content,
        summary: formData.summary || null,
        source: formData.source || null,
        source_url: formData.source_url || null,
        image_url: formData.image_url || null,
        category: formData.category,
        is_published: formData.is_published,
        published_at: formData.is_published ? new Date().toISOString() : null,
      }

      if (editingNews) {
        const { error } = await supabase
          .from('news')
          .update(newsData)
          .eq('id', editingNews.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('news')
          .insert(newsData)

        if (error) throw error
      }

      setShowModal(false)
      fetchNews()
    } catch (error) {
      console.error('Error saving news:', error)
      alert('뉴스 저장 중 오류가 발생했습니다.')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase
        .from('news')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchNews()
    } catch (error) {
      console.error('Error deleting news:', error)
      alert('뉴스 삭제 중 오류가 발생했습니다.')
    }
  }

  async function togglePublish(item: News) {
    try {
      const { error } = await supabase
        .from('news')
        .update({
          is_published: !item.is_published,
          published_at: !item.is_published ? new Date().toISOString() : null,
        })
        .eq('id', item.id)

      if (error) throw error
      fetchNews()
    } catch (error) {
      console.error('Error toggling publish:', error)
    }
  }

  async function generateSummary() {
    if (!formData.content) {
      alert('먼저 본문을 입력해주세요.')
      return
    }

    setGeneratingSummary(true)
    try {
      // Simple summary generation (first 200 chars + "...")
      // In production, this would call an AI API
      const summary = formData.content.slice(0, 200).trim() + '...'
      setFormData({ ...formData, summary })
    } catch (error) {
      console.error('Error generating summary:', error)
      alert('요약 생성 중 오류가 발생했습니다.')
    } finally {
      setGeneratingSummary(false)
    }
  }

  const filteredNews = news.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory
    return matchesSearch && matchesCategory
  })

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  function formatDateTime(dateString: string | null) {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
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
      {/* Tab Navigation */}
      <div className="flex items-center gap-4 mb-8 border-b border-purple-500/20 pb-4">
        <button
          onClick={() => setActiveTab('news')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'news'
              ? 'bg-purple-600 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          📰 뉴스 관리
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'ai'
              ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Bot className="w-4 h-4" />
          AI 자동화
        </button>
      </div>

      {activeTab === 'news' ? (
        // News Management Tab
        <>
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-white">뉴스 관리</h1>
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              새 뉴스 추가
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="뉴스 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-space-800 border border-purple-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 bg-space-800 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
            >
              <option value="all">전체 카테고리</option>
              {NEWS_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* News Table */}
          <div className="bg-space-800 rounded-xl border border-purple-500/20 overflow-hidden">
            <table className="w-full">
              <thead className="bg-space-900">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">제목</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">카테고리</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">출처</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">상태</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">등록일</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-500/10">
                {filteredNews.map((item) => (
                  <tr key={item.id} className="hover:bg-purple-500/5">
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <p className="text-white truncate">{item.title}</p>
                        {item.summary && (
                          <p className="text-gray-500 text-sm truncate mt-1">{item.summary}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded text-sm bg-purple-500/20 text-purple-300">
                        {NEWS_CATEGORIES.find((c) => c.value === item.category)?.label || item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400">{item.source || '-'}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => togglePublish(item)}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-sm transition-colors ${
                          item.is_published
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                            : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                        }`}
                      >
                        {item.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        {item.is_published ? '공개' : '비공개'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">{formatDate(item.created_at)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openModal(item)}
                          className="p-2 text-gray-400 hover:text-purple-400 transition-colors"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
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

            {filteredNews.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                등록된 뉴스가 없습니다.
              </div>
            )}
          </div>
        </>
      ) : (
        // AI Automation Tab
        <>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">🤖 AI 자동화 관리</h1>
              <p className="text-gray-400">Claude API를 사용한 자동 뉴스 분석 및 리포트 생성</p>
            </div>

            <div className="flex gap-3">
              <select
                value={selectedTier}
                onChange={(e) => {
                  setSelectedTier(e.target.value)
                  fetchReports()
                }}
                className="px-4 py-2 bg-space-800 border border-purple-500/30 rounded-lg text-white"
              >
                <option value="all">전체 등급</option>
                {TIERS.map(tier => (
                  <option key={tier} value={tier}>{TIER_LABELS[tier]}</option>
                ))}
              </select>

              <button
                onClick={() => runAnalysis(selectedTier)}
                disabled={isRunningAnalysis}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-cyan-500 text-white rounded-lg font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
              >
                {isRunningAnalysis ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    분석 중...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    AI 분석 실행
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Reports List */}
            <div className="lg:col-span-2">
              <div className="glass rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">일일 리포트</h2>

                {reports.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-400">아직 생성된 리포트가 없습니다.</p>
                    <button
                      onClick={() => runAnalysis()}
                      className="mt-4 px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30"
                    >
                      첫 리포트 생성하기
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <div
                        key={report.id}
                        className="bg-space-800/50 rounded-lg p-4 hover:bg-space-700/50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full uppercase">
                              {report.tier}
                            </span>
                            {report.market_sentiment && (
                              <span className={`px-2 py-1 rounded-full text-xs ${SENTIMENT_COLORS[report.market_sentiment]}`}>
                                {report.market_sentiment === 'bullish' ? '🐂 강세' :
                                 report.market_sentiment === 'bearish' ? '🐻 약세' : '➖ 중립'}
                              </span>
                            )}
                          </div>
                          <span className="text-gray-500 text-sm">{formatDate(report.date)}</span>
                        </div>

                        <h3 className="text-white font-medium mb-2">{report.title}</h3>
                        <p className="text-gray-400 text-sm line-clamp-2">{report.summary}</p>

                        <div className="flex items-center gap-2 mt-3">
                          <button
                            onClick={() => setPreviewReport(report)}
                            className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded text-sm hover:bg-blue-500/30 flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            미리보기
                          </button>
                          <button
                            onClick={() => deleteReport(report.id)}
                            className="px-3 py-1 bg-red-500/20 text-red-400 rounded text-sm hover:bg-red-500/30 flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            삭제
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Jobs History & Quick Actions */}
            <div className="lg:col-span-1 space-y-6">
              <div className="glass rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">작업 기록</h2>

                {jobs.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">작업 기록이 없습니다.</p>
                ) : (
                  <div className="space-y-3">
                    {jobs.slice(0, 10).map((job) => (
                      <div
                        key={job.id}
                        className="bg-space-800/50 rounded-lg p-3"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {job.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-400" />}
                          {job.status === 'failed' && <XCircle className="w-4 h-4 text-red-400" />}
                          {job.status === 'running' && <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />}
                          {job.status === 'pending' && <Clock className="w-4 h-4 text-gray-400" />}
                          <span className="text-white text-sm font-medium">
                            {job.job_type === 'daily_report' ? '일일 리포트' : job.job_type}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          <p>시작: {formatDateTime(job.started_at)}</p>
                          <p>완료: {formatDateTime(job.completed_at)}</p>
                          {job.error_message && (
                            <p className="text-red-400 mt-1">{job.error_message}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="glass rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">빠른 실행</h2>
                <div className="space-y-2">
                  {TIERS.map(tier => (
                    <button
                      key={tier}
                      onClick={() => runAnalysis(tier)}
                      disabled={isRunningAnalysis}
                      className="w-full px-4 py-2 bg-space-800/50 text-gray-300 rounded-lg hover:bg-purple-500/20 hover:text-purple-400 transition-colors text-sm text-left disabled:opacity-50"
                    >
                      {TIER_LABELS[tier]} 리포트 생성
                    </button>
                  ))}
                </div>
              </div>

              {/* Environment Check */}
              <div className="glass rounded-xl p-6 border border-amber-500/20">
                <h2 className="text-lg font-bold text-amber-400 mb-3">⚠️ 환경 설정</h2>
                <p className="text-gray-400 text-sm mb-2">
                  AI 분석을 사용하려면 다음 환경변수가 필요합니다:
                </p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• ANTHROPIC_API_KEY</li>
                  <li>• SUPABASE_SERVICE_ROLE_KEY</li>
                  <li>• CRON_SECRET (선택)</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}

      {/* News Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-space-800 rounded-xl border border-purple-500/20 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-purple-500/20 sticky top-0 bg-space-800">
              <h2 className="text-xl font-semibold text-white">
                {editingNews ? '뉴스 수정' : '새 뉴스 추가'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">제목</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 bg-space-900 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">본문</label>
                <textarea
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={8}
                  className="w-full px-4 py-2 bg-space-900 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-300">요약</label>
                  <button
                    type="button"
                    onClick={generateSummary}
                    disabled={generatingSummary}
                    className="flex items-center gap-1 px-3 py-1 text-sm bg-cyan-500/20 text-cyan-400 rounded hover:bg-cyan-500/30 transition-colors disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    {generatingSummary ? '생성중...' : 'AI 요약 생성'}
                  </button>
                </div>
                <textarea
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  rows={3}
                  placeholder="뉴스 요약..."
                  className="w-full px-4 py-2 bg-space-900 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">출처</label>
                  <input
                    type="text"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    placeholder="예: CoinDesk"
                    className="w-full px-4 py-2 bg-space-900 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">카테고리</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 bg-space-900 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  >
                    {NEWS_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">출처 URL</label>
                <input
                  type="url"
                  value={formData.source_url}
                  onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
                  className="w-full px-4 py-2 bg-space-900 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">이미지 URL</label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full px-4 py-2 bg-space-900 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={formData.is_published}
                  onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                  className="w-4 h-4 rounded border-purple-500/20 bg-space-900 text-purple-500 focus:ring-purple-500"
                />
                <label htmlFor="is_published" className="text-gray-300">바로 공개</label>
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
                  {editingNews ? '수정' : '등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Preview Modal */}
      {previewReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass rounded-2xl p-8 max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-sm rounded-full uppercase">
                    {previewReport.tier}
                  </span>
                  {previewReport.market_sentiment && (
                    <span className={`px-2 py-1 rounded-full text-sm ${SENTIMENT_COLORS[previewReport.market_sentiment]}`}>
                      {previewReport.market_sentiment === 'bullish' ? '🐂 강세' :
                       previewReport.market_sentiment === 'bearish' ? '🐻 약세' : '➖ 중립'}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-white">{previewReport.title}</h2>
                <p className="text-gray-400">{formatDate(previewReport.date)}</p>
              </div>
              <button
                onClick={() => setPreviewReport(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="prose prose-invert max-w-none">
              <div className="whitespace-pre-wrap text-gray-300 leading-relaxed">
                {previewReport.content}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
