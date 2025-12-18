// Daily Brief 조회 API
// GET /api/cosmic-radar/daily-brief?tier=admiral&date=2024-12-16

import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

type MembershipTier = 'cadet' | 'navigator' | 'pilot' | 'commander' | 'admiral'

// 등급별 접근 레벨
const ACCESS_LEVELS: Record<MembershipTier, number> = {
  cadet: 0,
  navigator: 1,
  pilot: 2,
  commander: 3,
  admiral: 4,
}

// Supabase 클라이언트 lazy loading
function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

// 등급별 콘텐츠 필터링
function filterContentByTier(brief: Record<string, unknown>, tier: MembershipTier): Record<string, unknown> {
  const accessLevel = ACCESS_LEVELS[tier]

  // Cadet: 완전 잠금
  if (accessLevel === 0) {
    return {
      id: brief.id,
      date: brief.date,
      title: brief.title,
      locked: true,
      message: '🔒 Navigator 이상 멤버십이 필요합니다',
      requiredTier: 'navigator',
    }
  }

  // Navigator: 1주일 지연
  if (accessLevel === 1) {
    const briefDate = new Date(brief.date as string)
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    if (briefDate > oneWeekAgo) {
      return {
        id: brief.id,
        date: brief.date,
        title: brief.title,
        locked: true,
        message: '📅 Navigator 등급은 1주일 후에 열람 가능합니다',
        unlocksAt: new Date(briefDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        requiredTier: 'pilot',
      }
    }
    // 1주일 지난 리포트는 요약만 제공
    return {
      ...brief,
      full_content: null,
      summaryOnly: true,
    }
  }

  // Pilot: 요약만
  if (accessLevel === 2) {
    return {
      ...brief,
      full_content: null,
      summaryOnly: true,
      message: '📊 전체 내용은 Commander 이상에서 확인 가능합니다',
    }
  }

  // Commander, Admiral: 전체 내용
  return {
    ...brief,
    fullAccess: true,
  }
}

export async function GET(request: NextRequest) {
  const supabase = getSupabase()
  if (!supabase) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 }
    )
  }

  const searchParams = request.nextUrl.searchParams
  const tier = (searchParams.get('tier') || 'cadet') as MembershipTier
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
  const latest = searchParams.get('latest') === 'true'

  try {
    let query = supabase
      .from('daily_briefs')
      .select('*')

    if (latest) {
      // 최신 리포트 가져오기
      query = query.order('date', { ascending: false }).limit(1)
    } else {
      // 특정 날짜 리포트
      query = query.eq('date', date)
    }

    const { data, error } = await query.single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          brief: null,
          message: '해당 날짜의 리포트가 없습니다',
        })
      }
      throw error
    }

    // 등급별 콘텐츠 필터링
    const filteredBrief = filterContentByTier(data, tier)

    return NextResponse.json({
      brief: filteredBrief,
      userTier: tier,
      accessLevel: ACCESS_LEVELS[tier],
    })

  } catch (error) {
    console.error('Error fetching daily brief:', error)
    return NextResponse.json(
      { error: 'Failed to fetch daily brief' },
      { status: 500 }
    )
  }
}

// 리포트 목록 조회 (히스토리)
export async function POST(request: NextRequest) {
  const supabase = getSupabase()
  if (!supabase) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 }
    )
  }

  try {
    const body = await request.json()
    const { tier = 'cadet', limit = 7, offset = 0 } = body as {
      tier?: MembershipTier
      limit?: number
      offset?: number
    }

    const { data, error, count } = await supabase
      .from('daily_briefs')
      .select('id, date, title, summary, market_sentiment, btc_price, eth_price, btc_change_24h, eth_change_24h, fear_greed_index', { count: 'exact' })
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    // 등급별 필터링 적용
    const filteredBriefs = data?.map(brief => filterContentByTier(brief, tier)) || []

    return NextResponse.json({
      briefs: filteredBriefs,
      total: count,
      userTier: tier,
    })

  } catch (error) {
    console.error('Error fetching briefs list:', error)
    return NextResponse.json(
      { error: 'Failed to fetch briefs' },
      { status: 500 }
    )
  }
}
