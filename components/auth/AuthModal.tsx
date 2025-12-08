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

// 로그인 시도 제한을 위한 상수
const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_DURATION = 5 * 60 * 1000 // 5분

export default function AuthModal({ isOpen, onClose, defaultTab = 'web2' }: AuthModalProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'web2' | 'web3'>(defaultTab)
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [loginAttempts, setLoginAttempts] = useState(0)
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null)
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null)

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

  // 비밀번호 강도 검사
  const checkPasswordStrength = (pwd: string): 'weak' | 'medium' | 'strong' => {
    let score = 0
    if (pwd.length >= 8) score++
    if (pwd.length >= 12) score++
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++
    if (/[0-9]/.test(pwd)) score++
    if (/[^a-zA-Z0-9]/.test(pwd)) score++

    if (score <= 2) return 'weak'
    if (score <= 3) return 'medium'
    return 'strong'
  }

  // 비밀번호 변경 시 강도 업데이트
  const handlePasswordChange = (pwd: string) => {
    setPassword(pwd)
    if (mode === 'signup' && pwd.length > 0) {
      setPasswordStrength(checkPasswordStrength(pwd))
    } else {
      setPasswordStrength(null)
    }
  }

  // 잠금 상태 확인
  const isLockedOut = lockoutUntil && Date.now() < lockoutUntil
  const remainingLockoutTime = lockoutUntil ? Math.ceil((lockoutUntil - Date.now()) / 1000) : 0

  // 에러 메시지 한글 변환
  const getErrorMessage = (error: Error | { message?: string; code?: string }) => {
    const msg = error.message || ''
    if (msg.includes('Invalid login credentials')) {
      return '이메일 또는 비밀번호가 올바르지 않습니다.'
    }
    if (msg.includes('Email not confirmed')) {
      return '이메일 인증이 필요합니다. 메일함을 확인해주세요.'
    }
    if (msg.includes('User already registered')) {
      return '이미 가입된 이메일입니다.'
    }
    if (msg.includes('Password should be')) {
      return '비밀번호는 최소 6자 이상이어야 합니다.'
    }
    if (msg.includes('Invalid email')) {
      return '올바른 이메일 형식이 아닙니다.'
    }
    return msg || '오류가 발생했습니다.'
  }

  // 비밀번호 복잡성 검증
  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) {
      return '비밀번호는 최소 8자 이상이어야 합니다.'
    }
    if (!/[a-z]/.test(pwd)) {
      return '소문자를 포함해야 합니다.'
    }
    if (!/[A-Z]/.test(pwd)) {
      return '대문자를 포함해야 합니다.'
    }
    if (!/[0-9]/.test(pwd)) {
      return '숫자를 포함해야 합니다.'
    }
    return null
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      if (error) throw error
      setResetSent(true)
    } catch (err) {
      const errorMsg = err instanceof Error ? getErrorMessage(err) : '오류가 발생했습니다.'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleWeb2Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // 잠금 상태 확인
    if (isLockedOut) {
      setError(`너무 많은 시도가 있었습니다. ${Math.ceil(remainingLockoutTime / 60)}분 후에 다시 시도해주세요.`)
      return
    }

    setLoading(true)

    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) {
          // 로그인 실패 시 시도 횟수 증가
          const newAttempts = loginAttempts + 1
          setLoginAttempts(newAttempts)

          if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
            setLockoutUntil(Date.now() + LOCKOUT_DURATION)
            throw new Error(`로그인 시도 ${MAX_LOGIN_ATTEMPTS}회 초과. 5분 후에 다시 시도해주세요.`)
          }

          throw error
        }
        if (data?.user) {
          // 로그인 성공 시 시도 횟수 초기화
          setLoginAttempts(0)
          setLockoutUntil(null)
          onClose()
          window.location.reload()
        }
      } else if (mode === 'signup') {
        // 비밀번호 복잡성 검증
        const passwordError = validatePassword(password)
        if (passwordError) {
          throw new Error(passwordError)
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
      const errorMsg = err instanceof Error ? getErrorMessage(err) : '오류가 발생했습니다.'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleWeb3Success = () => {
    onClose()
    router.refresh()
  }

  if (resetSent) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative glass rounded-2xl p-8 max-w-md w-full text-center">
          <span className="text-5xl mb-4 block">📧</span>
          <h2 className="text-2xl font-bold text-white mb-4">이메일 전송 완료!</h2>
          <p className="text-gray-400 mb-6">
            <span className="text-cyan-400">{email}</span>로<br />
            비밀번호 재설정 링크를 보냈습니다.<br />
            이메일을 확인해주세요.
          </p>
          <Button onClick={() => { setResetSent(false); setMode('login'); }}>로그인으로 돌아가기</Button>
        </div>
      </div>
    )
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
              <span className="text-gray-600">|</span>
              <button
                onClick={() => setMode('reset')}
                className={mode === 'reset' ? 'text-white font-medium' : 'text-gray-400'}
              >
                비밀번호 찾기
              </button>
            </div>

            {/* Password Reset Form */}
            {mode === 'reset' ? (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <p className="text-gray-400 text-sm text-center mb-4">
                  가입한 이메일을 입력하면<br />비밀번호 재설정 링크를 보내드립니다.
                </p>
                <Input
                  type="email"
                  placeholder="이메일"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? '전송 중...' : '재설정 링크 받기'}
                </Button>
              </form>
            ) : (
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
                <div>
                  <Input
                    type="password"
                    placeholder={mode === 'signup' ? '비밀번호 (8자 이상, 대소문자+숫자)' : '비밀번호'}
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    required
                  />
                  {/* 비밀번호 강도 표시 (회원가입 시에만) */}
                  {mode === 'signup' && passwordStrength && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        <div className={`h-1 flex-1 rounded ${
                          passwordStrength === 'weak' ? 'bg-red-500' :
                          passwordStrength === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`} />
                        <div className={`h-1 flex-1 rounded ${
                          passwordStrength === 'medium' || passwordStrength === 'strong' ?
                          (passwordStrength === 'medium' ? 'bg-yellow-500' : 'bg-green-500') : 'bg-gray-600'
                        }`} />
                        <div className={`h-1 flex-1 rounded ${
                          passwordStrength === 'strong' ? 'bg-green-500' : 'bg-gray-600'
                        }`} />
                      </div>
                      <p className={`text-xs ${
                        passwordStrength === 'weak' ? 'text-red-400' :
                        passwordStrength === 'medium' ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {passwordStrength === 'weak' && '약함 - 더 긴 비밀번호와 특수문자를 추가하세요'}
                        {passwordStrength === 'medium' && '보통 - 특수문자를 추가하면 더 안전합니다'}
                        {passwordStrength === 'strong' && '강함 - 안전한 비밀번호입니다!'}
                      </p>
                    </div>
                  )}
                </div>

                {/* 로그인 시도 횟수 경고 */}
                {mode === 'login' && loginAttempts > 0 && loginAttempts < MAX_LOGIN_ATTEMPTS && (
                  <p className="text-yellow-400 text-xs text-center">
                    로그인 시도 {loginAttempts}/{MAX_LOGIN_ATTEMPTS} - {MAX_LOGIN_ATTEMPTS - loginAttempts}회 남음
                  </p>
                )}

                <Button type="submit" className="w-full" disabled={loading || isLockedOut}>
                  {loading ? '처리 중...' :
                   isLockedOut ? `${Math.ceil(remainingLockoutTime / 60)}분 후 시도 가능` :
                   mode === 'login' ? '로그인' : '가입하기'}
                </Button>
              </form>
            )}

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
