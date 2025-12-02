// Auction Schedule Utilities
// Auctions run every Thursday at 8PM KST for 2 hours

const KST_OFFSET = 9 * 60 * 60 * 1000 // UTC+9

export interface AuctionSchedule {
  isActive: boolean
  nextAuctionStart: Date
  nextAuctionEnd: Date
  currentAuctionEnd?: Date
  timeUntilNext: number // milliseconds
  timeRemaining?: number // milliseconds (if active)
}

// Get Thursday 8PM KST for a given week
function getThursday8PM(date: Date): Date {
  const d = new Date(date)
  // Set to Thursday (4)
  const day = d.getUTCDay()
  const diff = (4 - day + 7) % 7
  d.setUTCDate(d.getUTCDate() + diff)
  // Set to 8PM KST = 11AM UTC (20:00 - 9:00 = 11:00)
  d.setUTCHours(11, 0, 0, 0)
  return d
}

// Get next Thursday 8PM KST from now
function getNextThursday8PM(): Date {
  const now = new Date()
  const thisThursday = getThursday8PM(now)

  // If this Thursday 8PM has passed, get next week's
  if (now.getTime() > thisThursday.getTime() + 2 * 60 * 60 * 1000) {
    // Add 7 days
    thisThursday.setUTCDate(thisThursday.getUTCDate() + 7)
  }

  return thisThursday
}

// Check if auction is currently active
export function getAuctionSchedule(): AuctionSchedule {
  const now = new Date()
  const nextStart = getNextThursday8PM()
  const auctionDuration = 2 * 60 * 60 * 1000 // 2 hours

  // Check if we're currently in an auction window
  const thisThursday = getThursday8PM(now)
  const auctionStart = thisThursday.getTime()
  const auctionEnd = auctionStart + auctionDuration
  const nowTime = now.getTime()

  const isActive = nowTime >= auctionStart && nowTime < auctionEnd

  if (isActive) {
    return {
      isActive: true,
      nextAuctionStart: thisThursday,
      nextAuctionEnd: new Date(auctionEnd),
      currentAuctionEnd: new Date(auctionEnd),
      timeUntilNext: 0,
      timeRemaining: auctionEnd - nowTime,
    }
  }

  return {
    isActive: false,
    nextAuctionStart: nextStart,
    nextAuctionEnd: new Date(nextStart.getTime() + auctionDuration),
    timeUntilNext: nextStart.getTime() - nowTime,
  }
}

// Format time remaining
export function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return '종료됨'

  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return `${days}일 ${hours % 24}시간 ${minutes % 60}분`
  }
  if (hours > 0) {
    return `${hours}시간 ${minutes % 60}분 ${seconds % 60}초`
  }
  if (minutes > 0) {
    return `${minutes}분 ${seconds % 60}초`
  }
  return `${seconds}초`
}

// Get day name in Korean
export function getKoreanDayName(date: Date): string {
  const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
  return days[date.getDay()]
}

// Format date in Korean
export function formatKoreanDateTime(date: Date): string {
  // Convert to KST
  const kstDate = new Date(date.getTime() + KST_OFFSET)
  const month = kstDate.getUTCMonth() + 1
  const day = kstDate.getUTCDate()
  const hours = kstDate.getUTCHours()
  const dayName = getKoreanDayName(new Date(date.getTime() + KST_OFFSET))

  return `${month}월 ${day}일 (${dayName}) ${hours}시`
}
