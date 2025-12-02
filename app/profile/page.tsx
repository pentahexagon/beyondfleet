'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount, useDisconnect } from 'wagmi'
import { useWallet } from '@solana/wallet-adapter-react'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { supabase } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import { MEMBERSHIP_TIERS, MembershipTier } from '@/types'

interface Profile {
  id: string
  email: string
  username: string | null
  membership_tier: MembershipTier
  vote_power: number
  eth_wallet: string | null
  sol_wallet: string | null
  created_at: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [linking, setLinking] = useState(false)

  // Ethereum
  const { address: ethAddress, isConnected: isEthConnected } = useAccount()
  const { openConnectModal } = useConnectModal()
  const { disconnect: disconnectEth } = useDisconnect()

  // Solana
  const { publicKey, connected: isSolConnected, disconnect: disconnectSol } = useWallet()
  const { setVisible: setSolanaModalVisible } = useWalletModal()

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(profileData)
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const linkWallet = async (type: 'ethereum' | 'solana', address: string) => {
    if (!profile) return

    setLinking(true)
    try {
      const field = type === 'ethereum' ? 'eth_wallet' : 'sol_wallet'

      const { error } = await supabase
        .from('profiles')
        .update({ [field]: address })
        .eq('id', profile.id)

      if (error) throw error

      setProfile({ ...profile, [field]: address })
    } catch (error) {
      console.error('Error linking wallet:', error)
      alert('지갑 연결에 실패했습니다.')
    } finally {
      setLinking(false)
    }
  }

  const unlinkWallet = async (type: 'ethereum' | 'solana') => {
    if (!profile) return

    setLinking(true)
    try {
      const field = type === 'ethereum' ? 'eth_wallet' : 'sol_wallet'

      const { error } = await supabase
        .from('profiles')
        .update({ [field]: null })
        .eq('id', profile.id)

      if (error) throw error

      setProfile({ ...profile, [field]: null })

      // Disconnect wallet
      if (type === 'ethereum') disconnectEth()
      else disconnectSol()
    } catch (error) {
      console.error('Error unlinking wallet:', error)
    } finally {
      setLinking(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">프로필을 찾을 수 없습니다.</p>
      </div>
    )
  }

  const tierInfo = MEMBERSHIP_TIERS[profile.membership_tier]

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">{tierInfo.icon}</div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {profile.username || '사용자'}
          </h1>
          <p className={`text-lg font-medium bg-gradient-to-r ${tierInfo.color} bg-clip-text text-transparent`}>
            {tierInfo.name} ({tierInfo.nameKr})
          </p>
        </div>

        {/* Profile Info */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Info */}
          <div className="glass rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">기본 정보</h2>
            <div className="space-y-4">
              <div>
                <p className="text-gray-400 text-sm">이메일</p>
                <p className="text-white">{profile.email}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">사용자명</p>
                <p className="text-white">{profile.username || '-'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">가입일</p>
                <p className="text-white">
                  {new Date(profile.created_at).toLocaleDateString('ko-KR')}
                </p>
              </div>
            </div>
          </div>

          {/* Membership Info */}
          <div className="glass rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">멤버십</h2>
            <div className="space-y-4">
              <div>
                <p className="text-gray-400 text-sm">현재 등급</p>
                <p className="text-white flex items-center gap-2">
                  <span>{tierInfo.icon}</span>
                  <span>{tierInfo.name}</span>
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">투표권</p>
                <p className="text-white font-bold text-2xl">{profile.vote_power}표</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-2">혜택</p>
                <ul className="space-y-1">
                  {tierInfo.benefits.map((benefit, i) => (
                    <li key={i} className="text-gray-300 text-sm flex items-center gap-2">
                      <span className="text-green-400">✓</span>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Wallet Connections */}
        <div className="mt-6 glass rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">🔗 연결된 지갑</h2>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Ethereum Wallet */}
            <div className="bg-space-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg"
                    alt="Ethereum"
                    className="w-6 h-6"
                  />
                  <span className="text-white font-medium">Ethereum</span>
                </div>
                {profile.eth_wallet && (
                  <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full">
                    연결됨
                  </span>
                )}
              </div>

              {profile.eth_wallet ? (
                <div>
                  <p className="text-gray-400 text-xs font-mono break-all mb-3">
                    {profile.eth_wallet}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => unlinkWallet('ethereum')}
                    disabled={linking}
                  >
                    연결 해제
                  </Button>
                </div>
              ) : (
                <div>
                  <p className="text-gray-500 text-sm mb-3">연결된 지갑이 없습니다</p>
                  {isEthConnected && ethAddress ? (
                    <Button
                      size="sm"
                      onClick={() => linkWallet('ethereum', ethAddress)}
                      disabled={linking}
                    >
                      {linking ? '연결 중...' : `${ethAddress.slice(0, 6)}... 연결하기`}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openConnectModal?.()}
                    >
                      지갑 연결
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Solana Wallet */}
            <div className="bg-space-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <img
                    src="https://phantom.app/img/phantom-icon-purple.svg"
                    alt="Solana"
                    className="w-6 h-6"
                  />
                  <span className="text-white font-medium">Solana</span>
                </div>
                {profile.sol_wallet && (
                  <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full">
                    연결됨
                  </span>
                )}
              </div>

              {profile.sol_wallet ? (
                <div>
                  <p className="text-gray-400 text-xs font-mono break-all mb-3">
                    {profile.sol_wallet}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => unlinkWallet('solana')}
                    disabled={linking}
                  >
                    연결 해제
                  </Button>
                </div>
              ) : (
                <div>
                  <p className="text-gray-500 text-sm mb-3">연결된 지갑이 없습니다</p>
                  {isSolConnected && publicKey ? (
                    <Button
                      size="sm"
                      onClick={() => linkWallet('solana', publicKey.toBase58())}
                      disabled={linking}
                    >
                      {linking ? '연결 중...' : `${publicKey.toBase58().slice(0, 6)}... 연결하기`}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSolanaModalVisible(true)}
                    >
                      지갑 연결
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-center gap-4">
          <Button variant="outline" onClick={() => router.push('/membership')}>
            멤버십 업그레이드
          </Button>
        </div>
      </div>
    </div>
  )
}
