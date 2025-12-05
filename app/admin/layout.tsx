import AdminGuard from '@/components/admin/AdminGuard'
import AdminSidebar from '@/components/admin/AdminSidebar'

export const metadata = {
  title: 'Admin - BeyondFleet',
  description: 'BeyondFleet 관리자 대시보드',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-space-900">
        <AdminSidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </AdminGuard>
  )
}
