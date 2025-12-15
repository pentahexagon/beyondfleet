export default function FooterSection() {
    return (
        <footer className="py-10 px-4 border-t border-purple-500/20 bg-[#0a0a1a]">
            <div className="max-w-4xl mx-auto text-center">
                <p className="font-comic text-3xl font-bold text-white mb-4">
                    To the Moon! 🌙
                </p>
                <p className="font-gaegu text-xl gradient-text mb-4">
                    개미는 땅을 파고, 우리는 우주를 판다 🦦🚀
                </p>
                <p className="font-comic text-gray-500 text-sm">
                    © 2024 BeyondFleet. 부자의 항해를 응원합니다.
                </p>

                {/* Fun doge-style text */}
                <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm font-comic">
                    <span className="text-cyan-400">much journey</span>
                    <span className="text-purple-400">very wealth</span>
                    <span className="text-yellow-400">such moon</span>
                    <span className="text-pink-400">wow</span>
                </div>
            </div>
        </footer>
    )
}
