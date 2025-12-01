import Button from '@/components/ui/Button'

export default function GivingPage() {
  const pastDonations = [
    {
      id: 1,
      title: '어린이 코딩 교육 지원',
      amount: '50 SOL',
      date: '2024.12',
      status: 'completed',
      votes: 245,
    },
    {
      id: 2,
      title: '청년 창업 지원 기금',
      amount: '30 SOL',
      date: '2024.11',
      status: 'completed',
      votes: 189,
    },
  ]

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-5xl mb-4 block">🎁</span>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            기부 현황
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            BeyondFleet 멤버십 수익의 일부는 사회에 환원됩니다.
            NFT 보유자의 투표로 기부처가 결정되며, 모든 내역은 투명하게 공개됩니다.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="glass rounded-xl p-6 text-center">
            <p className="text-gray-400 text-sm mb-2">총 기부 풀</p>
            <p className="text-3xl font-bold gradient-text">-- SOL</p>
            <p className="text-gray-500 text-xs mt-2">≈ $--,---</p>
          </div>

          <div className="glass rounded-xl p-6 text-center">
            <p className="text-gray-400 text-sm mb-2">진행중인 투표</p>
            <p className="text-3xl font-bold text-cyan-400">0건</p>
            <p className="text-gray-500 text-xs mt-2">다음 투표 준비 중</p>
          </div>

          <div className="glass rounded-xl p-6 text-center">
            <p className="text-gray-400 text-sm mb-2">완료된 기부</p>
            <p className="text-3xl font-bold text-green-400">2건</p>
            <p className="text-gray-500 text-xs mt-2">80 SOL 전달 완료</p>
          </div>
        </div>

        {/* Current Voting - Empty State */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-white mb-6">🗳️ 진행중인 투표</h2>
          <div className="glass rounded-xl p-8 text-center">
            <span className="text-4xl mb-4 block">📭</span>
            <p className="text-gray-400 mb-2">현재 진행중인 투표가 없습니다.</p>
            <p className="text-gray-500 text-sm">
              다음 투표가 시작되면 NFT 보유자에게 알림이 발송됩니다.
            </p>
          </div>
        </div>

        {/* Past Donations */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-white mb-6">📋 기부 내역</h2>
          <div className="space-y-4">
            {pastDonations.map((donation) => (
              <div key={donation.id} className="glass rounded-xl p-6 card-hover">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                        완료
                      </span>
                      <span className="text-gray-500 text-sm">{donation.date}</span>
                    </div>
                    <h3 className="text-lg font-medium text-white">{donation.title}</h3>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-gray-500 text-xs">기부액</p>
                      <p className="text-lg font-bold text-purple-400">{donation.amount}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500 text-xs">참여 투표</p>
                      <p className="text-lg font-bold text-cyan-400">{donation.votes}표</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      상세 보기
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="glass rounded-2xl p-8">
          <h2 className="text-xl font-bold text-white mb-6 text-center">
            💡 기부 시스템 작동 방식
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '💰', title: '수익 적립', desc: 'NFT 판매 수익의 일부가 기부 풀에 적립됩니다.' },
              { icon: '📝', title: '후보 제안', desc: '커뮤니티에서 기부 후보를 제안합니다.' },
              { icon: '🗳️', title: '투표 진행', desc: 'NFT 보유자가 투표권으로 결정합니다.' },
              { icon: '✅', title: '기부 실행', desc: '선정된 곳에 기부하고 증빙을 공개합니다.' },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <span className="text-3xl mb-3 block">{step.icon}</span>
                <h3 className="text-white font-medium mb-2">{step.title}</h3>
                <p className="text-gray-400 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
