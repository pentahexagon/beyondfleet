'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import Input from '@/components/ui/Input'

interface SearchBarProps {
  initialValue: string
}

export default function SearchBar({ initialValue }: SearchBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [value, setValue] = useState(initialValue)

  const handleSearch = (searchValue: string) => {
    setValue(searchValue)
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (searchValue) {
        params.set('search', searchValue)
        params.delete('page')
      } else {
        params.delete('search')
      }
      router.push(`/prices?${params.toString()}`)
    })
  }

  return (
    <div className="relative">
      <Input
        type="text"
        placeholder="코인 이름 또는 심볼로 검색..."
        value={value}
        onChange={(e) => handleSearch(e.target.value)}
        icon={
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        }
      />
      {isPending && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}
