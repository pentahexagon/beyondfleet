'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { News, NEWS_CATEGORIES } from '@/types/news'
import { Plus, Edit2, Trash2, X, Search, Sparkles, Eye, EyeOff } from 'lucide-react'

export default function NewsManagementPage() {
  const [news, setNews] = useState<News[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingNews, setEditingNews] = useState<News | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [generatingSummary, setGeneratingSummary] = useState(false)

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

      {/* Modal */}
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
    </div>
  )
}
