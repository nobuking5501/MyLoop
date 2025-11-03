'use client'

import { useEffect, useState } from 'react'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FunnelDaily } from '@/types/firestore'

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    lpViews: 0,
    lineRegs: 0,
    bookings: 0,
    purchases: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchStats = async () => {
      try {
        // Get last 7 days of funnel data
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        const dateStr = sevenDaysAgo.toISOString().split('T')[0]

        const q = query(
          collection(db, 'funnels_daily'),
          where('ownerRef', '==', user.uid),
          where('date', '>=', dateStr),
          orderBy('date', 'desc')
        )

        const snapshot = await getDocs(q)
        const totals = snapshot.docs.reduce(
          (acc, doc) => {
            const data = doc.data() as FunnelDaily
            return {
              lpViews: acc.lpViews + (data.lpViews || 0),
              lineRegs: acc.lineRegs + (data.lineRegs || 0),
              bookings: acc.bookings + (data.bookings || 0),
              purchases: acc.purchases + (data.purchases || 0),
            }
          },
          { lpViews: 0, lineRegs: 0, bookings: 0, purchases: 0 }
        )

        setStats(totals)
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [user])

  const calculateConversionRate = (numerator: number, denominator: number) => {
    if (denominator === 0) return '0.0'
    return ((numerator / denominator) * 100).toFixed(1)
  }

  const kpiCards = [
    {
      title: 'LP閲覧数',
      value: stats.lpViews,
      icon: '👁️',
      color: 'text-blue-600',
    },
    {
      title: 'LINE登録数',
      value: stats.lineRegs,
      icon: '💬',
      color: 'text-green-600',
      conversion: `${calculateConversionRate(stats.lineRegs, stats.lpViews)}%`,
    },
    {
      title: '予約数',
      value: stats.bookings,
      icon: '📅',
      color: 'text-yellow-600',
      conversion: `${calculateConversionRate(stats.bookings, stats.lineRegs)}%`,
    },
    {
      title: '成約数',
      value: stats.purchases,
      icon: '✅',
      color: 'text-primary-600',
      conversion: `${calculateConversionRate(stats.purchases, stats.bookings)}%`,
    },
  ]

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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">ダッシュボード</h1>
        <p className="text-gray-600 mt-1">過去7日間のファネルKPIを表示しています</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <span className="text-2xl">{kpi.icon}</span>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
              {kpi.conversion && (
                <p className="text-xs text-muted-foreground mt-1">
                  転換率: {kpi.conversion}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>クイックアクション</CardTitle>
          <CardDescription>よく使う機能へのショートカット</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/scenarios"
              className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <div className="text-2xl mb-2">📝</div>
              <h3 className="font-semibold">新規シナリオ作成</h3>
              <p className="text-sm text-gray-600 mt-1">
                ステップ配信シナリオを作成
              </p>
            </a>
            <a
              href="/events"
              className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <div className="text-2xl mb-2">📅</div>
              <h3 className="font-semibold">予約を確認</h3>
              <p className="text-sm text-gray-600 mt-1">
                今後の予約を管理
              </p>
            </a>
            <a
              href="/settings/integrations"
              className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <div className="text-2xl mb-2">⚙️</div>
              <h3 className="font-semibold">連携設定</h3>
              <p className="text-sm text-gray-600 mt-1">
                LINE/Zoom/Googleを設定
              </p>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Getting Started (初回のみ表示) */}
      {stats.lineRegs === 0 && (
        <Card className="border-primary-200 bg-primary-50">
          <CardHeader>
            <CardTitle className="text-primary-700">はじめましょう 🚀</CardTitle>
            <CardDescription>MyLoopを使い始めるための手順</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>LINE Messaging APIを設定（設定ページ）</li>
              <li>ステップ配信シナリオを作成（シナリオ管理）</li>
              <li>予約受付フォームを設定（予約管理）</li>
              <li>Google Calendar & Zoomを連携（設定ページ）</li>
              <li>AIメッセージ生成を試す（シナリオ管理）</li>
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
