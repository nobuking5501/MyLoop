'use client'

import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Event } from '@/types/firestore'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

export default function EventsPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<(Event & { id: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'completed' | 'cancelled'>('all')

  useEffect(() => {
    if (!user) return

    const loadEvents = async () => {
      try {
        const q = query(
          collection(db, 'events'),
          where('ownerRef', '==', user.uid),
          orderBy('start', 'desc')
        )

        const snapshot = await getDocs(q)
        const eventsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as (Event & { id: string })[]

        setEvents(eventsData)
      } catch (error) {
        console.error('Failed to load events:', error)
      } finally {
        setLoading(false)
      }
    }

    loadEvents()
  }, [user])

  const filteredEvents = events.filter((event) =>
    filter === 'all' ? true : event.status === filter
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'no-show':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled':
        return '予定'
      case 'completed':
        return '完了'
      case 'cancelled':
        return 'キャンセル'
      case 'no-show':
        return '欠席'
      default:
        return status
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
          <h1 className="text-3xl font-bold text-gray-900">予約管理</h1>
          <p className="text-gray-600 mt-1">予約の確認とスケジュール管理</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b">
        {[
          { key: 'all' as const, label: 'すべて', count: events.length },
          {
            key: 'scheduled' as const,
            label: '予定',
            count: events.filter((e) => e.status === 'scheduled').length,
          },
          {
            key: 'completed' as const,
            label: '完了',
            count: events.filter((e) => e.status === 'completed').length,
          },
          {
            key: 'cancelled' as const,
            label: 'キャンセル',
            count: events.filter((e) => e.status === 'cancelled').length,
          },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 font-medium transition-colors ${
              filter === tab.key
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
            <span className="ml-2 text-sm text-gray-500">({tab.count})</span>
          </button>
        ))}
      </div>

      {filteredEvents.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-lg font-semibold mb-2">予約がありません</h3>
            <p className="text-gray-600 text-center">
              {filter === 'all'
                ? '予約が入ると、ここに表示されます'
                : `${getStatusLabel(filter)}の予約はありません`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map((event) => {
            const startDate = event.start.toDate()

            return (
              <Card key={event.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-xl">{event.title}</CardTitle>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                            event.status
                          )}`}
                        >
                          {getStatusLabel(event.status)}
                        </span>
                      </div>
                      {event.description && (
                        <CardDescription className="mt-2">{event.description}</CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <span className="text-gray-600 w-24">📅 日時:</span>
                        <span className="font-medium">
                          {format(startDate, 'yyyy年M月d日(E) HH:mm', { locale: ja })}
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <span className="text-gray-600 w-24">👤 参加者:</span>
                        <span className="font-medium">{event.attendeeName || '未設定'}</span>
                      </div>
                      {event.attendeeEmail && (
                        <div className="flex items-center text-sm">
                          <span className="text-gray-600 w-24">📧 メール:</span>
                          <span className="font-medium">{event.attendeeEmail}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      {event.zoomUrl && (
                        <div className="bg-blue-50 p-3 rounded">
                          <div className="text-sm font-medium text-blue-900 mb-1">🎥 Zoom</div>
                          <a
                            href={event.zoomUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline break-all"
                          >
                            {event.zoomUrl}
                          </a>
                          {event.zoomPassword && (
                            <div className="text-sm mt-1">
                              <span className="text-gray-600">パスワード: </span>
                              <span className="font-mono font-medium">{event.zoomPassword}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Google Calendar連携案内 */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">📅</span>
            Google Calendar & Zoom自動連携
          </CardTitle>
          <CardDescription>
            予約を自動的にGoogleカレンダーに追加し、Zoom会議を作成
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700 mb-4">
            Google CalendarとZoomを連携すると、予約が自動的にカレンダーに追加され、
            Zoom会議URLが自動生成されて参加者に送信されます。
          </p>
          <Button variant="default" onClick={() => (window.location.href = '/settings/integrations')}>
            連携設定へ
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
