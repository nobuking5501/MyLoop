'use client'

import { useAuth } from '@/contexts/AuthContext'

export default function Header() {
  const { user } = useAuth()

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            こんにちは、{user?.name}さん
          </h2>
          <p className="text-sm text-gray-500">
            今日も素晴らしい1日にしましょう！
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            {new Date().toLocaleDateString('ja-JP', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long',
            })}
          </div>
        </div>
      </div>
    </header>
  )
}
