'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'

const navigation = [
  { name: 'ダッシュボード', href: '/dashboard', icon: '📊' },
  { name: 'シナリオ管理', href: '/scenarios', icon: '📝' },
  { name: '予約管理', href: '/events', icon: '📅' },
  { name: 'メッセージプレビュー', href: '/messages/preview', icon: '✉️' },
  { name: '設定', href: '/settings/integrations', icon: '⚙️' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-primary-500">MyLoop</h1>
        <p className="text-xs text-gray-500 mt-1">AI×自動化×共創</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <span className="text-lg">{item.icon}</span>
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-gray-200">
        <div className="mb-3 px-2">
          <p className="text-sm font-medium text-gray-900">{user?.name}</p>
          <p className="text-xs text-gray-500">{user?.email}</p>
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => signOut()}
        >
          ログアウト
        </Button>
      </div>
    </div>
  )
}
