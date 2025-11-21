'use client'

import { useState, useEffect } from 'react'
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  addDoc,
  Timestamp,
  deleteDoc,
  doc,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from '@/lib/firebase/config'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ImageAsset } from '@/types/firestore'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import Link from 'next/link'
import Image from 'next/image'

export default function ImageLibraryPage() {
  const { user } = useAuth()
  const [images, setImages] = useState<(ImageAsset & { id: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | ImageAsset['category']>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'other' as ImageAsset['category'],
    file: null as File | null,
  })

  useEffect(() => {
    if (!user) return

    const loadImages = async () => {
      try {
        // 開発モードの場合は空配列
        if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.includes('Dummy')) {
          setImages([])
          setLoading(false)
          return
        }

        const q = query(
          collection(db, 'image_assets'),
          where('ownerRef', '==', user.uid),
          orderBy('createdAt', 'desc')
        )

        const snapshot = await getDocs(q)
        const imageData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as (ImageAsset & { id: string })[]

        setImages(imageData)
      } catch (error) {
        console.error('Failed to load images:', error)
        setImages([])
      } finally {
        setLoading(false)
      }
    }

    loadImages()
  }, [user])

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !formData.file) {
      alert('ファイルを選択してください')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // 開発モードの場合はエラーメッセージ
      if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.includes('Dummy')) {
        alert('開発モードでは画像アップロードはできません。Firebase設定を完了してください。')
        setIsUploading(false)
        return
      }

      // ファイルサイズチェック（5MB制限）
      if (formData.file.size > 5 * 1024 * 1024) {
        alert('ファイルサイズは5MB以下にしてください')
        setIsUploading(false)
        return
      }

      // ファイル名生成（ユニーク）
      const timestamp = Date.now()
      const fileName = `${user.uid}/${timestamp}_${formData.file.name}`
      const storageRef = ref(storage, `lp-images/${fileName}`)

      // アップロード
      setUploadProgress(50)
      const snapshot = await uploadBytes(storageRef, formData.file)
      setUploadProgress(75)

      // ダウンロードURL取得
      const downloadURL = await getDownloadURL(snapshot.ref)
      setUploadProgress(90)

      // 画像情報をFirestoreに保存
      const imageData: Omit<ImageAsset, 'id'> = {
        ownerRef: user.uid,
        name: formData.name || formData.file.name,
        url: downloadURL,
        category: formData.category,
        size: formData.file.size,
        mimeType: formData.file.type,
        createdAt: Timestamp.now(),
      }

      const docRef = await addDoc(collection(db, 'image_assets'), imageData)
      setUploadProgress(100)

      // リストに追加
      setImages([{ id: docRef.id, ...imageData }, ...images])

      // フォームリセット
      setFormData({
        name: '',
        category: 'other',
        file: null,
      })
      setIsDialogOpen(false)
      alert('画像をアップロードしました！')
    } catch (error) {
      console.error('Failed to upload image:', error)
      const errorMessage = error instanceof Error ? error.message : '不明なエラー'
      alert(`画像のアップロードに失敗しました。\nエラー: ${errorMessage}`)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDelete = async (image: ImageAsset & { id: string }) => {
    if (
      !confirm(
        `「${image.name}」を削除してもよろしいですか？\n\nこの画像を使用しているLPがある場合、表示されなくなります。`
      )
    ) {
      return
    }

    try {
      if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.includes('Dummy')) {
        alert('開発モードでは削除できません。')
        return
      }

      // Storageから削除
      const storageRef = ref(storage, image.url)
      await deleteObject(storageRef)

      // Firestoreから削除
      await deleteDoc(doc(db, 'image_assets', image.id))

      setImages(images.filter((img) => img.id !== image.id))
      alert('画像を削除しました。')
    } catch (error) {
      console.error('Failed to delete image:', error)
      alert('画像の削除に失敗しました。')
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 画像ファイルかチェック
      if (!file.type.startsWith('image/')) {
        alert('画像ファイルを選択してください')
        return
      }
      setFormData({ ...formData, file, name: formData.name || file.name.replace(/\.[^/.]+$/, '') })
    }
  }

  const filteredImages = images.filter((img) => (filter === 'all' ? true : img.category === filter))

  const getCategoryLabel = (category?: ImageAsset['category']) => {
    switch (category) {
      case 'logo':
        return 'ロゴ'
      case 'hero':
        return 'ヒーロー画像'
      case 'profile':
        return 'プロフィール'
      case 'product':
        return '商品・サービス'
      case 'background':
        return '背景'
      case 'other':
        return 'その他'
      default:
        return '未分類'
    }
  }

  const getCategoryColor = (category?: ImageAsset['category']) => {
    switch (category) {
      case 'logo':
        return 'bg-purple-100 text-purple-800'
      case 'hero':
        return 'bg-blue-100 text-blue-800'
      case 'profile':
        return 'bg-green-100 text-green-800'
      case 'product':
        return 'bg-yellow-100 text-yellow-800'
      case 'background':
        return 'bg-pink-100 text-pink-800'
      case 'other':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
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
          <h1 className="text-3xl font-bold text-gray-900">画像ライブラリ</h1>
          <p className="text-gray-600 mt-1">LP用の画像素材を管理</p>
        </div>
        <div className="flex gap-3">
          <Link href="/lp">
            <Button variant="outline">← LP一覧に戻る</Button>
          </Link>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>📤 画像をアップロード</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>画像をアップロード</DialogTitle>
                <DialogDescription>
                  LP用の画像をアップロードします。5MB以下のJPG、PNG、GIF形式に対応しています。
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file">画像ファイル *</Label>
                  <Input
                    id="file"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    required
                    disabled={isUploading}
                  />
                  {formData.file && (
                    <p className="text-xs text-gray-500">
                      選択: {formData.file.name} ({formatFileSize(formData.file.size)})
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">画像名（任意）</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="例: ロゴ画像 2024"
                    disabled={isUploading}
                  />
                  <p className="text-xs text-gray-500">空欄の場合、ファイル名が使用されます</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">カテゴリ</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: ImageAsset['category']) =>
                      setFormData({ ...formData, category: value })
                    }
                    disabled={isUploading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="logo">ロゴ</SelectItem>
                      <SelectItem value="hero">ヒーロー画像</SelectItem>
                      <SelectItem value="profile">プロフィール</SelectItem>
                      <SelectItem value="product">商品・サービス</SelectItem>
                      <SelectItem value="background">背景</SelectItem>
                      <SelectItem value="other">その他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {isUploading && (
                  <div className="space-y-2">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-sm text-center text-gray-600">
                      アップロード中... {uploadProgress}%
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1"
                    disabled={isUploading}
                  >
                    キャンセル
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isUploading || !formData.file}>
                    {isUploading ? 'アップロード中...' : 'アップロード'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-900">{images.length}</div>
            <p className="text-xs text-gray-600 mt-1">総画像数</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-900">
              {formatFileSize(images.reduce((sum, img) => sum + img.size, 0))}
            </div>
            <p className="text-xs text-gray-600 mt-1">合計サイズ</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-900">
              {images.filter((img) => img.category === 'logo').length}
            </div>
            <p className="text-xs text-gray-600 mt-1">ロゴ</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-900">
              {images.filter((img) => img.category === 'hero').length}
            </div>
            <p className="text-xs text-gray-600 mt-1">ヒーロー画像</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b overflow-x-auto">
        {[
          { key: 'all' as const, label: 'すべて', count: images.length },
          {
            key: 'logo' as const,
            label: 'ロゴ',
            count: images.filter((img) => img.category === 'logo').length,
          },
          {
            key: 'hero' as const,
            label: 'ヒーロー画像',
            count: images.filter((img) => img.category === 'hero').length,
          },
          {
            key: 'profile' as const,
            label: 'プロフィール',
            count: images.filter((img) => img.category === 'profile').length,
          },
          {
            key: 'product' as const,
            label: '商品',
            count: images.filter((img) => img.category === 'product').length,
          },
          {
            key: 'background' as const,
            label: '背景',
            count: images.filter((img) => img.category === 'background').length,
          },
          {
            key: 'other' as const,
            label: 'その他',
            count: images.filter((img) => img.category === 'other').length,
          },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
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

      {filteredImages.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-6xl mb-4">🖼️</div>
            <h3 className="text-lg font-semibold mb-2">画像がありません</h3>
            <p className="text-gray-600 text-center mb-4">
              {filter === 'all'
                ? '画像をアップロードして、LP作成に使用しましょう'
                : `${getCategoryLabel(filter)}の画像はありません`}
            </p>
            {filter === 'all' && (
              <Button onClick={() => setIsDialogOpen(true)}>📤 最初の画像をアップロード</Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredImages.map((image) => (
            <Card key={image.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video relative bg-gray-100">
                <Image
                  src={image.url}
                  alt={image.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              </div>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-sm truncate flex-1">{image.name}</h3>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(image.category)}`}>
                    {getCategoryLabel(image.category)}
                  </span>
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <div>サイズ: {formatFileSize(image.size)}</div>
                  <div>
                    アップロード: {format(image.createdAt.toDate(), 'yyyy/MM/dd', { locale: ja })}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => window.open(image.url, '_blank')}
                  >
                    👁️ 表示
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(image)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs"
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
            画像ライブラリのヒント
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• 推奨画像サイズ: ヒーロー画像 1920x1080px、ロゴ 512x512px</li>
            <li>• ファイルサイズは5MB以下に抑えてください（ページ読み込み速度向上のため）</li>
            <li>• カテゴリ分類しておくと、LP編集時に画像を見つけやすくなります</li>
            <li>• 削除した画像は復元できません。使用中のLPがある場合はご注意ください</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
