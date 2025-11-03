'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function Home() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (user) {
        // ログイン済みならダッシュボードへ
        router.push('/dashboard')
      } else {
        // 未ログインならログインページへ
        router.push('/login')
      }
    }
  }, [user, loading, router])

  // リダイレクト中のローディング表示
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
        <h1 className="text-4xl font-bold text-primary-500 mb-4">
          MyLoop
        </h1>
        <p className="text-xl text-gray-600">
          AI×自動化×共創 - 次世代ローンチ支援アプリ
        </p>
        <p className="text-sm text-gray-500 mt-4">読み込み中...</p>
      </div>
    </main>
  )
}
