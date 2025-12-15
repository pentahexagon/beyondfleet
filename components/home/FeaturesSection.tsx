import Link from 'next/link'

export default function FeaturesSection() {
    return (
        <section className="py-20 px-4 bg-gradient-to-b from-[#0a0a1a] to-[#1a0a2e]">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="font-comic text-4xl md:text-5xl font-bold text-white mb-4">
                        뭘 할 수 있나요? 🤔
                    </h2>
                    <p className="font-gaegu text-xl text-gray-400">
                        BeyondFleet에서 제공하는 기능들
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Feature 1 */}
                    <Link href="/prices" className="group">
                        <div className="glass rounded-3xl p-6 h-full card-bounce hover:border-cyan-500/50 border border-transparent">
                            <div className="text-6xl mb-4 group-hover:animate-wiggle">📊</div>
                            <h3 className="font-comic text-xl font-bold text-white mb-2">실시간 시세</h3>
                            <p className="font-gaegu text-gray-400">
                                바이낸스 연동 실시간 가격!
                                <br />
                                관심 코인 알림까지 📱
                            </p>
                        </div>
                    </Link>

                    {/* Feature 2 */}
                    <Link href="/learn" className="group">
                        <div className="glass rounded-3xl p-6 h-full card-bounce hover:border-purple-500/50 border border-transparent">
                            <div className="text-6xl mb-4 group-hover:animate-wiggle">📚</div>
                            <h3 className="font-comic text-xl font-bold text-white mb-2">교육</h3>
                            <p className="font-gaegu text-gray-400">
                                초보부터 고급까지!
                                <br />
                                단계별 학습 콘텐츠 🎓
                            </p>
                        </div>
                    </Link>

                    {/* Feature 3 */}
                    <Link href="/nft" className="group">
                        <div className="glass rounded-3xl p-6 h-full card-bounce hover:border-yellow-500/50 border border-transparent">
                            <div className="text-6xl mb-4 group-hover:animate-wiggle">🎨</div>
                            <h3 className="font-comic text-xl font-bold text-white mb-2">NFT 멤버십</h3>
                            <p className="font-gaegu text-gray-400">
                                등급별 혜택과 투표권!
                                <br />
                                랜덤박스 & 경매 🎁
                            </p>
                        </div>
                    </Link>

                    {/* Feature 4 */}
                    <Link href="/giving" className="group">
                        <div className="glass rounded-3xl p-6 h-full card-bounce hover:border-green-500/50 border border-transparent">
                            <div className="text-6xl mb-4 group-hover:animate-wiggle">💝</div>
                            <h3 className="font-comic text-xl font-bold text-white mb-2">기부</h3>
                            <p className="font-gaegu text-gray-400">
                                투명한 기부 시스템!
                                <br />
                                커뮤니티 투표로 결정 🗳️
                            </p>
                        </div>
                    </Link>
                </div>
            </div>
        </section>
    )
}
