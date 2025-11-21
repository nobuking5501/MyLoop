import ProtectedRoute from '@/components/ProtectedRoute'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

export default function LPLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-50">
        <aside className="w-64 flex-shrink-0">
          <Sidebar />
        </aside>
        <main className="flex-1 overflow-auto">
          <Header />
          <div className="p-8">{children}</div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
