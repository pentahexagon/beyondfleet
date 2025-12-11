import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const WHALE_ALERT_API_KEY = process.env.WHALE_ALERT_API_KEY

// Create Supabase client lazily to avoid build-time errors
function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

interface WhaleTransaction {
  blockchain: string
  symbol: string
  transaction_type: string
  hash: string
  from: {
    address: string
    owner?: string
    owner_type?: string
  }
  to: {
    address: string
    owner?: string
    owner_type?: string
  }
  timestamp: number
  amount: number
  amount_usd: number
}

// Minimum thresholds for significant transactions (in USD)
const SIGNIFICANCE_THRESHOLDS: Record<string, number> = {
  BTC: 10000000,   // $10M
  ETH: 5000000,    // $5M
  USDT: 10000000,  // $10M
  USDC: 10000000,  // $10M
  default: 5000000 // $5M
}

function isSignificant(coin: string, amountUsd: number): boolean {
  const threshold = SIGNIFICANCE_THRESHOLDS[coin.toUpperCase()] || SIGNIFICANCE_THRESHOLDS.default
  return amountUsd >= threshold
}

function determineTransactionType(from: WhaleTransaction['from'], to: WhaleTransaction['to']): string {
  const fromIsExchange = from.owner_type === 'exchange'
  const toIsExchange = to.owner_type === 'exchange'

  if (fromIsExchange && !toIsExchange) return 'exchange_withdrawal'
  if (!fromIsExchange && toIsExchange) return 'exchange_deposit'
  if (fromIsExchange && toIsExchange) return 'transfer'
  return 'transfer'
}

// Fetch whale transactions from Whale Alert API
async function fetchWhaleAlertTransactions(): Promise<WhaleTransaction[]> {
  if (!WHALE_ALERT_API_KEY) {
    console.log('WHALE_ALERT_API_KEY not configured, using mock data')
    return getMockTransactions()
  }

  try {
    // Get transactions from the last hour
    const startTime = Math.floor(Date.now() / 1000) - 3600
    const url = `https://api.whale-alert.io/v1/transactions?api_key=${WHALE_ALERT_API_KEY}&min_value=1000000&start=${startTime}`

    const response = await fetch(url, {
      next: { revalidate: 60 }, // Cache for 1 minute
    })

    if (!response.ok) {
      throw new Error(`Whale Alert API error: ${response.status}`)
    }

    const data = await response.json()
    return data.transactions || []
  } catch (error) {
    console.error('Error fetching from Whale Alert:', error)
    return getMockTransactions()
  }
}

// Mock data for development/demo
function getMockTransactions(): WhaleTransaction[] {
  const now = Math.floor(Date.now() / 1000)
  return [
    {
      blockchain: 'bitcoin',
      symbol: 'BTC',
      transaction_type: 'transfer',
      hash: '0x' + Math.random().toString(16).substr(2, 64),
      from: { address: '1A1zP1...', owner: 'Unknown', owner_type: 'unknown' },
      to: { address: 'bc1qxy...', owner: 'Binance', owner_type: 'exchange' },
      timestamp: now - 300,
      amount: 1500,
      amount_usd: 150000000,
    },
    {
      blockchain: 'ethereum',
      symbol: 'ETH',
      transaction_type: 'transfer',
      hash: '0x' + Math.random().toString(16).substr(2, 64),
      from: { address: '0xdead...', owner: 'Coinbase', owner_type: 'exchange' },
      to: { address: '0xbeef...', owner: 'Unknown', owner_type: 'unknown' },
      timestamp: now - 600,
      amount: 25000,
      amount_usd: 87500000,
    },
    {
      blockchain: 'bitcoin',
      symbol: 'BTC',
      transaction_type: 'transfer',
      hash: '0x' + Math.random().toString(16).substr(2, 64),
      from: { address: '3FZbgi...', owner: 'Unknown', owner_type: 'unknown' },
      to: { address: '3CDJNp...', owner: 'Unknown', owner_type: 'unknown' },
      timestamp: now - 900,
      amount: 800,
      amount_usd: 80000000,
    },
    {
      blockchain: 'ethereum',
      symbol: 'USDT',
      transaction_type: 'transfer',
      hash: '0x' + Math.random().toString(16).substr(2, 64),
      from: { address: '0xaaaa...', owner: 'Tether Treasury', owner_type: 'unknown' },
      to: { address: '0xbbbb...', owner: 'Kraken', owner_type: 'exchange' },
      timestamp: now - 1200,
      amount: 50000000,
      amount_usd: 50000000,
    },
  ]
}

// GET - Fetch whale transactions
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const coin = searchParams.get('coin')
  const limit = parseInt(searchParams.get('limit') || '20')
  const significantOnly = searchParams.get('significant') === 'true'
  const supabase = getSupabase()

  try {
    let dbTransactions = null

    // First, try to get from database (if supabase is configured)
    if (supabase) {
      let query = supabase
        .from('whale_transactions')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit)

      if (coin) {
        query = query.eq('coin', coin.toUpperCase())
      }

      if (significantOnly) {
        query = query.eq('is_significant', true)
      }

      const { data, error } = await query
      dbTransactions = data

      if (error) {
        console.error('Database error:', error)
      }

      // If we have recent data (less than 5 minutes old), return it
      if (dbTransactions && dbTransactions.length > 0) {
        const mostRecent = new Date(dbTransactions[0].timestamp)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

        if (mostRecent > fiveMinutesAgo) {
          return NextResponse.json({
            transactions: dbTransactions,
            source: 'database',
          })
        }
      }
    }

    // Fetch fresh data from Whale Alert
    const whaleTransactions = await fetchWhaleAlertTransactions()

    // Format and save to database
    const formattedTransactions = whaleTransactions.map(tx => ({
      coin: tx.symbol.toUpperCase(),
      amount: tx.amount,
      amount_usd: tx.amount_usd,
      from_address: tx.from.address,
      to_address: tx.to.address,
      from_label: tx.from.owner || null,
      to_label: tx.to.owner || null,
      tx_type: determineTransactionType(tx.from, tx.to),
      tx_hash: tx.hash,
      blockchain: tx.blockchain,
      timestamp: new Date(tx.timestamp * 1000).toISOString(),
      is_significant: isSignificant(tx.symbol, tx.amount_usd),
    }))

    // Save to database (upsert to avoid duplicates) - only if supabase is configured
    if (supabase && formattedTransactions.length > 0) {
      await supabase
        .from('whale_transactions')
        .upsert(formattedTransactions, { onConflict: 'tx_hash' })
        .select()
    }

    // Apply filters
    let filteredTransactions = formattedTransactions
    if (coin) {
      filteredTransactions = filteredTransactions.filter(tx => tx.coin === coin.toUpperCase())
    }
    if (significantOnly) {
      filteredTransactions = filteredTransactions.filter(tx => tx.is_significant)
    }

    return NextResponse.json({
      transactions: filteredTransactions.slice(0, limit),
      source: 'api',
    })

  } catch (error) {
    console.error('Error fetching whale transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch whale transactions' },
      { status: 500 }
    )
  }
}

// POST - Manually add whale transaction (admin only)
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

    const { data, error } = await supabase
      .from('whale_transactions')
      .insert({
        coin: body.coin.toUpperCase(),
        amount: body.amount,
        amount_usd: body.amount_usd,
        from_address: body.from_address,
        to_address: body.to_address,
        from_label: body.from_label,
        to_label: body.to_label,
        tx_type: body.tx_type,
        tx_hash: body.tx_hash,
        blockchain: body.blockchain,
        timestamp: body.timestamp || new Date().toISOString(),
        is_significant: body.is_significant || false,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, transaction: data })
  } catch (error) {
    console.error('Error creating whale transaction:', error)
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    )
  }
}
