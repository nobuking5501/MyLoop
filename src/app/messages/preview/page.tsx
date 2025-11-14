'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { db } from '@/lib/firebase/config'
import { collection, addDoc, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore'
import { useAuth } from '@/contexts/AuthContext'
import type { MessageTemplate, TemplateFolder } from '@/types/firestore'
import FolderManagement from '@/components/templates/FolderManagement'

export default function MessagesPreviewPage() {
  const { user } = useAuth()
  const [template, setTemplate] = useState(
    'こんにちは、{{name}}さん！\n\nご登録ありがとうございます。\n\n詳細はこちら: {{url}}'
  )
  const [variables, setVariables] = useState({
    name: '山田太郎',
    url: 'https://example.com/info',
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [channel, setChannel] = useState<'line' | 'email' | 'sms'>('line')
  const [selectedFolder, setSelectedFolder] = useState<string>('')
  const [folders, setFolders] = useState<(TemplateFolder & { id: string })[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    if (user && isDialogOpen) {
      loadFolders()
    }
  }, [user, isDialogOpen])

  const loadFolders = async () => {
    if (!user) return

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
    }
  }

  const renderPreview = () => {
    let preview = template
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
      preview = preview.replace(regex, value)
    })
    return preview
  }

  // Extract variables from template
  const extractVariables = (text: string): string[] => {
    const matches = text.match(/\{\{(\w+)\}\}/g)
    return matches ? matches : []
  }

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      setSaveStatus({ type: 'error', message: 'テンプレート名を入力してください' })
      return
    }

    if (!user) {
      setSaveStatus({ type: 'error', message: 'ログインが必要です' })
      return
    }

    setIsSaving(true)
    setSaveStatus(null)

    try {
      // Extract variables from template
      const extractedVars = extractVariables(template)

      const newTemplate: Omit<MessageTemplate, 'id'> = {
        ownerRef: user.uid,
        folderId: selectedFolder || undefined,
        name: templateName,
        body: template,
        variables: extractedVars,
        channel: channel,
        createdAt: Timestamp.now(),
      }

      await addDoc(collection(db, 'message_templates'), newTemplate)

      setSaveStatus({ type: 'success', message: 'テンプレートを保存しました！' })
      setTemplateName('')
      setSelectedFolder('')

      // Close dialog after 1.5 seconds
      setTimeout(() => {
        setIsDialogOpen(false)
        setSaveStatus(null)
      }, 1500)
    } catch (error) {
      console.error('Error saving template:', error)
      setSaveStatus({ type: 'error', message: 'テンプレートの保存に失敗しました' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">テンプレート</h1>
        <p className="text-gray-600 mt-1">メッセージテンプレートの作成と管理</p>
      </div>

      <Tabs defaultValue="preview" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="preview">テンプレート作成</TabsTrigger>
          <TabsTrigger value="folders">フォルダ管理</TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Template Editor */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>テンプレート編集</CardTitle>
                <CardDescription>変数は {'{{変数名}}'} の形式で記述</CardDescription>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="default" size="sm">
                    💾 テンプレート保存
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>テンプレートを保存</DialogTitle>
                    <DialogDescription>
                      現在のテンプレートを保存して、後で再利用できるようにします
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="template-name">テンプレート名</Label>
                      <Input
                        id="template-name"
                        placeholder="例: 初回登録お礼メール"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="channel">チャンネル</Label>
                      <Select value={channel} onValueChange={(value: 'line' | 'email' | 'sms') => setChannel(value)}>
                        <SelectTrigger id="channel">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="line">LINE</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="sms">SMS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="folder">保存先フォルダ（任意）</Label>
                      </div>
                      <Select value={selectedFolder || undefined} onValueChange={(value) => setSelectedFolder(value)}>
                        <SelectTrigger id="folder">
                          <SelectValue placeholder="フォルダなし（選択しない）" />
                        </SelectTrigger>
                        <SelectContent>
                          {folders.length === 0 ? (
                            <div className="p-2 text-sm text-gray-500 text-center">
                              フォルダがありません
                            </div>
                          ) : (
                            folders.map((folder) => (
                              <SelectItem key={folder.id} value={folder.id}>
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: folder.color }}
                                  />
                                  {folder.name}
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {selectedFolder && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedFolder('')}
                          className="text-xs"
                        >
                          選択解除
                        </Button>
                      )}
                    </div>
                    {saveStatus && (
                      <div className={`p-3 rounded-md text-sm ${
                        saveStatus.type === 'success'
                          ? 'bg-green-50 text-green-800 border border-green-200'
                          : 'bg-red-50 text-red-800 border border-red-200'
                      }`}>
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
                        setTemplateName('')
                        setSelectedFolder('')
                      }}
                      disabled={isSaving}
                    >
                      キャンセル
                    </Button>
                    <Button onClick={handleSaveTemplate} disabled={isSaving}>
                      {isSaving ? '保存中...' : '保存'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template">メッセージテンプレート</Label>
              <Textarea
                id="template"
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                rows={10}
                placeholder="メッセージを入力..."
              />
            </div>

            <div className="space-y-3">
              <Label>変数設定</Label>
              {Object.entries(variables).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <Label htmlFor={`var-${key}`} className="text-sm">
                    {'{{'}{key}{'}}'}
                  </Label>
                  <Input
                    id={`var-${key}`}
                    value={value}
                    onChange={(e) =>
                      setVariables({ ...variables, [key]: e.target.value })
                    }
                  />
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              onClick={() =>
                setVariables({ ...variables, [`var${Date.now()}`]: '' })
              }
              className="w-full"
            >
              ➕ 変数を追加
            </Button>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>プレビュー</CardTitle>
            <CardDescription>実際に送信されるメッセージ</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 rounded-lg p-4 min-h-[300px] font-sans whitespace-pre-wrap">
              {renderPreview()}
            </div>

            <div className="mt-4 text-sm text-gray-600 space-y-1">
              <p>💡 Tips:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>変数は自動的に値に置き換えられます</li>
                <li>改行やスペースもそのまま反映されます</li>
                <li>
                  よく使う変数: {'{{name}}'}, {'{{email}}'}, {'{{url}}'}
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sample Templates */}
      <Card>
        <CardHeader>
          <CardTitle>サンプルテンプレート</CardTitle>
          <CardDescription>クリックして使用できます</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            {
              name: '初回登録お礼',
              template:
                'こんにちは、{{name}}さん！\n\nご登録いただきありがとうございます。\n\nこれから役立つ情報をお届けしていきますね。\n\nまずはこちらをご覧ください：\n{{url}}',
            },
            {
              name: '予約確認',
              template:
                '{{name}}さん\n\n予約を承りました！📅\n\n日時: {{datetime}}\n場所: {{location}}\n\n当日お会いできるのを楽しみにしています。',
            },
            {
              name: '限定オファー',
              template:
                '{{name}}さん限定！🎁\n\n特別なご案内があります。\n\n期間限定で{{discount}}%OFFでご提供中です。\n\n詳細はこちら: {{url}}',
            },
          ].map((sample) => (
            <button
              key={sample.name}
              onClick={() => setTemplate(sample.template)}
              className="w-full text-left p-3 border rounded hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <div className="font-medium text-sm">{sample.name}</div>
              <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                {sample.template}
              </div>
            </button>
          ))}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="folders" className="mt-6">
          <FolderManagement onFolderChange={loadFolders} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
