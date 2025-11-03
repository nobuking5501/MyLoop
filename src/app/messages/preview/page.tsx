'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

export default function MessagesPreviewPage() {
  const [template, setTemplate] = useState(
    'こんにちは、{{name}}さん！\n\nご登録ありがとうございます。\n\n詳細はこちら: {{url}}'
  )
  const [variables, setVariables] = useState({
    name: '山田太郎',
    url: 'https://example.com/info',
  })

  const renderPreview = () => {
    let preview = template
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
      preview = preview.replace(regex, value)
    })
    return preview
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">メッセージプレビュー</h1>
        <p className="text-gray-600 mt-1">変数を差し込んだメッセージの表示を確認</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Template Editor */}
        <Card>
          <CardHeader>
            <CardTitle>テンプレート編集</CardTitle>
            <CardDescription>変数は {'{{変数名}}'} の形式で記述</CardDescription>
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
    </div>
  )
}
