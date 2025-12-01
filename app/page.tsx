import Link from 'next/link'
import { getMarketData } from '@/lib/coingecko'
import PriceCard from '@/components/crypto/PriceCard'
import Button from '@/components/ui/Button'
import { MEMBERSHIP_TIERS } from '@/types'

export const revalidate = 60 // Revalidate every 60 seconds

async function getTopCoins() {
  try {
    return await getMarketData(1, 10)
  } catch (error) {
    console.error('Failed to fetch coins:', error)
    return []
  }
}

export default async function Home() {
  const topCoins = await getTopCoins()

  const missions = [
    {
      icon: '📚',
      title: '함께 배움',
      description: '초보부터 전문가까지, 단계별 암호화폐 교육 콘텐츠를 제공합니다.',
    },
    {
      icon: '🤝',
      title: '함께 나눔',
      description: 'NFT 멤버십 수익의 일부를 사회에 환원합니다. 투표로 기부처를 결정합니다.',
    },
    {
      icon: '☕',
      title: '함께 쉼',
      description: '건강한 투자 문화를 위해, 때로는 쉬어가는 것도 전략입니다.',
    },
  ]

  return (
    <div className="stars">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-purple-900/20 via-transparent to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-float">
            <span className="text-6xl mb-6 block">🚀</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6">
            <span className="gradient-text">Beyond The Stars</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 mb-4">
            함께 가면 멀리 간다
          </p>

          <p className="text-gray-400 max-w-2xl mx-auto mb-8">
            BeyondFleet과 함께 암호화폐의 새로운 항해를 시작하세요.
            실시간 시세, 교육 콘텐츠, NFT 멤버십, 그리고 투명한 기부 시스템까지.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg">항해 시작하기</Button>
            </Link>
            <Link href="/prices">
              <Button variant="outline" size="lg">
                실시간 시세 보기
              </Button>
            </Link>
          </div>
        </div>

        {/* Floating elements */}
        <div className="absolute top-20 left-10 text-4xl animate-pulse opacity-30">⭐</div>
        <div className="absolute top-40 right-20 text-3xl animate-pulse opacity-20 delay-300">✨</div>
        <div className="absolute bottom-40 left-20 text-2xl animate-pulse opacity-25 delay-500">🌟</div>
        <div className="absolute bottom-20 right-10 text-4xl animate-pulse opacity-20 delay-700">💫</div>
      </section>

      {/* Live Prices Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                실시간 시세
              </h2>
              <p className="text-gray-400">상위 10개 암호화폐</p>
            </div>
            <Link href="/prices">
              <Button variant="ghost">
                전체 보기 →
              </Button>
            </Link>
          </div>

          {topCoins.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {topCoins.slice(0, 10).map((coin) => (
                <PriceCard key={coin.id} coin={coin} />
              ))}
            </div>
          ) : (
            <div className="glass rounded-xl p-8 text-center">
              <p className="text-gray-400">시세 데이터를 불러오는 중...</p>
            </div>
          )}
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-purple-900/10 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              우리의 미션
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              BeyondFleet은 단순한 시세 플랫폼이 아닙니다.
              건강한 암호화폐 생태계를 위한 커뮤니티입니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {missions.map((mission, index) => (
              <div
                key={index}
                className="glass rounded-xl p-6 text-center card-hover"
              >
                <span className="text-4xl mb-4 block">{mission.icon}</span>
                <h3 className="text-xl font-bold text-white mb-2">{mission.title}</h3>
                <p className="text-gray-400">{mission.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Membership Preview */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              NFT 멤버십
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              등급별 특별한 혜택과 투표권을 제공합니다.
              함대의 일원이 되어 함께 결정하세요.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.values(MEMBERSHIP_TIERS).map((tier) => (
              <div
                key={tier.tier}
                className="glass rounded-xl p-4 text-center card-hover"
              >
                <span className="text-3xl mb-2 block">{tier.icon}</span>
                <h3 className="text-lg font-bold text-white">{tier.name}</h3>
                <p className="text-gray-400 text-sm">{tier.nameKr}</p>
                <div className="mt-3 pt-3 border-t border-purple-500/20">
                  <p className="text-xs text-gray-500">투표권</p>
                  <p className={`text-lg font-bold bg-gradient-to-r ${tier.color} bg-clip-text text-transparent`}>
                    {tier.votePower}표
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/membership">
              <Button variant="secondary" size="lg">
                멤버십 자세히 보기
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Donation Preview */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-cyan-900/10 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="glass rounded-2xl p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-4xl mb-4 block">🎁</span>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                  투명한 기부 시스템
                </h2>
                <p className="text-gray-400 mb-6">
                  멤버십 수익의 일부는 사회에 환원됩니다.
                  NFT 보유자들의 투표로 기부처를 결정하고,
                  모든 기부 내역은 블록체인에 투명하게 기록됩니다.
                </p>
                <Link href="/giving">
                  <Button>기부 현황 보기</Button>
                </Link>
              </div>

              <div className="glass rounded-xl p-6">
                <div className="text-center">
                  <p className="text-gray-400 text-sm mb-2">총 기부 풀</p>
                  <p className="text-3xl md:text-4xl font-bold gradient-text mb-4">
                    --,--- SOL
                  </p>
                  <p className="text-gray-500 text-sm">
                    * Supabase 연동 후 실제 금액이 표시됩니다
                  </p>
                </div>

                <div className="mt-6 pt-6 border-t border-purple-500/20">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">진행중인 투표</span>
                    <span className="text-cyan-400">0건</span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-gray-400">완료된 기부</span>
                    <span className="text-green-400">0건</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            지금 항해를 시작하세요
          </h2>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
            BeyondFleet과 함께라면, 암호화폐 세계의 모든 여정이 더 즐거워집니다.
            무료 가입으로 기본 기능을 체험해보세요.
          </p>
          <Link href="/auth/signup">
            <Button size="lg" className="text-lg px-8 py-4">
              🚀 무료로 시작하기
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
