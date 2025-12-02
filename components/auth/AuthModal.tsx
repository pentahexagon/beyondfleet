'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Web3Login from './Web3Login'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultTab?: 'web2' | 'web3'
}

export default function AuthModal({ isOpen, onClose, defaultTab = 'web2' }: AuthModalProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'web2' | 'web3'>(defaultTab)
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleWeb2Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        onClose()
        router.refresh()
      } else {
        if (password.length < 6) {
          throw new Error('비밀번호는 최소 6자 이상이어야 합니다.')
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username },
          },
        })
        if (error) throw error
        setSuccess(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google 로그인에 실패했습니다.')
      setLoading(false)
    }
  }

  const handleWeb3Success = () => {
    onClose()
    router.refresh()
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative glass rounded-2xl p-8 max-w-md w-full text-center">
          <span className="text-5xl mb-4 block">🎉</span>
          <h2 className="text-2xl font-bold text-white mb-4">가입 완료!</h2>
          <p className="text-gray-400 mb-6">
            이메일로 확인 링크를 보냈습니다.<br />
            이메일을 확인하고 계정을 활성화하세요.
          </p>
          <Button onClick={onClose}>확인</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative glass rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <span className="text-3xl mb-2 block">🚀</span>
          <h2 className="text-xl font-bold gradient-text">BeyondFleet</h2>
        </div>

        {/* Tabs */}
        <div className="flex rounded-lg bg-space-800/50 p-1 mb-6">
          <button
            onClick={() => setActiveTab('web2')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              activeTab === 'web2'
                ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            이메일 로그인
          </button>
          <button
            onClick={() => setActiveTab('web3')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              activeTab === 'web3'
                ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            지갑 연결
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Web2 Tab Content */}
        {activeTab === 'web2' && (
          <div>
            {/* Mode Toggle */}
            <div className="flex justify-center gap-4 mb-6 text-sm">
              <button
                onClick={() => setMode('login')}
                className={mode === 'login' ? 'text-white font-medium' : 'text-gray-400'}
              >
                로그인
              </button>
              <span className="text-gray-600">|</span>
              <button
                onClick={() => setMode('signup')}
                className={mode === 'signup' ? 'text-white font-medium' : 'text-gray-400'}
              >
                회원가입
              </button>
            </div>

            <form onSubmit={handleWeb2Submit} className="space-y-4">
              {mode === 'signup' && (
                <Input
                  type="text"
                  placeholder="사용자명"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              )}
              <Input
                type="email"
                placeholder="이메일"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? '처리 중...' : mode === 'login' ? '로그인' : '가입하기'}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-purple-500/20" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-space-800 text-gray-400">또는</span>
              </div>
            </div>

            {/* Google Login */}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google로 계속하기
            </Button>
          </div>
        )}

        {/* Web3 Tab Content */}
        {activeTab === 'web3' && (
          <Web3Login onSuccess={handleWeb3Success} onError={setError} />
        )}

        {/* Footer */}
        <p className="mt-6 text-center text-gray-500 text-xs">
          로그인 시 이용약관 및 개인정보처리방침에 동의합니다.
        </p>
      </div>
    </div>
  )
}
