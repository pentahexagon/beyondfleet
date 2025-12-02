'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'

interface NewsItem {
  id: string
  title: string
  summary: string
  category: string
  source: string
  source_url: string
  image_url: string
  published_at: string
}

type Category = 'all' | 'bitcoin' | 'ethereum' | 'defi' | 'nft' | 'regulation'

const CATEGORIES: { label: string; value: Category; icon: string }[] = [
  { label: '전체', value: 'all', icon: '📰' },
  { label: 'Bitcoin', value: 'bitcoin', icon: '₿' },
  { label: 'Ethereum', value: 'ethereum', icon: '⟠' },
  { label: 'DeFi', value: 'defi', icon: '🏦' },
  { label: 'NFT', value: 'nft', icon: '🎨' },
  { label: '규제/정책', value: 'regulation', icon: '⚖️' },
]

function NewsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<Category>(
    (searchParams.get('category') as Category) || 'all'
  )
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get('page') || '1')
  )
  const [totalPages, setTotalPages] = useState(1)

  const fetchNews = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        category,
        page: currentPage.toString(),
      })

      const res = await fetch(`/api/news?${params}`)
      const data = await res.json()

      if (data.news) {
        setNews(data.news)
        setTotalPages(data.total_pages || 1)
      }
    } catch (error) {
      console.error('Error fetching news:', error)
    } finally {
      setLoading(false)
    }
  }, [category, currentPage])

  useEffect(() => {
    fetchNews()
  }, [fetchNews])

  useEffect(() => {
    const params = new URLSearchParams()
    if (category !== 'all') params.set('category', category)
    if (currentPage > 1) params.set('page', currentPage.toString())
    router.replace(`/news?${params.toString()}`, { scroll: false })
  }, [category, currentPage, router])

  const handleCategoryChange = (newCategory: Category) => {
    setCategory(newCategory)
    setCurrentPage(1)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (hours < 1) return '방금 전'
    if (hours < 24) return `${hours}시간 전`
    if (days < 7) return `${days}일 전`
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getCategoryLabel = (cat: string) => {
    const found = CATEGORIES.find((c) => c.value === cat)
    return found ? found.label : '전체'
  }

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'bitcoin':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'ethereum':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'defi':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'nft':
        return 'bg-pink-500/20 text-pink-400 border-pink-500/30'
      case 'regulation':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            암호화폐 뉴스
          </h1>
          <p className="text-gray-400">
            실시간 암호화폐 뉴스와 AI 요약을 확인하세요
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-8 overflow-x-auto pb-2">
          <div className="flex gap-2 min-w-max">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => handleCategoryChange(cat.value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                  category === cat.value
                    ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white'
                    : 'bg-space-800/50 text-gray-400 hover:text-white hover:bg-space-700/50'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* News Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass rounded-xl overflow-hidden animate-pulse">
                <div className="h-48 bg-purple-500/20" />
                <div className="p-4">
                  <div className="h-4 bg-purple-500/20 rounded w-1/4 mb-3" />
                  <div className="h-6 bg-purple-500/20 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-purple-500/20 rounded w-full mb-2" />
                  <div className="h-4 bg-purple-500/20 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : news.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center">
            <p className="text-gray-400 text-lg">해당 카테고리의 뉴스가 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {news.map((item) => (
              <a
                key={item.id}
                href={item.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="glass rounded-xl overflow-hidden card-hover group"
              >
                {/* Image */}
                <div className="relative h-48 bg-space-800/50">
                  {item.image_url ? (
                    <Image
                      src={item.image_url}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-4xl opacity-50">📰</span>
                    </div>
                  )}
                  {/* Category Badge */}
                  <div className="absolute top-3 left-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(
                        item.category
                      )}`}
                    >
                      {getCategoryLabel(item.category)}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  {/* AI Summary Badge */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-cyan-500/20 border border-cyan-500/30 rounded-full text-cyan-400 text-xs flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                      AI 요약
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-white font-bold text-lg mb-2 line-clamp-2 group-hover:text-cyan-400 transition-colors">
                    {item.title}
                  </h3>

                  {/* Summary */}
                  <p className="text-gray-400 text-sm line-clamp-3 mb-4">
                    {item.summary}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{item.source}</span>
                    <span>{formatDate(item.published_at)}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg bg-space-800/50 text-gray-400 hover:text-white hover:bg-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ← 이전
            </button>

            <div className="flex items-center gap-1">
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 rounded-lg transition-colors ${
                      currentPage === pageNum
                        ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white'
                        : 'bg-space-800/50 text-gray-400 hover:text-white hover:bg-purple-500/20'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-lg bg-space-800/50 text-gray-400 hover:text-white hover:bg-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              다음 →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function NewsLoading() {
  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="h-10 bg-purple-500/20 rounded w-48 mb-2" />
          <div className="h-4 bg-purple-500/20 rounded w-64" />
        </div>
        <div className="flex gap-2 mb-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 bg-purple-500/20 rounded-xl w-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass rounded-xl overflow-hidden animate-pulse">
              <div className="h-48 bg-purple-500/20" />
              <div className="p-4">
                <div className="h-4 bg-purple-500/20 rounded w-1/4 mb-3" />
                <div className="h-6 bg-purple-500/20 rounded w-3/4 mb-2" />
                <div className="h-4 bg-purple-500/20 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function NewsPage() {
  return (
    <Suspense fallback={<NewsLoading />}>
      <NewsContent />
    </Suspense>
  )
}
