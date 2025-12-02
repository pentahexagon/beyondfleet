'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useWallet } from '@solana/wallet-adapter-react'
import { supabase } from '@/lib/supabase/client'
import AuthModal from '@/components/auth/AuthModal'
import Button from '@/components/ui/Button'

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authModalTab, setAuthModalTab] = useState<'web2' | 'web3'>('web2')
  const [user, setUser] = useState<{ email?: string; id?: string } | null>(null)

  // Web3 wallet states
  const { address: ethAddress, isConnected: isEthConnected } = useAccount()
  const { publicKey: solPublicKey, connected: isSolConnected } = useWallet()

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
    await supabase.auth.signOut()
    setUser(null)
  }

  const openAuthModal = (tab: 'web2' | 'web3' = 'web2') => {
    setAuthModalTab(tab)
    setIsAuthModalOpen(true)
  }

  const navLinks = [
    { href: '/', label: '홈' },
    { href: '/prices', label: '시세' },
    { href: '/membership', label: '멤버십' },
    { href: '/giving', label: '기부' },
    { href: '/learn', label: '교육' },
  ]

  const displayAddress = walletAddress
    ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
    : null

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl">🚀</span>
              <span className="text-xl font-bold gradient-text">BeyondFleet</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-gray-300 hover:text-white transition-colors duration-200 text-sm font-medium"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center space-x-3">
              {user ? (
                // Logged in state
                <div className="flex items-center space-x-3">
                  {isWalletConnected && (
                    <span className="text-xs text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded-full font-mono">
                      {displayAddress}
                    </span>
                  )}
                  <Link href="/profile">
                    <Button variant="ghost" size="sm">
                      프로필
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    로그아웃
                  </Button>
                </div>
              ) : (
                // Logged out state
                <>
                  {isWalletConnected ? (
                    <span className="text-xs text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded-full font-mono">
                      {displayAddress}
                    </span>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openAuthModal('web3')}
                    >
                      🔗 지갑 연결
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openAuthModal('web2')}
                  >
                    로그인
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => openAuthModal('web2')}
                  >
                    가입하기
                  </Button>
                </>
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
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-gray-300 hover:text-white transition-colors duration-200 text-sm font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="flex flex-col space-y-2 pt-4 border-t border-purple-500/20">
                  {user ? (
                    <>
                      <Link
                        href="/profile"
                        className="text-gray-300 hover:text-white text-sm"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        프로필
                      </Link>
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
                    <>
                      <button
                        onClick={() => {
                          openAuthModal('web3')
                          setIsMobileMenuOpen(false)
                        }}
                        className="text-left text-cyan-400 text-sm"
                      >
                        🔗 지갑 연결
                      </button>
                      <button
                        onClick={() => {
                          openAuthModal('web2')
                          setIsMobileMenuOpen(false)
                        }}
                        className="text-left text-gray-300 hover:text-white text-sm"
                      >
                        로그인
                      </button>
                      <Button
                        size="sm"
                        onClick={() => {
                          openAuthModal('web2')
                          setIsMobileMenuOpen(false)
                        }}
                      >
                        가입하기
                      </Button>
                    </>
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
