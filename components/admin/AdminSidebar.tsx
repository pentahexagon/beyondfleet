'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Image,
  Gavel,
  Newspaper,
  GraduationCap,
  Users,
  LogOut,
  ChevronLeft,
} from 'lucide-react'

const menuItems = [
  { href: '/admin', icon: LayoutDashboard, label: '대시보드' },
  { href: '/admin/nft', icon: Image, label: 'NFT 관리' },
  { href: '/admin/auction', icon: Gavel, label: '옥션 관리' },
  { href: '/admin/news', icon: Newspaper, label: '뉴스 관리' },
  { href: '/admin/learn', icon: GraduationCap, label: '교육 콘텐츠' },
  { href: '/admin/users', icon: Users, label: '회원 관리' },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 min-h-screen bg-space-900 border-r border-purple-500/20 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-purple-500/20">
        <h1 className="text-xl font-bold gradient-text">BeyondFleet Admin</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href))
            const Icon = item.icon

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-purple-500/20 space-y-2">
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>메인으로 돌아가기</span>
        </Link>
      </div>
    </aside>
  )
}
