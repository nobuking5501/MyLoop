'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { db } from '@/lib/firebase/config'
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  Timestamp,
  orderBy,
} from 'firebase/firestore'
import { useAuth } from '@/contexts/AuthContext'
import type { TemplateFolder } from '@/types/firestore'

interface FolderManagementProps {
  onFolderChange?: () => void
  showCreateButton?: boolean
}

export default function FolderManagement({ onFolderChange, showCreateButton = true }: FolderManagementProps) {
  const { user } = useAuth()
  const [folders, setFolders] = useState<(TemplateFolder & { id: string })[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [folderName, setFolderName] = useState('')
  const [folderDescription, setFolderDescription] = useState('')
  const [selectedColor, setSelectedColor] = useState('#3B82F6')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  )

  const colors = [
    { name: 'ブルー', value: '#3B82F6' },
    { name: 'グリーン', value: '#10B981' },
    { name: 'パープル', value: '#8B5CF6' },
    { name: 'ピンク', value: '#EC4899' },
    { name: 'オレンジ', value: '#F59E0B' },
    { name: 'レッド', value: '#EF4444' },
    { name: 'グレー', value: '#6B7280' },
    { name: 'イエロー', value: '#EAB308' },
  ]

  useEffect(() => {
    if (user) {
      loadFolders()
    }
  }, [user])

  const loadFolders = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const q = query(
        collection(db, 'template_folders'),
        where('ownerRef', '==', user.uid),
        orderBy('createdAt', 'desc')
      )
      const querySnapshot = await getDocs(q)
      const foldersData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as (TemplateFolder & { id: string })[]
      setFolders(foldersData)
    } catch (error) {
      console.error('Error loading folders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateFolder = async () => {
    if (!folderName.trim()) {
      setSaveStatus({ type: 'error', message: 'フォルダ名を入力してください' })
      return
    }

    if (!user) {
      setSaveStatus({ type: 'error', message: 'ログインが必要です' })
      return
    }

    setIsSaving(true)
    setSaveStatus(null)

    try {
      const newFolder: Omit<TemplateFolder, 'id'> = {
        ownerRef: user.uid,
        name: folderName,
        description: folderDescription || undefined,
        color: selectedColor,
        createdAt: Timestamp.now(),
      }

      await addDoc(collection(db, 'template_folders'), newFolder)

      setSaveStatus({ type: 'success', message: 'フォルダを作成しました！' })
      setFolderName('')
      setFolderDescription('')
      setSelectedColor('#3B82F6')

      // Reload folders
      await loadFolders()
      onFolderChange?.()

      // Close dialog after 1 second
      setTimeout(() => {
        setIsDialogOpen(false)
        setSaveStatus(null)
      }, 1000)
    } catch (error) {
      console.error('Error creating folder:', error)
      setSaveStatus({ type: 'error', message: 'フォルダの作成に失敗しました' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm('このフォルダを削除してもよろしいですか？')) return

    try {
      await deleteDoc(doc(db, 'template_folders', folderId))
      await loadFolders()
      onFolderChange?.()
    } catch (error) {
      console.error('Error deleting folder:', error)
      alert('フォルダの削除に失敗しました')
    }
  }

  return (
    <div className="space-y-6">
      {showCreateButton && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">フォルダ管理</h2>
            <p className="text-gray-600 mt-1">テンプレートを整理するためのフォルダを管理</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>📁 新規フォルダ作成</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新規フォルダ作成</DialogTitle>
                <DialogDescription>テンプレートを整理するためのフォルダを作成します</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="folder-name">フォルダ名</Label>
                  <Input
                    id="folder-name"
                    placeholder="例: 初回登録用"
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="folder-description">説明（任意）</Label>
                  <Textarea
                    id="folder-description"
                    placeholder="このフォルダの用途や説明を入力"
                    value={folderDescription}
                    onChange={(e) => setFolderDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>カラー</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {colors.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setSelectedColor(color.value)}
                        className={`h-12 rounded-md transition-all ${
                          selectedColor === color.value
                            ? 'ring-2 ring-offset-2 ring-gray-900 scale-110'
                            : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
                {saveStatus && (
                  <div
                    className={`p-3 rounded-md text-sm ${
                      saveStatus.type === 'success'
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                  >
                    {saveStatus.message}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false)
                    setSaveStatus(null)
                    setFolderName('')
                    setFolderDescription('')
                  }}
                  disabled={isSaving}
                >
                  キャンセル
                </Button>
                <Button onClick={handleCreateFolder} disabled={isSaving}>
                  {isSaving ? '作成中...' : '作成'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">読み込み中...</CardContent>
        </Card>
      ) : folders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-gray-400 mb-4">📁</div>
            <p className="text-gray-600 mb-4">フォルダがまだありません</p>
            <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
              最初のフォルダを作成
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {folders.map((folder) => (
            <Card key={folder.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: folder.color }}
                    />
                    <CardTitle className="text-lg">{folder.name}</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteFolder(folder.id)
                    }}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    🗑️
                  </Button>
                </div>
                {folder.description && (
                  <CardDescription className="mt-2 line-clamp-2">{folder.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-500">
                  作成日:{' '}
                  {folder.createdAt?.toDate
                    ? new Date(folder.createdAt.toDate()).toLocaleDateString('ja-JP')
                    : '不明'}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
