'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { Search, ChevronDown, Mail, MessageCircle } from 'lucide-react'

interface FAQItem {
  question: string
  answer: string
}

interface FAQCategory {
  id: string
  icon: string
  title: string
  items: FAQItem[]
}

const faqData: FAQCategory[] = [
  {
    id: 'intro',
    icon: '🦦',
    title: 'BeyondFleet 소개',
    items: [
      {
        question: 'BeyondFleet이 뭔가요?',
        answer: 'BeyondFleet은 암호화폐 초보자를 위한 교육 및 커뮤니티 플랫폼입니다. "개미는 땅을 파고, 우리는 우주를 판다" - 함께 배우고 성장하는 공간이에요.'
      },
      {
        question: 'Otty는 누구인가요?',
        answer: 'Otty는 BeyondFleet의 마스코트 우주 수달이에요! 물에서 우주로, 여러분의 여정을 함께합니다.'
      },
      {
        question: '무료로 사용할 수 있나요?',
        answer: '네! 기본 기능은 무료입니다. 프리미엄 뉴스와 고급 분석은 NFT 멤버십이 필요해요.'
      }
    ]
  },
  {
    id: 'membership',
    icon: '💳',
    title: '멤버십 & NFT',
    items: [
      {
        question: 'NFT 멤버십이 뭔가요?',
        answer: '등급별 NFT를 구매하면 프리미엄 콘텐츠에 접근할 수 있어요. Cadet부터 Admiral까지 5단계가 있습니다.'
      },
      {
        question: 'NFT는 어떻게 구매하나요?',
        answer: '지갑(MetaMask, Phantom)을 연결하고 멤버십 페이지에서 구매할 수 있어요.'
      },
      {
        question: '어떤 지갑을 지원하나요?',
        answer: 'MetaMask(이더리움), Phantom/Solflare(솔라나)를 지원합니다.'
      }
    ]
  },
  {
    id: 'news',
    icon: '📰',
    title: '뉴스 & 분석',
    items: [
      {
        question: '프리미엄 뉴스는 뭐가 다른가요?',
        answer: '기관 동향, 고래 추적, AI 분석 리포트 등 심층 정보를 제공해요.'
      },
      {
        question: 'AI 분석은 어떻게 생성되나요?',
        answer: 'Claude AI가 매일 시장을 분석하고 등급별 맞춤 리포트를 제공합니다.'
      },
      {
        question: '고래 추적이 뭔가요?',
        answer: '대형 지갑의 거래를 추적해서 시장 움직임을 예측하는 데 도움을 줘요.'
      }
    ]
  },
  {
    id: 'education',
    icon: '📚',
    title: '교육',
    items: [
      {
        question: '교육 콘텐츠는 어디서 볼 수 있나요?',
        answer: '교육 메뉴에서 초급/중급/고급 강의를 볼 수 있어요.'
      },
      {
        question: '모든 강의가 무료인가요?',
        answer: '초급 강의는 무료, 중급/고급은 멤버십 등급에 따라 접근 가능해요.'
      }
    ]
  },
  {
    id: 'auction',
    icon: '🎁',
    title: 'NFT 옥션 & 랜덤박스',
    items: [
      {
        question: '옥션은 언제 하나요?',
        answer: '매주 목요일 저녁 8시(KST)에 진행됩니다.'
      },
      {
        question: '랜덤박스에서 뭐가 나오나요?',
        answer: '등급별 NFT가 랜덤으로 나와요. 선물하기도 가능합니다.'
      }
    ]
  },
  {
    id: 'security',
    icon: '🔐',
    title: '계정 & 보안',
    items: [
      {
        question: '지갑 연결이 안전한가요?',
        answer: '네! 서명 검증만 하고 자산 이동 권한은 요청하지 않아요.'
      },
      {
        question: '비밀번호를 잊어버렸어요.',
        answer: '로그인 페이지에서 "비밀번호 재설정"을 클릭하세요.'
      }
    ]
  },
  {
    id: 'disclaimer',
    icon: '⚠️',
    title: '면책조항',
    items: [
      {
        question: '투자 조언을 받을 수 있나요?',
        answer: 'BeyondFleet은 정보 제공 목적이며, 투자 조언이 아닙니다. 모든 투자 결정과 책임은 본인에게 있습니다.'
      }
    ]
  }
]

function AccordionItem({ item, isOpen, onToggle }: {
  item: FAQItem
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div className="border-b border-purple-500/20 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full py-4 px-4 flex items-center justify-between text-left hover:bg-purple-500/5 transition-colors"
      >
        <span className="font-medium text-white pr-4">{item.question}</span>
        <ChevronDown
          className={`w-5 h-5 text-purple-400 flex-shrink-0 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <p className="px-4 pb-4 text-gray-400 leading-relaxed">
          {item.answer}
        </p>
      </div>
    </div>
  )
}

function CategorySection({ category, searchQuery }: {
  category: FAQCategory
  searchQuery: string
}) {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set())

  const filteredItems = useMemo(() => {
    if (!searchQuery) return category.items
    const query = searchQuery.toLowerCase()
    return category.items.filter(
      item =>
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query)
    )
  }, [category.items, searchQuery])

  if (filteredItems.length === 0) return null

  const toggleItem = (index: number) => {
    setOpenItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
          <span className="text-xl">{category.icon}</span>
        </div>
        <h2 className="text-xl font-bold text-white">{category.title}</h2>
        <div className="relative w-8 h-8 opacity-60 hover:opacity-100 transition-opacity">
          <Image
            src="/images/otty.png"
            alt="Otty"
            fill
            className="object-contain"
          />
        </div>
      </div>
      <div className="glass rounded-xl overflow-hidden">
        {filteredItems.map((item, index) => (
          <AccordionItem
            key={index}
            item={item}
            isOpen={openItems.has(index)}
            onToggle={() => toggleItem(index)}
          />
        ))}
      </div>
    </div>
  )
}

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const hasResults = useMemo(() => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return faqData.some(category =>
      category.items.some(
        item =>
          item.question.toLowerCase().includes(query) ||
          item.answer.toLowerCase().includes(query)
      )
    )
  }, [searchQuery])

  return (
    <main className="min-h-screen py-20 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="relative w-24 h-24 mx-auto mb-6 animate-float">
            <Image
              src="/images/otty.png"
              alt="Otty"
              fill
              className="object-contain"
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">자주 묻는 질문</span>
          </h1>
          <p className="text-gray-400 text-lg">
            BeyondFleet에 대해 궁금한 점을 찾아보세요
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-10">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="질문 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-space-800 border border-purple-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
          />
        </div>

        {/* FAQ Categories */}
        {hasResults ? (
          faqData.map((category) => (
            <CategorySection
              key={category.id}
              category={category}
              searchQuery={searchQuery}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-400 text-lg">
              &quot;{searchQuery}&quot;에 대한 결과를 찾을 수 없어요
            </p>
          </div>
        )}

        {/* Contact Section */}
        <div className="mt-16 glass rounded-2xl p-8 text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <Image
              src="/images/otty.png"
              alt="Otty"
              fill
              className="object-contain animate-wiggle"
            />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">
            찾는 답이 없나요?
          </h3>
          <p className="text-gray-400 mb-6">
            Otty가 직접 도와드릴게요!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:support@beyondfleet.io"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-full transition-colors"
            >
              <Mail className="w-5 h-5" />
              이메일 문의
            </a>
            <a
              href="https://discord.gg/beyondfleet"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-full transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              Discord 참여
            </a>
          </div>
        </div>

        {/* Footer spacer */}
        <div className="h-20" />
      </div>
    </main>
  )
}
