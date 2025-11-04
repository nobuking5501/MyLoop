'use client'

import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, orderBy, addDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Event } from '@/types/firestore'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

export default function EventsPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<(Event & { id: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'completed' | 'cancelled'>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    type: 'consultation' as 'booking' | 'webinar' | 'consultation' | 'other',
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    duration: '60', // minutes
    attendeeName: '',
    attendeeEmail: '',
    attendeePhone: '',
  })

  useEffect(() => {
    if (!user) return

    const loadEvents = async () => {
      try {
        // 開発モードの場合は空配列
        if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.includes('Dummy')) {
          setEvents([])
          setLoading(false)
          return
        }

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
        setEvents([])
      } finally {
        setLoading(false)
      }
    }

    loadEvents()
  }, [user])

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      alert('ユーザー情報が取得できません。ログインし直してください。')
      return
    }

    setIsSaving(true)
    try {
      // 開発モードの場合はエラーメッセージ
      if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.includes('Dummy')) {
        alert('開発モードでは予約作成はできません。Firebase設定を完了してください。')
        setIsSaving(false)
        return
      }

      // デバッグ情報をログ出力
      console.log('Creating event with user:', user.uid)
      console.log('Form data:', formData)

      // 日付と時刻の検証
      if (!formData.startDate || !formData.startTime) {
        alert('日付と時刻を入力してください。')
        setIsSaving(false)
        return
      }

      // Combine date and time into start timestamp
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`)
      const endDateTime = new Date(startDateTime.getTime() + parseInt(formData.duration) * 60000)

      // 日付の妥当性チェック
      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        alert('日付または時刻の形式が正しくありません。')
        setIsSaving(false)
        return
      }

      const newEvent: Omit<Event, 'id'> = {
        ownerRef: user.uid,
        type: formData.type,
        title: formData.title,
        description: formData.description || undefined,
        start: Timestamp.fromDate(startDateTime),
        end: Timestamp.fromDate(endDateTime),
        attendeeName: formData.attendeeName || undefined,
        attendeeEmail: formData.attendeeEmail || undefined,
        attendeePhone: formData.attendeePhone || undefined,
        status: 'scheduled',
        reminderSent: false,
        createdAt: Timestamp.now(),
      }

      console.log('New event object:', newEvent)
      console.log('Attempting to write to Firestore...')

      const docRef = await addDoc(collection(db, 'events'), newEvent)
      console.log('Event created with ID:', docRef.id)

      // Reset form
      setFormData({
        type: 'consultation',
        title: '',
        description: '',
        startDate: '',
        startTime: '',
        duration: '60',
        attendeeName: '',
        attendeeEmail: '',
        attendeePhone: '',
      })
      setIsDialogOpen(false)

      // Reload events
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

      alert('予約を作成しました！')
    } catch (error) {
      console.error('Failed to create event:', error)
      // より詳細なエラーメッセージを表示
      const errorMessage = error instanceof Error ? error.message : '不明なエラー'
      alert(`予約の作成に失敗しました。\nエラー: ${errorMessage}\n\nコンソールで詳細を確認してください。`)
    } finally {
      setIsSaving(false)
    }
  }

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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              ➕ 新規予約
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>新規予約作成</DialogTitle>
              <DialogDescription>
                予約情報を入力して、新しい予約を作成します
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">予約種別</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: 'booking' | 'webinar' | 'consultation' | 'other') =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="consultation">相談</SelectItem>
                      <SelectItem value="booking">予約</SelectItem>
                      <SelectItem value="webinar">ウェビナー</SelectItem>
                      <SelectItem value="other">その他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">所要時間</Label>
                  <Select
                    value={formData.duration}
                    onValueChange={(value) =>
                      setFormData({ ...formData, duration: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15分</SelectItem>
                      <SelectItem value="30">30分</SelectItem>
                      <SelectItem value="45">45分</SelectItem>
                      <SelectItem value="60">60分</SelectItem>
                      <SelectItem value="90">90分</SelectItem>
                      <SelectItem value="120">120分</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">タイトル *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="例: 初回面談"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">説明</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="予約の詳細や目的など"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">日付 *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startTime">開始時刻 *</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData({ ...formData, startTime: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">参加者情報</h3>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="attendeeName">参加者名</Label>
                    <Input
                      id="attendeeName"
                      value={formData.attendeeName}
                      onChange={(e) =>
                        setFormData({ ...formData, attendeeName: e.target.value })
                      }
                      placeholder="例: 山田太郎"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="attendeeEmail">メールアドレス</Label>
                    <Input
                      id="attendeeEmail"
                      type="email"
                      value={formData.attendeeEmail}
                      onChange={(e) =>
                        setFormData({ ...formData, attendeeEmail: e.target.value })
                      }
                      placeholder="example@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="attendeePhone">電話番号</Label>
                    <Input
                      id="attendeePhone"
                      type="tel"
                      value={formData.attendeePhone}
                      onChange={(e) =>
                        setFormData({ ...formData, attendeePhone: e.target.value })
                      }
                      placeholder="090-1234-5678"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                  disabled={isSaving}
                >
                  キャンセル
                </Button>
                <Button type="submit" className="flex-1" disabled={isSaving}>
                  {isSaving ? '作成中...' : '予約を作成'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
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
