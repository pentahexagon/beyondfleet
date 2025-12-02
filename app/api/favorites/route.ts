import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function GET(request: NextRequest) {
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ favorites: [] })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const userId = request.headers.get('x-user-id')

  if (!userId) {
    return NextResponse.json({ favorites: [] })
  }

  try {
    const { data, error } = await supabase
      .from('favorites')
      .select('coin_id')
      .eq('user_id', userId)

    if (error) throw error

    return NextResponse.json({
      favorites: data?.map(f => f.coin_id) || []
    })
  } catch (error) {
    console.error('Error fetching favorites:', error)
    return NextResponse.json({ favorites: [] })
  }
}

export async function POST(request: NextRequest) {
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const userId = request.headers.get('x-user-id')

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { coinId } = await request.json()

    const { error } = await supabase
      .from('favorites')
      .insert({ user_id: userId, coin_id: coinId })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error adding favorite:', error)
    return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const userId = request.headers.get('x-user-id')

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { coinId } = await request.json()

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('coin_id', coinId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing favorite:', error)
    return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 })
  }
}
