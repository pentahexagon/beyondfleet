'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronUp } from 'lucide-react'

const sections = [
  { id: 'collection', title: '1. 수집하는 정보' },
  { id: 'purpose', title: '2. 수집 목적' },
  { id: 'retention', title: '3. 보관 기간' },
  { id: 'sharing', title: '4. 제3자 제공' },
  { id: 'cookies', title: '5. 쿠키 사용' },
  { id: 'rights', title: '6. 이용자 권리' },
  { id: 'security', title: '7. 보안 조치' },
  { id: 'contact', title: '8. 연락처' },
]

export default function PrivacyPage() {
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
            <span className="gradient-text">개인정보처리방침</span>
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
              {/* 서문 */}
              <div className="mb-8 pb-8 border-b border-purple-500/20">
                <p className="text-gray-300 leading-relaxed">
                  BeyondFleet(이하 &quot;회사&quot;)은 이용자의 개인정보를 중요시하며,
                  「개인정보 보호법」 등 관련 법령을 준수합니다.
                  본 개인정보처리방침은 회사가 수집하는 개인정보의 항목, 수집 목적, 보관 기간,
                  이용자 권리 등을 안내합니다.
                </p>
              </div>

              {/* 수집하는 정보 */}
              <section id="collection" className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-4">1. 수집하는 정보</h2>

                <h3 className="text-xl font-semibold text-white mt-6 mb-3">1.1 필수 수집 정보</h3>
                <div className="bg-space-800 rounded-xl p-4 mb-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-purple-500/20">
                        <th className="text-left py-2 text-gray-400">항목</th>
                        <th className="text-left py-2 text-gray-400">수집 시점</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-300">
                      <tr className="border-b border-purple-500/10">
                        <td className="py-2">이메일 주소</td>
                        <td className="py-2">회원가입</td>
                      </tr>
                      <tr className="border-b border-purple-500/10">
                        <td className="py-2">암호화폐 지갑 주소</td>
                        <td className="py-2">지갑 연결</td>
                      </tr>
                      <tr>
                        <td className="py-2">비밀번호 (암호화 저장)</td>
                        <td className="py-2">회원가입</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h3 className="text-xl font-semibold text-white mt-6 mb-3">1.2 자동 수집 정보</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>서비스 이용 기록 (접속 일시, 이용 페이지)</li>
                  <li>접속 로그 (IP 주소, 브라우저 종류)</li>
                  <li>기기 정보 (운영체제, 기기 유형)</li>
                  <li>쿠키 및 유사 기술을 통한 정보</li>
                </ul>

                <h3 className="text-xl font-semibold text-white mt-6 mb-3">1.3 선택 수집 정보</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>프로필 사진</li>
                  <li>닉네임</li>
                  <li>알림 설정 정보</li>
                </ul>
              </section>

              {/* 수집 목적 */}
              <section id="purpose" className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-4">2. 수집 목적</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  수집된 개인정보는 다음 목적으로만 이용됩니다:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-space-800 rounded-xl p-4">
                    <h4 className="text-cyan-400 font-medium mb-2">서비스 제공</h4>
                    <ul className="text-gray-300 text-sm space-y-1">
                      <li>• 회원 식별 및 인증</li>
                      <li>• 맞춤형 콘텐츠 제공</li>
                      <li>• 서비스 이용 기록 관리</li>
                    </ul>
                  </div>
                  <div className="bg-space-800 rounded-xl p-4">
                    <h4 className="text-purple-400 font-medium mb-2">멤버십 관리</h4>
                    <ul className="text-gray-300 text-sm space-y-1">
                      <li>• NFT 멤버십 등급 관리</li>
                      <li>• 멤버십 혜택 제공</li>
                      <li>• 투표권 관리</li>
                    </ul>
                  </div>
                  <div className="bg-space-800 rounded-xl p-4">
                    <h4 className="text-green-400 font-medium mb-2">고객 지원</h4>
                    <ul className="text-gray-300 text-sm space-y-1">
                      <li>• 문의 응답</li>
                      <li>• 공지사항 전달</li>
                      <li>• 서비스 개선 안내</li>
                    </ul>
                  </div>
                  <div className="bg-space-800 rounded-xl p-4">
                    <h4 className="text-amber-400 font-medium mb-2">서비스 개선</h4>
                    <ul className="text-gray-300 text-sm space-y-1">
                      <li>• 이용 통계 분석</li>
                      <li>• 신규 기능 개발</li>
                      <li>• 서비스 품질 향상</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* 보관 기간 */}
              <section id="retention" className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-4">3. 보관 기간</h2>

                <h3 className="text-xl font-semibold text-white mt-6 mb-3">3.1 원칙</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  개인정보는 수집 목적이 달성된 후 지체 없이 파기합니다.
                  회원 탈퇴 시 해당 회원의 개인정보는 즉시 삭제됩니다.
                </p>

                <h3 className="text-xl font-semibold text-white mt-6 mb-3">3.2 법적 보관 의무</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  관련 법령에 따라 일정 기간 보관이 필요한 정보:
                </p>
                <div className="bg-space-800 rounded-xl p-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-purple-500/20">
                        <th className="text-left py-2 text-gray-400">정보 유형</th>
                        <th className="text-left py-2 text-gray-400">보관 기간</th>
                        <th className="text-left py-2 text-gray-400">근거 법령</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-300">
                      <tr className="border-b border-purple-500/10">
                        <td className="py-2">계약/청약철회 기록</td>
                        <td className="py-2">5년</td>
                        <td className="py-2">전자상거래법</td>
                      </tr>
                      <tr className="border-b border-purple-500/10">
                        <td className="py-2">대금결제 기록</td>
                        <td className="py-2">5년</td>
                        <td className="py-2">전자상거래법</td>
                      </tr>
                      <tr className="border-b border-purple-500/10">
                        <td className="py-2">소비자 불만 처리 기록</td>
                        <td className="py-2">3년</td>
                        <td className="py-2">전자상거래법</td>
                      </tr>
                      <tr>
                        <td className="py-2">접속 로그</td>
                        <td className="py-2">3개월</td>
                        <td className="py-2">통신비밀보호법</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* 제3자 제공 */}
              <section id="sharing" className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-4">4. 제3자 제공</h2>

                <h3 className="text-xl font-semibold text-white mt-6 mb-3">4.1 원칙</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다.
                </p>

                <h3 className="text-xl font-semibold text-white mt-6 mb-3">4.2 예외</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  다음의 경우에 한해 개인정보가 제공될 수 있습니다:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>이용자가 사전에 동의한 경우</li>
                  <li>법령에 의해 제공 의무가 있는 경우</li>
                  <li>수사기관의 적법한 요청이 있는 경우</li>
                  <li>통계 작성, 학술 연구 목적으로 특정 개인을 식별할 수 없는 형태로 제공하는 경우</li>
                </ul>
              </section>

              {/* 쿠키 사용 */}
              <section id="cookies" className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-4">5. 쿠키 사용</h2>

                <h3 className="text-xl font-semibold text-white mt-6 mb-3">5.1 쿠키란?</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  쿠키는 웹사이트가 이용자의 브라우저에 저장하는 작은 텍스트 파일입니다.
                  서비스 이용 편의성 향상을 위해 사용됩니다.
                </p>

                <h3 className="text-xl font-semibold text-white mt-6 mb-3">5.2 사용 목적</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>로그인 상태 유지</li>
                  <li>이용자 설정 저장 (다크 모드 등)</li>
                  <li>서비스 이용 통계 분석</li>
                </ul>

                <h3 className="text-xl font-semibold text-white mt-6 mb-3">5.3 쿠키 거부 방법</h3>
                <p className="text-gray-300 leading-relaxed">
                  브라우저 설정에서 쿠키를 거부할 수 있습니다.
                  단, 쿠키를 거부할 경우 일부 서비스 이용에 제한이 있을 수 있습니다.
                </p>
                <div className="bg-space-800 rounded-xl p-4 mt-4">
                  <p className="text-sm text-gray-400">
                    <strong>Chrome:</strong> 설정 → 개인정보 및 보안 → 쿠키 및 기타 사이트 데이터<br />
                    <strong>Safari:</strong> 환경설정 → 개인 정보 보호 → 쿠키 및 웹 사이트 데이터 관리<br />
                    <strong>Firefox:</strong> 설정 → 개인 정보 및 보안 → 쿠키 및 사이트 데이터
                  </p>
                </div>
              </section>

              {/* 이용자 권리 */}
              <section id="rights" className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-4">6. 이용자 권리</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  이용자는 언제든지 다음 권리를 행사할 수 있습니다:
                </p>

                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-cyan-500/10 to-transparent border-l-4 border-cyan-500 pl-4 py-3">
                    <h4 className="text-cyan-400 font-medium">열람권</h4>
                    <p className="text-gray-300 text-sm">본인의 개인정보 처리 현황을 열람할 수 있습니다.</p>
                  </div>
                  <div className="bg-gradient-to-r from-purple-500/10 to-transparent border-l-4 border-purple-500 pl-4 py-3">
                    <h4 className="text-purple-400 font-medium">정정권</h4>
                    <p className="text-gray-300 text-sm">부정확한 개인정보의 정정을 요청할 수 있습니다.</p>
                  </div>
                  <div className="bg-gradient-to-r from-red-500/10 to-transparent border-l-4 border-red-500 pl-4 py-3">
                    <h4 className="text-red-400 font-medium">삭제권</h4>
                    <p className="text-gray-300 text-sm">개인정보 삭제를 요청할 수 있습니다. (법적 보관 의무 정보 제외)</p>
                  </div>
                  <div className="bg-gradient-to-r from-amber-500/10 to-transparent border-l-4 border-amber-500 pl-4 py-3">
                    <h4 className="text-amber-400 font-medium">동의 철회권</h4>
                    <p className="text-gray-300 text-sm">개인정보 수집/이용 동의를 철회할 수 있습니다.</p>
                  </div>
                </div>

                <p className="text-gray-300 leading-relaxed mt-4">
                  위 권리 행사는 이메일(<a href="mailto:coinkim00@gmail.com" className="text-cyan-400 hover:underline">coinkim00@gmail.com</a>)로 요청해 주세요.
                  요청 접수 후 10일 이내에 처리 결과를 안내드립니다.
                </p>
              </section>

              {/* 보안 조치 */}
              <section id="security" className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-4">7. 보안 조치</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  회사는 이용자의 개인정보를 안전하게 보호하기 위해 다음 조치를 취하고 있습니다:
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-space-800 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">🔐</span>
                      <h4 className="text-white font-medium">암호화</h4>
                    </div>
                    <p className="text-gray-400 text-sm">
                      비밀번호는 복호화 불가능한 일방향 암호화로 저장됩니다.
                      데이터 전송 시 SSL/TLS 암호화를 적용합니다.
                    </p>
                  </div>
                  <div className="bg-space-800 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">🚧</span>
                      <h4 className="text-white font-medium">접근 제한</h4>
                    </div>
                    <p className="text-gray-400 text-sm">
                      개인정보 취급 권한을 최소한의 인원으로 제한합니다.
                      정기적인 보안 교육을 실시합니다.
                    </p>
                  </div>
                  <div className="bg-space-800 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">🛡️</span>
                      <h4 className="text-white font-medium">보안 시스템</h4>
                    </div>
                    <p className="text-gray-400 text-sm">
                      방화벽, 침입탐지시스템을 운영합니다.
                      보안 취약점 점검을 정기적으로 수행합니다.
                    </p>
                  </div>
                  <div className="bg-space-800 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">💾</span>
                      <h4 className="text-white font-medium">백업</h4>
                    </div>
                    <p className="text-gray-400 text-sm">
                      정기적인 데이터 백업을 수행합니다.
                      재해 복구 계획을 수립하여 운영합니다.
                    </p>
                  </div>
                </div>
              </section>

              {/* 연락처 */}
              <section id="contact" className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">8. 연락처</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  개인정보 관련 문의, 열람/정정/삭제 요청은 아래로 연락해 주세요:
                </p>

                <div className="bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-xl p-6 border border-purple-500/30">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 w-24">담당자</span>
                      <span className="text-white">개인정보보호책임자</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 w-24">이메일</span>
                      <a href="mailto:coinkim00@gmail.com" className="text-cyan-400 hover:underline">
                        coinkim00@gmail.com
                      </a>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 w-24">응답 시간</span>
                      <span className="text-white">영업일 기준 24시간 이내</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-space-800 rounded-xl">
                  <p className="text-gray-400 text-sm">
                    개인정보 침해 관련 상담은 아래 기관에서도 받으실 수 있습니다:
                  </p>
                  <ul className="text-gray-300 text-sm mt-2 space-y-1">
                    <li>• 개인정보침해신고센터: 118</li>
                    <li>• 개인정보분쟁조정위원회: 1833-6972</li>
                    <li>• 대검찰청 사이버수사과: 1301</li>
                    <li>• 경찰청 사이버수사국: 182</li>
                  </ul>
                </div>
              </section>

              {/* 푸터 */}
              <div className="border-t border-purple-500/20 pt-8">
                <p className="text-gray-500">
                  <Link href="/terms" className="text-purple-400 hover:underline">이용약관</Link>도 함께 확인해 주세요.
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
