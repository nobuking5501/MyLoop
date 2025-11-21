'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  doc,
  getDoc,
  updateDoc,
  Timestamp,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LandingPage, LPSection, LPSectionType, ImageAsset } from '@/types/firestore'
import Link from 'next/link'

export default function LPEditPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [lp, setLp] = useState<(LandingPage & { id: string }) | null>(null)
  const [images, setImages] = useState<(ImageAsset & { id: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isAddSectionDialogOpen, setIsAddSectionDialogOpen] = useState(false)

  // セクション追加フォーム
  const [newSection, setNewSection] = useState<Partial<LPSection>>({
    type: 'hero',
    title: '',
    subtitle: '',
    body: '',
    visible: true,
  })

  useEffect(() => {
    if (!user) return

    const loadData = async () => {
      try {
        if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.includes('Dummy')) {
          setLoading(false)
          return
        }

        // LP取得
        const lpDoc = await getDoc(doc(db, 'landing_pages', params.id as string))
        if (!lpDoc.exists()) {
          alert('LPが見つかりません')
          router.push('/lp')
          return
        }

        const lpData = { id: lpDoc.id, ...lpDoc.data() } as LandingPage & { id: string }

        // 権限チェック
        if (lpData.ownerRef !== user.uid) {
          alert('このLPを編集する権限がありません')
          router.push('/lp')
          return
        }

        setLp(lpData)

        // 画像一覧取得
        const imgQuery = query(collection(db, 'image_assets'), where('ownerRef', '==', user.uid))
        const imgSnapshot = await getDocs(imgQuery)
        const imgData = imgSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as (ImageAsset & { id: string })[]
        setImages(imgData)
      } catch (error) {
        console.error('Failed to load LP:', error)
        alert('LPの読み込みに失敗しました')
        router.push('/lp')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user, params.id, router])

  const handleSave = async () => {
    if (!lp || !user) return

    setIsSaving(true)
    try {
      if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.includes('Dummy')) {
        alert('開発モードでは保存できません')
        setIsSaving(false)
        return
      }

      await updateDoc(doc(db, 'landing_pages', lp.id), {
        ...lp,
        updatedAt: Timestamp.now(),
      })

      alert('保存しました！')
    } catch (error) {
      console.error('Failed to save LP:', error)
      alert('保存に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!lp || !user) return

    if (!confirm('このLPを公開してもよろしいですか？')) return

    setIsSaving(true)
    try {
      if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.includes('Dummy')) {
        alert('開発モードでは公開できません')
        setIsSaving(false)
        return
      }

      await updateDoc(doc(db, 'landing_pages', lp.id), {
        status: 'published',
        publishedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })

      setLp({ ...lp, status: 'published', publishedAt: Timestamp.now() })
      alert('LPを公開しました！')
    } catch (error) {
      console.error('Failed to publish LP:', error)
      alert('公開に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddSection = () => {
    if (!lp) return

    const section: LPSection = {
      id: `section_${Date.now()}`,
      type: newSection.type as LPSectionType,
      order: lp.sections.length,
      title: newSection.title,
      subtitle: newSection.subtitle,
      body: newSection.body,
      visible: true,
    }

    setLp({
      ...lp,
      sections: [...lp.sections, section],
    })

    setNewSection({
      type: 'hero',
      title: '',
      subtitle: '',
      body: '',
      visible: true,
    })
    setIsAddSectionDialogOpen(false)
  }

  const handleDeleteSection = (sectionId: string) => {
    if (!lp) return
    if (!confirm('このセクションを削除してもよろしいですか？')) return

    setLp({
      ...lp,
      sections: lp.sections.filter((s) => s.id !== sectionId),
    })
  }

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    if (!lp) return

    const newSections = [...lp.sections]
    const targetIndex = direction === 'up' ? index - 1 : index + 1

    if (targetIndex < 0 || targetIndex >= newSections.length) return

    const temp = newSections[index]
    newSections[index] = newSections[targetIndex]
    newSections[targetIndex] = temp

    // order を再設定
    newSections.forEach((section, idx) => {
      section.order = idx
    })

    setLp({ ...lp, sections: newSections })
  }

  const getSectionTypeLabel = (type: LPSectionType) => {
    const labels: Record<LPSectionType, string> = {
      hero: 'ヒーロー',
      problem: '問題提起',
      benefit: 'ベネフィット',
      features: '特徴・機能',
      proof: '実績・証拠',
      testimonial: 'お客様の声',
      profile: 'プロフィール',
      faq: 'よくある質問',
      cta: 'CTA',
      pricing: '価格表',
      comparison: '比較表',
      timeline: 'タイムライン',
      custom: 'カスタム',
    }
    return labels[type]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!lp) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-600">LPが見つかりません</p>
          <Link href="/lp">
            <Button className="mt-4">LP一覧に戻る</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/lp">
              <Button variant="outline" size="sm">
                ← 戻る
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">{lp.title}</h1>
              <p className="text-sm text-gray-500">/{lp.slug}</p>
            </div>
          </div>
          <div className="flex gap-3">
            {lp.status === 'published' && (
              <Link href={`/p/${lp.slug}`} target="_blank">
                <Button variant="outline" size="sm">
                  👁️ プレビュー
                </Button>
              </Link>
            )}
            <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving}>
              💾 保存
            </Button>
            {lp.status === 'draft' && (
              <Button size="sm" onClick={handlePublish} disabled={isSaving}>
                🚀 公開
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-8">
        <Tabs defaultValue="sections" className="space-y-6">
          <TabsList>
            <TabsTrigger value="sections">セクション編集</TabsTrigger>
            <TabsTrigger value="settings">設定</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
          </TabsList>

          {/* セクション編集タブ */}
          <TabsContent value="sections" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>セクション一覧</CardTitle>
                    <CardDescription>ドラッグ&ドロップで順序を変更できます</CardDescription>
                  </div>
                  <Dialog open={isAddSectionDialogOpen} onOpenChange={setIsAddSectionDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>➕ セクション追加</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>新しいセクションを追加</DialogTitle>
                        <DialogDescription>セクションの種類と基本情報を入力してください</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>セクションタイプ</Label>
                          <Select
                            value={newSection.type}
                            onValueChange={(value: LPSectionType) => setNewSection({ ...newSection, type: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="hero">ヒーロー（ファーストビュー）</SelectItem>
                              <SelectItem value="problem">問題提起</SelectItem>
                              <SelectItem value="benefit">ベネフィット</SelectItem>
                              <SelectItem value="features">特徴・機能</SelectItem>
                              <SelectItem value="proof">実績・証拠</SelectItem>
                              <SelectItem value="testimonial">お客様の声</SelectItem>
                              <SelectItem value="profile">プロフィール</SelectItem>
                              <SelectItem value="faq">よくある質問</SelectItem>
                              <SelectItem value="cta">CTA（行動喚起）</SelectItem>
                              <SelectItem value="pricing">価格表</SelectItem>
                              <SelectItem value="comparison">比較表</SelectItem>
                              <SelectItem value="timeline">タイムライン</SelectItem>
                              <SelectItem value="custom">カスタム</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>タイトル</Label>
                          <Input
                            value={newSection.title || ''}
                            onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
                            placeholder="セクションのタイトル"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>サブタイトル</Label>
                          <Input
                            value={newSection.subtitle || ''}
                            onChange={(e) => setNewSection({ ...newSection, subtitle: e.target.value })}
                            placeholder="サブタイトル（任意）"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>本文</Label>
                          <Textarea
                            value={newSection.body || ''}
                            onChange={(e) => setNewSection({ ...newSection, body: e.target.value })}
                            placeholder="本文テキスト"
                            rows={4}
                          />
                        </div>
                        <div className="flex gap-3 pt-4">
                          <Button
                            variant="outline"
                            onClick={() => setIsAddSectionDialogOpen(false)}
                            className="flex-1"
                          >
                            キャンセル
                          </Button>
                          <Button onClick={handleAddSection} className="flex-1">
                            追加
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {lp.sections.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <p className="text-gray-500 mb-4">まだセクションがありません</p>
                    <Button onClick={() => setIsAddSectionDialogOpen(true)}>➕ 最初のセクションを追加</Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {lp.sections.map((section, index) => (
                      <Card key={section.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="flex flex-col gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMoveSection(index, 'up')}
                                disabled={index === 0}
                              >
                                ↑
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMoveSection(index, 'down')}
                                disabled={index === lp.sections.length - 1}
                              >
                                ↓
                              </Button>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-1 bg-primary-100 text-primary-800 text-xs font-medium rounded">
                                  {getSectionTypeLabel(section.type)}
                                </span>
                                <span className="text-sm text-gray-500">#{index + 1}</span>
                              </div>
                              <h3 className="font-semibold">{section.title || '（タイトルなし）'}</h3>
                              {section.subtitle && <p className="text-sm text-gray-600 mt-1">{section.subtitle}</p>}
                              {section.body && (
                                <p className="text-sm text-gray-500 mt-2 line-clamp-2">{section.body}</p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                ✏️ 編集
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteSection(section.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                🗑️
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 設定タブ */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>LP設定</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>画像モード</Label>
                  <Select
                    value={lp.settings?.imageMode || 'with-images'}
                    onValueChange={(value: 'with-images' | 'text-only') =>
                      setLp({ ...lp, settings: { ...lp.settings, imageMode: value } })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="with-images">画像あり</SelectItem>
                      <SelectItem value="text-only">テキストのみ</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    テキストのみモードでは、画像を非表示にしてテキスト中心のLPになります
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={lp.settings?.enableTracking || false}
                    onChange={(e) =>
                      setLp({ ...lp, settings: { ...lp.settings, enableTracking: e.target.checked } })
                    }
                    className="rounded"
                  />
                  <Label>アクセス解析を有効化</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SEOタブ */}
          <TabsContent value="seo" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>SEO設定</CardTitle>
                <CardDescription>検索エンジン最適化とSNSシェア設定</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>SEOタイトル</Label>
                  <Input
                    value={lp.seoTitle || ''}
                    onChange={(e) => setLp({ ...lp, seoTitle: e.target.value })}
                    placeholder={lp.title}
                  />
                  <p className="text-xs text-gray-500">検索結果に表示されるタイトル（60文字以内推奨）</p>
                </div>
                <div className="space-y-2">
                  <Label>SEO説明文</Label>
                  <Textarea
                    value={lp.seoDescription || ''}
                    onChange={(e) => setLp({ ...lp, seoDescription: e.target.value })}
                    placeholder="このLPの説明を入力"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500">検索結果に表示される説明（160文字以内推奨）</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
