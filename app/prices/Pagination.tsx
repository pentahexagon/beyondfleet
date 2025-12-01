'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import Button from '@/components/ui/Button'

interface PaginationProps {
  currentPage: number
  hasMore: boolean
}

export default function Pagination({ currentPage, hasMore }: PaginationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`/prices?${params.toString()}`)
  }

  return (
    <div className="flex items-center justify-center gap-4">
      <Button
        variant="outline"
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
      >
        ← 이전
      </Button>

      <span className="text-gray-400">
        페이지 <span className="text-white font-medium">{currentPage}</span>
      </span>

      <Button
        variant="outline"
        onClick={() => goToPage(currentPage + 1)}
        disabled={!hasMore}
      >
        다음 →
      </Button>
    </div>
  )
}
