// AI Daily Brief 생성 API
// POST /api/cosmic-radar/daily-brief/generate

import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { collectMarketData, formatPrice } from '@/lib/api/binance'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 60초 타임아웃

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

// Supabase 클라이언트 lazy loading
function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

// Claude API로 분석 생성
async function generateAnalysisWithClaude(marketData: {
  prices: Record<string, { price: number; changePercent24h: number; high24h: number; low24h: number }>
  fearGreedIndex: number
}): Promise<{ summary: string; fullContent: string; sentiment: string; predictions: string[] }> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured')
  }

  const { prices, fearGreedIndex } = marketData

  const prompt = `당신은 암호화폐 시장 전문 분석가입니다. 다음 실시간 시장 데이터를 바탕으로 종합적인 일일 브리핑을 작성해주세요.

## 현재 시장 데이터
- BTC: $${prices.btc?.price?.toLocaleString() || 'N/A'} (24h: ${prices.btc?.changePercent24h?.toFixed(2) || 0}%)
- ETH: $${prices.eth?.price?.toLocaleString() || 'N/A'} (24h: ${prices.eth?.changePercent24h?.toFixed(2) || 0}%)
- SOL: $${prices.sol?.price?.toLocaleString() || 'N/A'} (24h: ${prices.sol?.changePercent24h?.toFixed(2) || 0}%)
- XRP: $${prices.xrp?.price?.toLocaleString() || 'N/A'} (24h: ${prices.xrp?.changePercent24h?.toFixed(2) || 0}%)
- Fear & Greed Index: ${fearGreedIndex}/100

## 요청사항
다음 JSON 형식으로 응답해주세요:

{
  "summary": "3줄 요약 (150자 이내)",
  "fullContent": "상세 분석 (마크다운 형식, 다음 섹션 포함: 1. 시장 개요, 2. 주요 코인 분석, 3. 기술적 분석, 4. 투자 전략 제안, 5. 주의사항)",
  "sentiment": "bullish 또는 bearish 또는 neutral 중 하나",
  "predictions": ["예측 1", "예측 2", "예측 3"] (단기 예측 3개)
}

분석은 전문적이면서도 이해하기 쉽게 작성하고, 한국어로 작성해주세요.`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Claude API error: ${error}`)
  }

  const data = await response.json()
  const content = data.content[0].text

  // JSON 파싱 시도
  try {
    // JSON 블록 추출
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    throw new Error('No JSON found in response')
  } catch {
    // JSON 파싱 실패 시 기본값 반환
    return {
      summary: content.slice(0, 150),
      fullContent: content,
      sentiment: 'neutral',
      predictions: ['시장 변동성 주의', '기술적 분석 확인 필요', '리스크 관리 중요'],
    }
  }
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
    // Cron secret 또는 admin 인증 확인
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Admin 체크 (간단 버전)
      const token = authHeader?.replace('Bearer ', '')
      if (token) {
        const { data: { user } } = await supabase.auth.getUser(token)
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
      } else if (cronSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const today = new Date().toISOString().split('T')[0]

    // 오늘 이미 생성된 리포트가 있는지 확인
    const { data: existing } = await supabase
      .from('daily_briefs')
      .select('id')
      .eq('date', today)
      .single()

    if (existing) {
      return NextResponse.json({
        success: false,
        message: '오늘의 리포트가 이미 존재합니다',
        date: today,
      })
    }

    // 시장 데이터 수집
    const marketData = await collectMarketData()

    // Claude API로 분석 생성
    const analysis = await generateAnalysisWithClaude({
      prices: marketData.prices as unknown as Record<string, { price: number; changePercent24h: number; high24h: number; low24h: number }>,
      fearGreedIndex: marketData.fearGreedIndex,
    })

    // DB에 저장
    const { data: brief, error } = await supabase
      .from('daily_briefs')
      .insert({
        date: today,
        title: `${today} 일일 마켓 브리프`,
        summary: analysis.summary,
        full_content: analysis.fullContent,
        market_sentiment: analysis.sentiment,
        btc_price: marketData.prices.btc.price,
        eth_price: marketData.prices.eth.price,
        btc_change_24h: marketData.prices.btc.changePercent24h,
        eth_change_24h: marketData.prices.eth.changePercent24h,
        fear_greed_index: marketData.fearGreedIndex,
        predictions: analysis.predictions,
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving daily brief:', error)
      throw error
    }

    return NextResponse.json({
      success: true,
      brief,
      marketData: {
        btc: formatPrice(marketData.prices.btc.price),
        eth: formatPrice(marketData.prices.eth.price),
        fearGreedIndex: marketData.fearGreedIndex,
      },
    })

  } catch (error) {
    console.error('Daily brief generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    )
  }
}
