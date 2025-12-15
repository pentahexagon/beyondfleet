export default function CommunitySection() {
    return (
        <section className="py-20 px-4 bg-[#1a0a2e]">
            <div className="max-w-4xl mx-auto text-center">
                <div className="text-8xl mb-8 animate-float">
                    🦦💬🦦
                </div>
                <h2 className="font-comic text-4xl md:text-5xl font-bold text-white mb-6">
                    혼자보다 함께!
                </h2>
                <p className="font-gaegu text-2xl text-cyan-400 mb-4">
                    "손 잡고 뜨면 안 잃어요" 🤝
                </p>
                <p className="font-gaegu text-lg text-gray-400 max-w-2xl mx-auto mb-10">
                    수달은 잘 때 손을 잡고 자요. 떠내려가지 않게요.
                    <br />
                    우리도 마찬가지예요. 함께하면 흔들리지 않아요!
                </p>

                <div className="flex flex-wrap justify-center gap-4">
                    <a
                        href="https://t.me/beyondfleet"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="glass px-8 py-4 rounded-full hover:bg-blue-500/20 transition-colors flex items-center gap-3 hover-bounce"
                    >
                        <span className="text-3xl">📱</span>
                        <span className="font-comic text-white font-bold text-lg">Telegram</span>
                    </a>
                    <a
                        href="https://twitter.com/beyondfleet"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="glass px-8 py-4 rounded-full hover:bg-blue-400/20 transition-colors flex items-center gap-3 hover-bounce"
                    >
                        <span className="text-3xl">𝕏</span>
                        <span className="font-comic text-white font-bold text-lg">Twitter</span>
                    </a>
                    <a
                        href="https://discord.gg/beyondfleet"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="glass px-8 py-4 rounded-full hover:bg-purple-500/20 transition-colors flex items-center gap-3 hover-bounce"
                    >
                        <span className="text-3xl">💬</span>
                        <span className="font-comic text-white font-bold text-lg">Discord</span>
                    </a>
                </div>
            </div>
        </section>
    )
}
