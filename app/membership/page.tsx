import Link from 'next/link'
import { MEMBERSHIP_TIERS } from '@/types'
import Button from '@/components/ui/Button'

export default function MembershipPage() {
  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            NFT 멤버십
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            BeyondFleet 함대의 일원이 되어 특별한 혜택과 투표권을 받으세요.
            등급이 높을수록 더 많은 혜택과 영향력을 가집니다.
          </p>
        </div>

        {/* Tiers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
          {Object.values(MEMBERSHIP_TIERS).map((tier, index) => (
            <div
              key={tier.tier}
              className={`glass rounded-2xl p-6 card-hover relative ${
                index === 4 ? 'border-2 border-purple-500/50' : ''
              }`}
            >
              {index === 4 && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-purple-600 to-cyan-500 rounded-full text-xs font-medium">
                  ULTIMATE
                </div>
              )}

              <div className="text-center">
                <span className="text-5xl mb-4 block">{tier.icon}</span>
                <h2 className="text-xl font-bold text-white">{tier.name}</h2>
                <p className="text-gray-400 text-sm mb-4">{tier.nameKr}</p>

                <div className={`inline-block px-4 py-2 rounded-full bg-gradient-to-r ${tier.color} bg-opacity-20 mb-6`}>
                  <span className="text-white font-bold">{tier.votePower}표</span>
                  <span className="text-gray-300 text-sm ml-1">투표권</span>
                </div>

                <ul className="space-y-2 mb-6 text-left">
                  {tier.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start text-sm text-gray-300">
                      <svg
                        className="w-4 h-4 mr-2 mt-0.5 text-green-400 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {benefit}
                    </li>
                  ))}
                </ul>

                <Button
                  variant={tier.tier === 'cadet' ? 'secondary' : 'primary'}
                  className="w-full"
                  disabled={tier.tier !== 'cadet'}
                >
                  {tier.tier === 'cadet' ? '무료 가입' : '준비 중'}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Info Section */}
        <div className="glass rounded-2xl p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold text-white mb-4">
                🔮 NFT 멤버십이란?
              </h3>
              <p className="text-gray-400 mb-4">
                BeyondFleet의 NFT 멤버십은 Solana 블록체인 기반의 디지털 회원권입니다.
                NFT를 소유하면 해당 등급의 모든 혜택을 이용할 수 있습니다.
              </p>
              <p className="text-gray-400">
                NFT는 양도 및 거래가 가능하며, 커뮤니티 내 투표권을 부여합니다.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white mb-4">
                🗳️ 투표권 시스템
              </h3>
              <p className="text-gray-400 mb-4">
                멤버십 수익의 일부는 사회 기부에 사용됩니다.
                NFT 보유자는 등급에 따른 투표권으로 기부처를 결정합니다.
              </p>
              <Link href="/giving">
                <Button variant="outline">기부 현황 보기 →</Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Coming Soon */}
        <div className="mt-12 text-center">
          <div className="glass rounded-xl p-6 inline-block">
            <p className="text-gray-400">
              <span className="text-cyan-400">🔜 곧 출시!</span>
              <br />
              Solana 지갑 연결 및 NFT 민팅이 곧 시작됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
