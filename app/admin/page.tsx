'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Users, Eye, Image, Activity } from 'lucide-react'

interface DashboardStats {
  totalUsers: number
  todayVisitors: number
  nftSales: number
  activeAuctions: number
}

interface ActivityLog {
  id: string
  type: string
  description: string
  created_at: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    todayVisitors: 0,
    nftSales: 0,
    activeAuctions: 0,
  })
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    try {
      // Fetch total users
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      // Fetch NFT stats
      const { count: nftSalesCount } = await supabase
        .from('nfts')
        .select('*', { count: 'exact', head: true })
        .not('owner_id', 'is', null)

      // Fetch active auctions
      const { count: activeAuctionsCount } = await supabase
        .from('auctions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      setStats({
        totalUsers: usersCount || 0,
        todayVisitors: Math.floor(Math.random() * 100) + 50, // Placeholder
        nftSales: nftSalesCount || 0,
        activeAuctions: activeAuctionsCount || 0,
      })

      // Fetch recent activities (mock data for now)
      setActivities([
        { id: '1', type: 'user', description: '새 회원 가입: user@example.com', created_at: new Date().toISOString() },
        { id: '2', type: 'nft', description: 'NFT 판매 완료: Galaxy Explorer #001', created_at: new Date(Date.now() - 3600000).toISOString() },
        { id: '3', type: 'auction', description: '옥션 입찰: Cosmic Warrior #012', created_at: new Date(Date.now() - 7200000).toISOString() },
      ])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { label: '총 회원 수', value: stats.totalUsers, icon: Users, color: 'from-purple-500 to-purple-700' },
    { label: '오늘 방문자', value: stats.todayVisitors, icon: Eye, color: 'from-cyan-500 to-cyan-700' },
    { label: 'NFT 판매', value: stats.nftSales, icon: Image, color: 'from-green-500 to-green-700' },
    { label: '진행중 옥션', value: stats.activeAuctions, icon: Activity, color: 'from-amber-500 to-amber-700' },
  ]

  function formatTime(dateString: string) {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / 3600000)
    const minutes = Math.floor(diff / 60000)

    if (hours > 0) return `${hours}시간 전`
    if (minutes > 0) return `${minutes}분 전`
    return '방금 전'
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-8">관리자 대시보드</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="bg-space-800 rounded-xl p-6 border border-purple-500/20"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-white">{stat.value.toLocaleString()}</p>
            </div>
          )
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-space-800 rounded-xl border border-purple-500/20 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">최근 활동</h2>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between py-3 border-b border-purple-500/10 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  activity.type === 'user' ? 'bg-green-500' :
                  activity.type === 'nft' ? 'bg-purple-500' : 'bg-amber-500'
                }`} />
                <span className="text-gray-300">{activity.description}</span>
              </div>
              <span className="text-gray-500 text-sm">{formatTime(activity.created_at)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
