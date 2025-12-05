'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

const ADMIN_EMAIL = 'coinkim00@gmail.com'

interface AdminGuardProps {
  children: React.ReactNode
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAuth()
    })

    return () => subscription.unsubscribe()
  }, [])

  async function checkAuth() {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        showAccessDenied()
        return
      }

      // Check if user is admin
      if (user.email === ADMIN_EMAIL) {
        setIsAuthorized(true)
        setIsLoading(false)
        return
      }

      // Also check role in profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role === 'admin') {
        setIsAuthorized(true)
        setIsLoading(false)
        return
      }

      showAccessDenied()
    } catch (error) {
      console.error('Auth check error:', error)
      showAccessDenied()
    }
  }

  function showAccessDenied() {
    setIsLoading(false)
    setIsAuthorized(false)
    // Show message then redirect
    setTimeout(() => {
      router.push('/')
    }, 2000)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-space-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">권한 확인 중...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-space-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">접근 권한이 없습니다</h1>
          <p className="text-gray-400 mb-4">관리자만 접근할 수 있는 페이지입니다.</p>
          <p className="text-gray-500 text-sm">메인 페이지로 이동합니다...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
