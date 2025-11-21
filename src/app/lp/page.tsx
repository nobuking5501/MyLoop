'use client'

import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, orderBy, addDoc, Timestamp, deleteDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { LandingPage } from '@/types/firestore'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import Link from 'next/link'

export default function LPListPage() {
  const { user } = useAuth()
  const [landingPages, setLandingPages] = useState<(LandingPage & { id: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
  })

  useEffect(() => {
    if (!user) return

    const loadLandingPages = async () => {
      try {
        // 開発モードの場合は空配列
        if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.includes('Dummy')) {
          setLandingPages([])
          setLoading(false)
          return
        }

        const q = query(
          collection(db, 'landing_pages'),
          where('ownerRef', '==', user.uid),
          orderBy('createdAt', 'desc')
        )

        const snapshot = await getDocs(q)
        const lpData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as (LandingPage & { id: string })[]

        setLandingPages(lpData)
      } catch (error) {
        console.error('Failed to load landing pages:', error)
        setLandingPages([])
      } finally {
        setLoading(false)
      }
    }

    loadLandingPages()
  }, [user])

  const handleCreateLP = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      alert('ユーザー情報が取得できません。ログインし直してください。')
      return
    }

    setIsSaving(true)
    try {
      // 開発モードの場合はエラーメッセージ
      if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.includes('Dummy')) {
        alert('開発モードではLP作成はできません。Firebase設定を完了してください。')
        setIsSaving(false)
        return
      }

      // Slugの検証（URL用の文字列）
      const slugRegex = /^[a-z0-9-]+$/
      if (!slugRegex.test(formData.slug)) {
        alert('スラッグは半角英数字とハイフンのみ使用できます。')
        setIsSaving(false)
        return
      }

      // Slug重複チェック
      const existingLP = landingPages.find((lp) => lp.slug === formData.slug)
      if (existingLP) {
        alert('このスラッグは既に使用されています。別のスラッグを入力してください。')
        setIsSaving(false)
        return
      }

      const newLP: Omit<LandingPage, 'id'> = {
        ownerRef: user.uid,
        title: formData.title,
        slug: formData.slug,
        description: formData.description || undefined,
        sections: [], // 初期状態は空のセクション
        status: 'draft',
        settings: {
          imageMode: 'with-images',
          enableTracking: false,
        },
        stats: {
          views: 0,
          lineRegistrations: 0,
          bookings: 0,
        },
        createdAt: Timestamp.now(),
      }

      const docRef = await addDoc(collection(db, 'landing_pages'), newLP)
      console.log('Landing page created with ID:', docRef.id)

      // Reset form
      setFormData({
        title: '',
        slug: '',
        description: '',
      })
      setIsDialogOpen(false)

      // Reload landing pages
      const q = query(
        collection(db, 'landing_pages'),
        where('ownerRef', '==', user.uid),
        orderBy('createdAt', 'desc')
      )
      const snapshot = await getDocs(q)
      const lpData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as (LandingPage & { id: string })[]
      setLandingPages(lpData)

      alert('LPを作成しました！編集画面で内容を追加できます。')
    } catch (error) {
      console.error('Failed to create landing page:', error)
      const errorMessage = error instanceof Error ? error.message : '不明なエラー'
      alert(`LPの作成に失敗しました。\nエラー: ${errorMessage}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (lpId: string, lpTitle: string) => {
    if (!confirm(`「${lpTitle}」を削除してもよろしいですか？\n\nこの操作は取り消せません。`)) {
      return
    }

    try {
      if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.includes('Dummy')) {
        alert('開発モードでは削除できません。')
        return
      }

      await deleteDoc(doc(db, 'landing_pages', lpId))
      setLandingPages(landingPages.filter((lp) => lp.id !== lpId))
      alert('LPを削除しました。')
    } catch (error) {
      console.error('Failed to delete landing page:', error)
      alert('LPの削除に失敗しました。')
    }
  }

  const filteredLPs = landingPages.filter((lp) => (filter === 'all' ? true : lp.status === filter))

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'published':
        return 'bg-green-100 text-green-800'
      case 'archived':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft':
        return '下書き'
      case 'published':
        return '公開中'
      case 'archived':
        return 'アーカイブ'
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
          <h1 className="text-3xl font-bold text-gray-900">LP作成</h1>
          <p className="text-gray-600 mt-1">ランディングページの作成と管理</p>
        </div>
        <div className="flex gap-3">
          <Link href="/lp/images">
            <Button variant="outline">🖼️ 画像ライブラリ</Button>
          </Link>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>➕ 新規LP作成</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>新規LP作成</DialogTitle>
                <DialogDescription>
                  LPの基本情報を入力してください。作成後、編集画面でコンテンツを追加できます。
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateLP} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">LPタイトル *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="例: 2024年春期セミナー募集"
                    required
                  />
                  <p className="text-xs text-gray-500">管理画面で表示される名前です</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">スラッグ（URL用） *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                      })
                    }
                    placeholder="例: seminar-2024-spring"
                    required
                    pattern="[a-z0-9-]+"
                  />
                  <p className="text-xs text-gray-500">
                    公開URL: /p/[スラッグ] （半角英数字とハイフンのみ）
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">説明（任意）</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="このLPの目的や概要を記入"
                    rows={3}
                  />
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
                    {isSaving ? '作成中...' : 'LPを作成'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b">
        {[
          { key: 'all' as const, label: 'すべて', count: landingPages.length },
          {
            key: 'draft' as const,
            label: '下書き',
            count: landingPages.filter((lp) => lp.status === 'draft').length,
          },
          {
            key: 'published' as const,
            label: '公開中',
            count: landingPages.filter((lp) => lp.status === 'published').length,
          },
          {
            key: 'archived' as const,
            label: 'アーカイブ',
            count: landingPages.filter((lp) => lp.status === 'archived').length,
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

      {filteredLPs.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-6xl mb-4">🚀</div>
            <h3 className="text-lg font-semibold mb-2">LPがありません</h3>
            <p className="text-gray-600 text-center mb-4">
              {filter === 'all'
                ? '新しいLPを作成して、集客を始めましょう'
                : `${getStatusLabel(filter)}のLPはありません`}
            </p>
            {filter === 'all' && (
              <Button onClick={() => setIsDialogOpen(true)}>➕ 最初のLPを作成</Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLPs.map((lp) => (
            <Card key={lp.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(lp.status)}`}>
                        {getStatusLabel(lp.status)}
                      </span>
                    </div>
                    <CardTitle className="text-lg">{lp.title}</CardTitle>
                    <CardDescription className="mt-1 text-xs">/{lp.slug}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {lp.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{lp.description}</p>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 text-center py-3 bg-gray-50 rounded">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{lp.stats?.views || 0}</div>
                    <div className="text-xs text-gray-600">閲覧</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {lp.stats?.lineRegistrations || 0}
                    </div>
                    <div className="text-xs text-gray-600">LINE登録</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{lp.stats?.bookings || 0}</div>
                    <div className="text-xs text-gray-600">予約</div>
                  </div>
                </div>

                {/* Section count */}
                <div className="text-sm text-gray-600">
                  📝 セクション数: {lp.sections.length}個
                </div>

                {/* Last updated */}
                <div className="text-xs text-gray-500">
                  最終更新:{' '}
                  {lp.updatedAt
                    ? format(lp.updatedAt.toDate(), 'yyyy/MM/dd HH:mm', { locale: ja })
                    : format(lp.createdAt.toDate(), 'yyyy/MM/dd HH:mm', { locale: ja })}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Link href={`/lp/${lp.id}/edit`} className="flex-1">
                    <Button variant="default" className="w-full" size="sm">
                      ✏️ 編集
                    </Button>
                  </Link>
                  {lp.status === 'published' && (
                    <Link href={`/p/${lp.slug}`} target="_blank" className="flex-1">
                      <Button variant="outline" className="w-full" size="sm">
                        👁️ プレビュー
                      </Button>
                    </Link>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(lp.id!, lp.title)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    🗑️
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tips */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">💡</span>
            LP作成のヒント
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• LPは「セクション」の集合体として構成されます（ヒーロー、ベネフィット、CTAなど）</li>
            <li>• 画像ライブラリで事前に画像をアップロードしておくと、編集がスムーズです</li>
            <li>• 「画像あり」「テキストのみ」モードを切り替えて、最適なデザインを選べます</li>
            <li>• 公開前に必ずプレビューで確認しましょう</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
