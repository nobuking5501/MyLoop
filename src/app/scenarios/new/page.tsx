'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { collection, addDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { useAuth } from '@/contexts/AuthContext'
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
import { Scenario, ScenarioStep } from '@/types/firestore'

export default function NewScenarioPage() {
  const { user } = useAuth()
  const router = useRouter()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [triggerTag, setTriggerTag] = useState('')
  const [steps, setSteps] = useState<ScenarioStep[]>([
    { offsetDays: 0, time: '10:00', templateId: '', conditions: undefined },
  ])
  const [saving, setSaving] = useState(false)

  // AI生成用の状態
  const [aiDialogOpen, setAiDialogOpen] = useState(false)
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiPurpose, setAiPurpose] = useState('')
  const [aiTone, setAiTone] = useState<'formal' | 'casual' | 'friendly' | 'professional'>('friendly')
  const [aiLength, setAiLength] = useState<'short' | 'medium' | 'long'>('medium')
  const [aiContext, setAiContext] = useState('')
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  const handleAddStep = () => {
    setSteps([
      ...steps,
      { offsetDays: steps.length, time: '10:00', templateId: '', conditions: undefined },
    ])
  }

  const handleRemoveStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index))
  }

  const handleStepChange = (index: number, field: keyof ScenarioStep, value: any) => {
    const newSteps = [...steps]
    newSteps[index] = { ...newSteps[index], [field]: value }
    setSteps(newSteps)
  }

  const handleAIGenerate = async () => {
    if (!aiPurpose.trim()) {
      alert('メッセージの目的を入力してください')
      return
    }

    setAiGenerating(true)

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purpose: aiPurpose,
          tone: aiTone,
          length: aiLength,
          context: aiContext,
        }),
      })

      if (!response.ok) {
        throw new Error('Generation failed')
      }

      const data = await response.json()

      // 生成されたメッセージを現在のステップに設定
      const newSteps = [...steps]
      if (!newSteps[currentStepIndex].templateId) {
        newSteps[currentStepIndex].templateId = `generated_${Date.now()}`
      }

      // メッセージテンプレートを作成（実際はFirestoreに保存すべき）
      // ここでは簡易的にtemplateIdにメッセージを含める
      newSteps[currentStepIndex] = {
        ...newSteps[currentStepIndex],
        templateId: data.message,
      }

      setSteps(newSteps)
      setAiDialogOpen(false)
      setAiPurpose('')
      setAiContext('')
    } catch (error) {
      console.error('AI generation error:', error)
      alert('メッセージ生成に失敗しました')
    } finally {
      setAiGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!user) return
    if (!name.trim()) {
      alert('シナリオ名を入力してください')
      return
    }

    setSaving(true)

    try {
      const scenario: Omit<Scenario, 'id'> = {
        ownerRef: user.uid,
        name,
        description,
        steps,
        active: true,
        triggerTag: triggerTag || undefined,
        createdAt: Timestamp.now(),
      }

      await addDoc(collection(db, 'scenarios'), scenario)
      router.push('/scenarios')
    } catch (error) {
      console.error('Failed to save scenario:', error)
      alert('保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">新規シナリオ作成</h1>
        <p className="text-gray-600 mt-1">ステップ配信シナリオを作成します</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
          <CardDescription>シナリオの名前と説明を入力してください</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">シナリオ名 *</Label>
            <Input
              id="name"
              placeholder="例: 初回登録者向けステップ配信"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">説明</Label>
            <Textarea
              id="description"
              placeholder="このシナリオの目的や概要を入力"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="triggerTag">トリガータグ（任意）</Label>
            <Input
              id="triggerTag"
              placeholder="例: 新規登録"
              value={triggerTag}
              onChange={(e) => setTriggerTag(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              このタグが付与されたユーザーに自動的にシナリオが開始されます
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ステップ設定</CardTitle>
          <CardDescription>配信タイミングとメッセージを設定します</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {steps.map((step, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">ステップ {index + 1}</h3>
                {steps.length > 1 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveStep(index)}
                  >
                    削除
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>配信日数（登録後）</Label>
                  <Input
                    type="number"
                    value={step.offsetDays}
                    onChange={(e) =>
                      handleStepChange(index, 'offsetDays', parseInt(e.target.value) || 0)
                    }
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>配信時刻</Label>
                  <Input
                    type="time"
                    value={step.time}
                    onChange={(e) => handleStepChange(index, 'time', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>メッセージ内容</Label>
                <Textarea
                  placeholder="メッセージを入力、またはAIで生成"
                  value={step.templateId}
                  onChange={(e) => handleStepChange(index, 'templateId', e.target.value)}
                  rows={4}
                />
                <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStepIndex(index)}
                      className="w-full mt-2"
                    >
                      <span className="mr-2">🤖</span>
                      AIで文案を生成
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>AI文案生成</DialogTitle>
                      <DialogDescription>
                        Claude AIがメッセージを自動生成します
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>メッセージの目的 *</Label>
                        <Input
                          placeholder="例: 登録直後のお礼と次のアクションへの誘導"
                          value={aiPurpose}
                          onChange={(e) => setAiPurpose(e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>トーン</Label>
                          <select
                            className="w-full h-10 rounded-md border border-input bg-background px-3"
                            value={aiTone}
                            onChange={(e) =>
                              setAiTone(e.target.value as typeof aiTone)
                            }
                          >
                            <option value="friendly">フレンドリー</option>
                            <option value="professional">プロフェッショナル</option>
                            <option value="casual">カジュアル</option>
                            <option value="formal">フォーマル</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label>長さ</Label>
                          <select
                            className="w-full h-10 rounded-md border border-input bg-background px-3"
                            value={aiLength}
                            onChange={(e) =>
                              setAiLength(e.target.value as typeof aiLength)
                            }
                          >
                            <option value="short">短い (50-100文字)</option>
                            <option value="medium">中程度 (150-250文字)</option>
                            <option value="long">長い (300-500文字)</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>追加コンテキスト（任意）</Label>
                        <Textarea
                          placeholder="ビジネス内容、ターゲット層、その他の情報"
                          value={aiContext}
                          onChange={(e) => setAiContext(e.target.value)}
                          rows={3}
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setAiDialogOpen(false)}
                        disabled={aiGenerating}
                      >
                        キャンセル
                      </Button>
                      <Button onClick={handleAIGenerate} disabled={aiGenerating}>
                        {aiGenerating ? '生成中...' : '生成する'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          ))}

          <Button variant="outline" onClick={handleAddStep} className="w-full">
            <span className="mr-2">➕</span>
            ステップを追加
          </Button>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button variant="outline" onClick={() => router.back()}>
          キャンセル
        </Button>
        <Button onClick={handleSave} disabled={saving} className="flex-1">
          {saving ? '保存中...' : '保存'}
        </Button>
      </div>
    </div>
  )
}
