export default function StorySection() {
    return (
        <section className="py-20 px-4 bg-gradient-to-b from-[#0a1a2a] via-[#1a0a2e] to-[#0a0a1a]">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="font-comic text-4xl md:text-6xl font-bold text-white mb-4">
                        우리의 여정 🌟
                    </h2>
                    <p className="font-gaegu text-xl text-gray-400">
                        어제의 개미에서 내일의 우주인으로
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 md:gap-4">
                    {/* Step 1 - Yesterday */}
                    <div className="relative group">
                        <div className="glass rounded-3xl p-8 text-center card-bounce hover:bg-blue-500/10 border border-blue-500/20">
                            <div className="text-8xl md:text-9xl mb-6 group-hover:animate-wiggle">
                                🌊
                            </div>
                            <div className="inline-block px-4 py-2 bg-blue-500/20 rounded-full text-blue-400 font-comic text-lg font-bold mb-4">
                                어제의 나
                            </div>
                            <h3 className="font-gaegu text-2xl font-bold text-white mb-3">월급만 바라보던 개미 시절</h3>
                            <p className="font-gaegu text-xl text-gray-400">
                                "빠져나갈 수 없을 것 같았어요"
                            </p>
                        </div>
                        {/* Arrow */}
                        <div className="hidden md:block absolute top-1/2 -right-4 text-5xl text-purple-500/70 animate-pulse">
                            →
                        </div>
                    </div>

                    {/* Step 2 - Today */}
                    <div className="relative group">
                        <div className="glass rounded-3xl p-8 text-center card-bounce hover:bg-purple-500/10 border border-purple-500/20">
                            <div className="text-7xl md:text-8xl mb-6 group-hover:animate-wiggle">
                                🦦🦦🦦
                            </div>
                            <div className="inline-block px-4 py-2 bg-purple-500/20 rounded-full text-purple-400 font-comic text-lg font-bold mb-4">
                                오늘의 우리
                            </div>
                            <h3 className="font-gaegu text-2xl font-bold text-white mb-3">혼자가 아닌 함께</h3>
                            <p className="font-gaegu text-xl text-gray-400">
                                "배우고, 나누고, 성장합니다"
                            </p>
                        </div>
                        {/* Arrow */}
                        <div className="hidden md:block absolute top-1/2 -right-4 text-5xl text-purple-500/70 animate-pulse">
                            →
                        </div>
                    </div>

                    {/* Step 3 - Tomorrow */}
                    <div className="group">
                        <div className="glass rounded-3xl p-8 text-center card-bounce hover:bg-cyan-500/10 border-2 border-cyan-500/50 animate-pulse-glow">
                            <div className="text-8xl md:text-9xl mb-6 group-hover:animate-wiggle">
                                🚀
                            </div>
                            <div className="inline-block px-4 py-2 bg-cyan-500/20 rounded-full text-cyan-400 font-comic text-lg font-bold mb-4">
                                내일의 당신
                            </div>
                            <h3 className="font-gaegu text-2xl font-bold text-white mb-3">우주를 향한 비행</h3>
                            <p className="font-gaegu text-xl text-gray-400">
                                "재정적 자유, 이제 시작입니다"
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
