'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Scenario } from '@/types/firestore'

export default function ScenariosPage() {
  const { user } = useAuth()
  const [scenarios, setScenarios] = useState<(Scenario & { id: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    const loadScenarios = async () => {
      try {
        // 開発モードの場合は空配列
        if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.includes('Dummy')) {
          setScenarios([])
          setLoading(false)
          return
        }

        const q = query(collection(db, 'scenarios'), where('ownerRef', '==', user.uid))
        const snapshot = await getDocs(q)

        const scenariosData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as (Scenario & { id: string })[]

        setScenarios(scenariosData)
      } catch (error) {
        console.error('Failed to load scenarios:', error)
        setScenarios([])
      } finally {
        setLoading(false)
      }
    }

    loadScenarios()
  }, [user])

  const handleDelete = async (id: string) => {
    if (!confirm('このシナリオを削除してもよろしいですか？')) return

    setDeleting(id)
    try {
      await deleteDoc(doc(db, 'scenarios', id))
      setScenarios(scenarios.filter((s) => s.id !== id))
    } catch (error) {
      console.error('Failed to delete scenario:', error)
      alert('削除に失敗しました')
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">シナリオ管理</h1>
          <p className="text-gray-600 mt-1">ステップ配信シナリオを作成・管理します</p>
        </div>
        <Link href="/scenarios/new">
          <Button>
            <span className="mr-2">➕</span>
            新規シナリオ作成
          </Button>
        </Link>
      </div>

      {scenarios.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-lg font-semibold mb-2">シナリオがありません</h3>
            <p className="text-gray-600 mb-6 text-center">
              ステップ配信シナリオを作成して、自動メッセージ配信を始めましょう
            </p>
            <Link href="/scenarios/new">
              <Button>最初のシナリオを作成</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scenarios.map((scenario) => (
            <Card key={scenario.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle>{scenario.name}</CardTitle>
                    <CardDescription className="mt-1">{scenario.description}</CardDescription>
                  </div>
                  <div
                    className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                      scenario.active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {scenario.active ? '有効' : '無効'}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    <strong>ステップ数:</strong> {scenario.steps.length}
                  </div>
                  {scenario.triggerTag && (
                    <div className="text-sm text-gray-600">
                      <strong>トリガータグ:</strong>{' '}
                      <span className="bg-primary-100 text-primary-700 px-2 py-0.5 rounded">
                        {scenario.triggerTag}
                      </span>
                    </div>
                  )}
                  <div className="flex gap-2 mt-4">
                    <Link href={`/scenarios/${scenario.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        編集
                      </Button>
                    </Link>
                    <Button
                      variant="destructive"
                      onClick={() => handleDelete(scenario.id)}
                      disabled={deleting === scenario.id}
                    >
                      {deleting === scenario.id ? '削除中...' : '削除'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* AI機能の案内 */}
      <Card className="bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            AI文案生成機能
          </CardTitle>
          <CardDescription>
            Claude AIがあなたのビジネスに最適なメッセージを自動生成
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700 mb-4">
            新規シナリオ作成時に、目的やトーンを指定するだけで、
            AIが自然な日本語のステップメッセージを自動生成します。
          </p>
          <Link href="/scenarios/new">
            <Button variant="default">AIで文案を生成する</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
