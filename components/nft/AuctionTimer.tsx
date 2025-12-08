'use client'

import { useState, useEffect } from 'react'
import { Clock, AlertTriangle } from 'lucide-react'

interface AuctionTimerProps {
  endTime: string | Date
  onEnd?: () => void
  extended?: boolean
  extensionCount?: number
}

export default function AuctionTimer({
  endTime,
  onEnd,
  extended = false,
  extensionCount = 0,
}: AuctionTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number
    minutes: number
    seconds: number
    total: number
  }>({ hours: 0, minutes: 0, seconds: 0, total: 0 })
  const [isEnded, setIsEnded] = useState(false)
  const [showExtendedNotice, setShowExtendedNotice] = useState(extended)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const end = new Date(endTime).getTime()
      const now = Date.now()
      const diff = end - now

      if (diff <= 0) {
        setIsEnded(true)
        onEnd?.()
        return { hours: 0, minutes: 0, seconds: 0, total: 0 }
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      return { hours, minutes, seconds, total: diff }
    }

    setTimeLeft(calculateTimeLeft())

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [endTime, onEnd])

  // 연장 알림 3초 후 숨기기
  useEffect(() => {
    if (extended) {
      setShowExtendedNotice(true)
      const timeout = setTimeout(() => {
        setShowExtendedNotice(false)
      }, 3000)
      return () => clearTimeout(timeout)
    }
  }, [extended])

  const formatNumber = (n: number) => n.toString().padStart(2, '0')

  // 5분 이하일 때 긴급 스타일
  const isUrgent = timeLeft.total > 0 && timeLeft.total <= 5 * 60 * 1000
  // 1분 이하일 때 매우 긴급
  const isCritical = timeLeft.total > 0 && timeLeft.total <= 60 * 1000

  if (isEnded) {
    return (
      <div className="flex items-center gap-2 text-gray-400">
        <Clock className="w-4 h-4" />
        <span className="font-mono">경매 종료</span>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {/* 연장 알림 */}
      {showExtendedNotice && (
        <div className="flex items-center gap-1 text-yellow-400 text-sm animate-pulse">
          <AlertTriangle className="w-4 h-4" />
          <span>경매 시간 5분 연장! (#{extensionCount})</span>
        </div>
      )}

      {/* 타이머 */}
      <div className={`flex items-center gap-2 ${
        isCritical ? 'text-red-500 animate-pulse' :
        isUrgent ? 'text-orange-400' : 'text-white'
      }`}>
        <Clock className={`w-4 h-4 ${isUrgent ? 'animate-bounce' : ''}`} />

        <div className="flex items-center gap-1 font-mono text-lg">
          {timeLeft.hours > 0 && (
            <>
              <span className="bg-space-800 px-2 py-1 rounded">
                {formatNumber(timeLeft.hours)}
              </span>
              <span>:</span>
            </>
          )}
          <span className="bg-space-800 px-2 py-1 rounded">
            {formatNumber(timeLeft.minutes)}
          </span>
          <span>:</span>
          <span className="bg-space-800 px-2 py-1 rounded">
            {formatNumber(timeLeft.seconds)}
          </span>
        </div>

        {isUrgent && (
          <span className="text-sm">
            {isCritical ? '마감 임박!' : '곧 종료'}
          </span>
        )}
      </div>

      {/* 종료 시간 표시 */}
      <p className="text-gray-500 text-xs">
        {new Date(endTime).toLocaleString('ko-KR', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })} 종료
        {extensionCount > 0 && ` (${extensionCount}회 연장됨)`}
      </p>
    </div>
  )
}
