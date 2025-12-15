import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

// Create Supabase client lazily to avoid build-time errors
function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

interface NewsItem {
  title: string
  summary: string
  source: string
  published_at: string
  is_premium: boolean
  premium_category: string | null
}

// Tier-specific prompts
const TIER_PROMPTS = {
  cadet: `당신은 암호화폐 뉴스 분석가입니다. 오늘의 주요 뉴스를 3줄로 간결하게 요약해주세요.
- 가장 중요한 뉴스 3개 선별
- 각 뉴스를 한 줄로 요약
- 초보자도 이해할 수 있게 쉬운 언어 사용
- 한국어로 작성`,

  navigator: `당신은 암호화폐 기관 투자 전문 분석가입니다. 기관 동향에 집중하여 분석해주세요.
분석 내용:
1. 오늘의 주요 뉴스 3줄 요약
2. 기관 동향 분석 (블랙록, 피델리티, 그레이스케일, 마이크로스트래티지 등)
3. ETF 관련 소식
4. 기관 투자자 움직임이 시장에 미치는 영향
- 한국어로 작성
- 구체적인 수치와 날짜 포함`,

  pilot: `당신은 암호화폐 시장 전문 분석가입니다. 기관 동향과 고래 움직임을 종합 분석해주세요.
분석 내용:
1. 오늘의 주요 뉴스 3줄 요약
2. 기관 동향 분석
3. 고래 동향 요약 (대형 거래, 지갑 움직임)
4. 거래소 입출금 트렌드
5. 단기 시장 전망
- 한국어로 작성
- 구체적인 데이터 기반 분석`,

  commander: `당신은 암호화폐 AI 심층 분석 전문가입니다. 종합적인 시장 분석을 제공해주세요.
분석 내용:
1. 오늘의 주요 뉴스 요약
2. 기관 동향 분석
3. 고래 동향 분석
4. 시장 심리 분석 (Fear & Greed, 소셜 센티먼트)
5. 기술적 분석 요약 (주요 지지/저항선)
6. 투자 전략 제안 (리스크 관리 포함)
7. 주의해야 할 이벤트
- 한국어로 작성
- 전문적이고 상세한 분석`,

  admiral: `당신은 최고 수준의 암호화폐 투자 전략가입니다. 가장 상세한 분석과 예측을 제공해주세요.
분석 내용:
1. 오늘의 주요 뉴스 종합 분석
2. 기관 동향 심층 분석
3. 고래 동향 및 온체인 분석
4. 시장 심리 및 센티먼트 분석
5. 기술적 분석 (차트 패턴, 지표)
6. 펀더멘털 분석
7. 주간 가격 예측 범위 (BTC, ETH)
8. 주요 리스크 요인
9. 투자 전략 및 포트폴리오 제안
10. 다음 주 주요 이벤트 캘린더
- 한국어로 작성
- 독점 인사이트 포함
- 구체적인 가격대와 확률 제시`,
}

type Tier = 'cadet' | 'navigator' | 'pilot' | 'commander' | 'admiral'

async function fetchTodayNews(): Promise<NewsItem[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/news?per_page=50`)
    const data = await response.json()
    return data.news || []
  } catch (error) {
    console.error('Error fetching news:', error)
    return []
  }
}

async function analyzeWithClaude(news: NewsItem[], tier: Tier): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured')
  }

  const newsContext = news.slice(0, 20).map((n, i) =>
    `${i + 1}. [${n.source}] ${n.title}\n   요약: ${n.summary}\n   카테고리: ${n.premium_category || '일반'}`
  ).join('\n\n')

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `${TIER_PROMPTS[tier]}\n\n오늘의 뉴스:\n${newsContext}`,
        },
      ],
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Claude API error: ${error}`)
  }

  const data = await response.json()
  return data.content[0].text
}

function extractSentiment(content: string): 'bullish' | 'bearish' | 'neutral' {
  const lowerContent = content.toLowerCase()
  const bullishKeywords = ['상승', '강세', '매수', '긍정', '호재', 'bullish', '돌파']
  const bearishKeywords = ['하락', '약세', '매도', '부정', '악재', 'bearish', '지지선']

  let bullishCount = 0
  let bearishCount = 0

  bullishKeywords.forEach(keyword => {
    if (lowerContent.includes(keyword)) bullishCount++
  })

  bearishKeywords.forEach(keyword => {
    if (lowerContent.includes(keyword)) bearishCount++
  })

  if (bullishCount > bearishCount + 2) return 'bullish'
  if (bearishCount > bullishCount + 2) return 'bearish'
  return 'neutral'
}

export async function POST(request: NextRequest) {
  const supabase = getSupabase()
  if (!supabase) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 }
    )
  }

  try {
    // Verify authorization (admin only or cron secret)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (authHeader !== `Bearer ${cronSecret}` && !authHeader?.startsWith('Bearer ')) {
      // For manual triggers, verify admin user
      const { data: { user } } = await supabase.auth.getUser(authHeader?.replace('Bearer ', ''))
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }
    }

    const body = await request.json().catch(() => ({}))
    const targetTier = body.tier as Tier | 'all' || 'all'
    const today = new Date().toISOString().split('T')[0]

    // Create job record
    const { data: job } = await supabase
      .from('ai_analysis_jobs')
      .insert({
        job_type: 'daily_report',
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    try {
      // Fetch today's news
      const news = await fetchTodayNews()

      if (news.length === 0) {
        throw new Error('No news available for analysis')
      }

      const tiers: Tier[] = targetTier === 'all'
        ? ['cadet', 'navigator', 'pilot', 'commander', 'admiral']
        : [targetTier]

      const results: Record<string, unknown>[] = []

      for (const tier of tiers) {
        // Check if report already exists for today
        const { data: existing } = await supabase
          .from('daily_reports')
          .select('id')
          .eq('date', today)
          .eq('tier', tier)
          .single()

        if (existing) {
          console.log(`Report for ${tier} already exists, skipping...`)
          continue
        }

        // Generate analysis
        const content = await analyzeWithClaude(news, tier)
        const sentiment = extractSentiment(content)

        // Save report
        const { data: report, error } = await supabase
          .from('daily_reports')
          .insert({
            date: today,
            tier,
            title: `${today} ${tier.toUpperCase()} 일일 리포트`,
            content,
            summary: content.split('\n').slice(0, 3).join('\n'),
            market_sentiment: sentiment,
          })
          .select()
          .single()

        if (error) {
          console.error(`Error saving ${tier} report:`, error)
        } else {
          results.push(report)
        }

        // Rate limiting - wait 1 second between API calls
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      // Update job as completed
      await supabase
        .from('ai_analysis_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          result: { reports_created: results.length },
        })
        .eq('id', job?.id)

      return NextResponse.json({
        success: true,
        reports_created: results.length,
        reports: results,
      })

    } catch (error) {
      // Update job as failed
      await supabase
        .from('ai_analysis_jobs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('id', job?.id)

      throw error
    }

  } catch (error) {
    console.error('AI analysis error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    )
  }
}

// GET endpoint to fetch reports
export async function GET(request: NextRequest) {
  const supabase = getSupabase()
  if (!supabase) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 }
    )
  }

  const searchParams = request.nextUrl.searchParams
  const tier = searchParams.get('tier') || 'cadet'
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

  try {
    const { data, error } = await supabase
      .from('daily_reports')
      .select('*')
      .eq('date', date)
      .eq('tier', tier)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ report: null, message: 'No report available for this date' })
      }
      throw error
    }

    return NextResponse.json({ report: data })
  } catch (error) {
    console.error('Error fetching report:', error)
    return NextResponse.json(
      { error: 'Failed to fetch report' },
      { status: 500 }
    )
  }
}
