'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount, useDisconnect } from 'wagmi'
import { useWallet } from '@solana/wallet-adapter-react'
import { supabase } from '@/lib/supabase/client'
import AuthModal from '@/components/auth/AuthModal'
import Button from '@/components/ui/Button'
import { ChevronDown } from 'lucide-react'

export default function Header() {
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authModalTab, setAuthModalTab] = useState<'web2' | 'web3'>('web2')
  const [user, setUser] = useState<{ email?: string; id?: string } | null>(null)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  // Web3 wallet states
  const { address: ethAddress, isConnected: isEthConnected } = useAccount()
  const { disconnect: disconnectEth } = useDisconnect()
  const { publicKey: solPublicKey, connected: isSolConnected, disconnect: disconnectSol } = useWallet()

  const isWalletConnected = isEthConnected || isSolConnected
  const walletAddress = ethAddress || solPublicKey?.toBase58()

  useEffect(() => {
    // Check current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    try {
      // 1. 로컬 상태 먼저 초기화
      setUser(null)

      // 2. 지갑 연결 해제 (ETH)
      if (isEthConnected) {
        try {
          disconnectEth()
        } catch (e) {
          console.error('ETH disconnect error:', e)
        }
      }

      // 3. 지갑 연결 해제 (SOL)
      if (isSolConnected) {
        try {
          await disconnectSol()
        } catch (e) {
          console.error('SOL disconnect error:', e)
        }
      }

      // 4. 로컬 스토리지 완전 정리 (Supabase signOut 전에 수행)
      if (typeof window !== 'undefined') {
        // 지갑 관련
        localStorage.removeItem('walletconnect')
        localStorage.removeItem('wagmi.wallet')
        localStorage.removeItem('wagmi.connected')
        localStorage.removeItem('wagmi.account')
        localStorage.removeItem('wagmi.store')
        localStorage.removeItem('walletName')

        // Supabase 관련 (sb-로 시작하는 모든 키 삭제)
        const keysToRemove: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && (key.startsWith('sb-') || key.startsWith('supabase'))) {
            keysToRemove.push(key)
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key))

        // 세션 스토리지도 정리
        sessionStorage.clear()
      }

      // 5. Supabase 로그아웃 (local scope - 현재 브라우저만)
      await supabase.auth.signOut({ scope: 'local' })

      // 6. 강제 페이지 새로고침으로 완전 초기화
      window.location.replace('/')
    } catch (error) {
      console.error('Logout error:', error)
      // 에러가 나도 스토리지 정리 후 강제 새로고침
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }
      setUser(null)
      window.location.replace('/')
    }
  }

  const openAuthModal = (tab: 'web2' | 'web3' = 'web2') => {
    setAuthModalTab(tab)
    setIsAuthModalOpen(true)
  }

  // 메뉴 순서: 홈, 시세, 레이더, 도전일지, NFT, 멤버십, 정보, 정착지
  const navLinks = [
    { href: '/', label: '홈' },
    { href: '/prices', label: '시세' },
    { href: '/cosmic-radar', label: '레이더', icon: '💎', premium: true },
    { href: '/journal', label: '도전일지', icon: '📝' },
    {
      label: 'NFT',
      dropdown: [
        { href: '/nft/auction', label: '옥션' },
        { href: '/nft/randombox', label: '랜덤박스' },
        { href: '/giving', label: '기부' },
      ]
    },
    { href: '/membership', label: '멤버십' },
    {
      label: '정보',
      dropdown: [
        { href: '/news', label: '뉴스' },
        { href: '/learn', label: '교육' },
      ]
    },
    { href: '/roadmap', label: '정착지', icon: '🗺️' },
  ]

  // 표시할 주소/이메일 결정
  const getDisplayName = () => {
    if (walletAddress) {
      return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    }
    if (user?.email) {
      // 이메일이 지갑 주소 형식이면 주소 표시
      if (user.email.includes('@wallet.')) {
        const addr = user.email.split('@')[0]
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`
      }
      return user.email.split('@')[0]
    }
    return null
  }

  const displayName = getDisplayName()

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl">🚀</span>
              <span
                className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent"
                style={{ fontFamily: "'Comic Neue', cursive" }}
              >
                BeyondFleet
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              {navLinks.map((link, index) => (
                'dropdown' in link ? (
                  // 드롭다운 메뉴
                  <div
                    key={link.label}
                    className="relative"
                    onMouseEnter={() => setOpenDropdown(link.label)}
                    onMouseLeave={() => setOpenDropdown(null)}
                  >
                    <button
                      className="text-gray-300 hover:text-white transition-colors duration-200 text-sm flex items-center gap-1 font-comic"
                    >
                      {link.label}
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    {openDropdown === link.label && link.dropdown && (
                      <div className="absolute top-full left-0 mt-2 w-32 glass rounded-lg py-2 shadow-xl border border-purple-500/20">
                        {link.dropdown.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-purple-500/20 transition-colors font-comic"
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  // 일반 링크
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-gray-300 hover:text-white transition-colors duration-200 text-sm font-comic ${
                      link.icon ? 'flex items-center gap-1' : ''
                    }`}
                  >
                    {link.icon && <span>{link.icon}</span>}
                    {link.label}
                  </Link>
                )
              ))}
            </div>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center space-x-3">
              {user || isWalletConnected ? (
                // 로그인 상태
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-cyan-400 bg-cyan-400/10 px-3 py-1.5 rounded-full font-mono">
                    {displayName}
                  </span>
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    로그아웃
                  </Button>
                </div>
              ) : (
                // 로그인 전
                <Button size="sm" onClick={() => openAuthModal('web2')}>
                  로그인
                </Button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-gray-300 hover:text-white"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-purple-500/20">
              <div className="flex flex-col space-y-4">
                {navLinks.map((link) => (
                  'dropdown' in link && link.dropdown ? (
                    // 드롭다운 메뉴 (모바일)
                    <div key={link.label} className="space-y-2">
                      <span className="text-gray-400 text-sm font-comic">{link.label}</span>
                      <div className="pl-4 space-y-2">
                        {link.dropdown.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="block text-gray-300 hover:text-white transition-colors duration-200 text-sm font-comic"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`text-gray-300 hover:text-white transition-colors duration-200 text-sm font-comic ${
                        link.icon ? 'flex items-center gap-1' : ''
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.icon && <span>{link.icon}</span>}
                      {link.label}
                    </Link>
                  )
                ))}
                <div className="flex flex-col space-y-2 pt-4 border-t border-purple-500/20">
                  {user || isWalletConnected ? (
                    <>
                      <span className="text-cyan-400 text-sm font-mono">
                        {displayName}
                      </span>
                      <button
                        onClick={() => {
                          handleLogout()
                          setIsMobileMenuOpen(false)
                        }}
                        className="text-left text-gray-300 hover:text-white text-sm"
                      >
                        로그아웃
                      </button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => {
                        openAuthModal('web2')
                        setIsMobileMenuOpen(false)
                      }}
                    >
                      로그인
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultTab={authModalTab}
      />
    </>
  )
}
