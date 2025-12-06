'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronUp } from 'lucide-react'

const sections = [
  { id: 'intro', title: '1. 서비스 소개' },
  { id: 'obligations', title: '2. 이용자 의무' },
  { id: 'usage', title: '3. 서비스 이용' },
  { id: 'nft', title: '4. NFT 멤버십' },
  { id: 'content', title: '5. 콘텐츠 권리' },
  { id: 'disclaimer', title: '6. 투자 면책조항' },
  { id: 'liability', title: '7. 책임 제한' },
  { id: 'dispute', title: '8. 분쟁 해결' },
  { id: 'changes', title: '9. 약관 변경' },
]

export default function TermsPage() {
  const [activeSection, setActiveSection] = useState('')
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300)

      const sectionElements = sections.map(s => ({
        id: s.id,
        element: document.getElementById(s.id)
      }))

      for (const section of sectionElements.reverse()) {
        if (section.element) {
          const rect = section.element.getBoundingClientRect()
          if (rect.top <= 100) {
            setActiveSection(section.id)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const offset = 80
      const top = element.getBoundingClientRect().top + window.scrollY - offset
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main className="min-h-screen py-20 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">이용약관</span>
          </h1>
          <p className="text-gray-400">
            마지막 업데이트: 2024년 12월 6일
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* 목차 (사이드바) */}
          <nav className="lg:w-64 flex-shrink-0">
            <div className="glass rounded-xl p-4 lg:sticky lg:top-24">
              <h2 className="text-white font-bold mb-4">목차</h2>
              <ul className="space-y-2">
                {sections.map((section) => (
                  <li key={section.id}>
                    <button
                      onClick={() => scrollToSection(section.id)}
                      className={`text-left text-sm w-full px-3 py-2 rounded-lg transition-colors ${
                        activeSection === section.id
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'text-gray-400 hover:text-white hover:bg-space-800'
                      }`}
                    >
                      {section.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          {/* 본문 */}
          <div className="flex-1 glass rounded-2xl p-6 md:p-8">
            <div className="prose prose-invert max-w-none">
              {/* 서비스 소개 */}
              <section id="intro" className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-4">1. 서비스 소개</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  BeyondFleet(이하 &quot;서비스&quot;)은 암호화폐 정보 제공 및 교육을 목적으로 하는 플랫폼입니다.
                  본 서비스는 시장 정보, 교육 콘텐츠, 커뮤니티 기능을 제공하며, NFT 기반 멤버십 시스템을 운영합니다.
                </p>
                <p className="text-gray-300 leading-relaxed">
                  본 약관에 동의함으로써 귀하는 서비스 이용에 관한 모든 조건을 이해하고 수락하는 것으로 간주됩니다.
                </p>
              </section>

              {/* 이용자 의무 */}
              <section id="obligations" className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-4">2. 이용자 의무</h2>
                <p className="text-gray-300 leading-relaxed mb-4">이용자는 다음 사항을 준수해야 합니다:</p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li><strong>정확한 정보 제공:</strong> 회원가입 시 정확하고 최신의 정보를 제공해야 합니다.</li>
                  <li><strong>타인 권리 침해 금지:</strong> 다른 이용자의 개인정보를 무단 수집하거나 명예를 훼손해서는 안 됩니다.</li>
                  <li><strong>불법 행위 금지:</strong> 서비스를 이용한 불법 행위, 사기, 자금세탁 등을 금지합니다.</li>
                  <li><strong>계정 보안:</strong> 본인 계정의 보안을 유지할 책임이 있습니다.</li>
                  <li><strong>서비스 방해 금지:</strong> 서비스의 정상적인 운영을 방해하는 행위를 금지합니다.</li>
                </ul>
              </section>

              {/* 서비스 이용 */}
              <section id="usage" className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-4">3. 서비스 이용</h2>

                <h3 className="text-xl font-semibold text-white mt-6 mb-3">3.1 회원가입</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  서비스 이용을 위해 이메일 또는 암호화폐 지갑을 통한 회원가입이 필요합니다.
                  만 18세 이상의 개인만 가입할 수 있습니다.
                </p>

                <h3 className="text-xl font-semibold text-white mt-6 mb-3">3.2 계정 관리</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  이용자는 본인 계정의 모든 활동에 대해 책임을 집니다.
                  계정 도용이나 보안 침해가 발생한 경우 즉시 서비스 운영팀에 알려야 합니다.
                </p>

                <h3 className="text-xl font-semibold text-white mt-6 mb-3">3.3 서비스 변경 및 중단</h3>
                <p className="text-gray-300 leading-relaxed">
                  BeyondFleet은 서비스의 일부 또는 전부를 변경, 중단할 권리를 보유합니다.
                  중대한 변경 시 사전에 공지하도록 노력하겠습니다.
                </p>
              </section>

              {/* NFT 멤버십 */}
              <section id="nft" className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-4">4. NFT 멤버십</h2>

                <h3 className="text-xl font-semibold text-white mt-6 mb-3">4.1 구매</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  NFT 멤버십은 Solana 또는 Ethereum 블록체인을 통해 구매할 수 있습니다.
                  구매 시 네트워크 수수료(가스비)가 발생할 수 있습니다.
                </p>

                <h3 className="text-xl font-semibold text-white mt-6 mb-3">4.2 환불 정책</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  블록체인 특성상 NFT 구매는 취소 및 환불이 불가능합니다.
                  구매 전 신중하게 검토해 주시기 바랍니다.
                </p>

                <h3 className="text-xl font-semibold text-white mt-6 mb-3">4.3 혜택 변경</h3>
                <p className="text-gray-300 leading-relaxed">
                  멤버십 등급별 혜택은 서비스 운영 상황에 따라 변경될 수 있습니다.
                  변경 시 사전에 공지됩니다.
                </p>
              </section>

              {/* 콘텐츠 권리 */}
              <section id="content" className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-4">5. 콘텐츠 권리</h2>

                <h3 className="text-xl font-semibold text-white mt-6 mb-3">5.1 저작권</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  서비스 내 모든 콘텐츠(텍스트, 이미지, 영상, 분석 리포트 등)는 BeyondFleet 또는
                  콘텐츠 제공자의 저작권으로 보호됩니다. 무단 복제, 배포, 상업적 이용을 금지합니다.
                </p>

                <h3 className="text-xl font-semibold text-white mt-6 mb-3">5.2 사용자 생성 콘텐츠</h3>
                <p className="text-gray-300 leading-relaxed">
                  이용자가 서비스 내에 게시한 콘텐츠에 대한 권리는 이용자에게 있으나,
                  BeyondFleet은 서비스 운영 목적으로 해당 콘텐츠를 사용할 수 있는 권리를 갖습니다.
                </p>
              </section>

              {/* 투자 면책조항 */}
              <section id="disclaimer" className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-4">6. 투자 면책조항</h2>
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                  <p className="text-red-400 font-bold text-lg mb-4">⚠️ 중요 안내</p>
                  <ul className="space-y-4 text-gray-300">
                    <li className="flex items-start gap-3">
                      <span className="text-red-400 mt-1">•</span>
                      <span><strong>정보 제공 목적:</strong> 본 플랫폼에서 제공하는 모든 정보는 교육 및 정보 제공 목적이며, 투자 조언이 아닙니다.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-red-400 mt-1">•</span>
                      <span><strong>투자 책임:</strong> 모든 투자 결정과 그에 따른 책임은 전적으로 본인에게 있습니다.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-red-400 mt-1">•</span>
                      <span><strong>변동성 위험:</strong> 암호화폐는 높은 가격 변동성을 가지며, 원금 전액 손실 위험이 있습니다.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-red-400 mt-1">•</span>
                      <span><strong>과거 성과:</strong> 과거의 성과가 미래의 수익을 보장하지 않습니다.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-red-400 mt-1">•</span>
                      <span><strong>전문가 상담:</strong> 투자 결정 전 자격을 갖춘 재정 전문가와 상담하시기 바랍니다.</span>
                    </li>
                  </ul>
                </div>
              </section>

              {/* 책임 제한 */}
              <section id="liability" className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-4">7. 책임 제한</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  BeyondFleet은 다음에 대해 책임을 지지 않습니다:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>서비스 오류, 중단, 지연으로 인한 직접적 또는 간접적 손해</li>
                  <li>이용자의 투자 결정으로 인한 금전적 손실</li>
                  <li>제3자 웹사이트 또는 서비스 링크 이용으로 인한 손해</li>
                  <li>해킹, 바이러스 등 보안 사고로 인한 정보 유출 (합리적 보안 조치를 취한 경우)</li>
                  <li>천재지변, 전쟁, 테러 등 불가항력적 사유로 인한 서비스 중단</li>
                </ul>
              </section>

              {/* 분쟁 해결 */}
              <section id="dispute" className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-4">8. 분쟁 해결</h2>

                <h3 className="text-xl font-semibold text-white mt-6 mb-3">8.1 준거법</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  본 약관은 대한민국 법률에 따라 해석되고 적용됩니다.
                  국제 이용자의 경우 호주 법률이 적용될 수 있습니다.
                </p>

                <h3 className="text-xl font-semibold text-white mt-6 mb-3">8.2 관할 법원</h3>
                <p className="text-gray-300 leading-relaxed">
                  서비스 이용과 관련된 분쟁은 서울중앙지방법원 또는 호주 시드니 법원을
                  제1심 관할 법원으로 합니다.
                </p>
              </section>

              {/* 약관 변경 */}
              <section id="changes" className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">9. 약관 변경</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  BeyondFleet은 필요한 경우 본 약관을 변경할 수 있습니다.
                  변경 사항은 다음 방법으로 공지됩니다:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>서비스 내 공지사항 게시</li>
                  <li>등록된 이메일로 통지 (중대한 변경의 경우)</li>
                  <li>본 페이지 업데이트</li>
                </ul>
                <p className="text-gray-300 leading-relaxed mt-4">
                  변경된 약관에 동의하지 않는 경우 서비스 이용을 중단하고 회원 탈퇴할 수 있습니다.
                </p>
              </section>

              {/* 문의 */}
              <div className="border-t border-purple-500/20 pt-8">
                <p className="text-gray-400">
                  약관에 대한 문의: <a href="mailto:coinkim00@gmail.com" className="text-cyan-400 hover:underline">coinkim00@gmail.com</a>
                </p>
                <p className="text-gray-500 mt-4">
                  <Link href="/privacy" className="text-purple-400 hover:underline">개인정보처리방침</Link> 도 함께 확인해 주세요.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 스크롤 탑 버튼 */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 w-12 h-12 bg-purple-600 hover:bg-purple-500 rounded-full flex items-center justify-center shadow-lg transition-all z-50"
          >
            <ChevronUp className="w-6 h-6 text-white" />
          </button>
        )}

        <div className="h-20" />
      </div>
    </main>
  )
}
