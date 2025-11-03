'use client'

import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Integration } from '@/types/firestore'

type IntegrationProvider = 'line' | 'google' | 'zoom' | 'sheets'

export default function IntegrationsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<IntegrationProvider | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [lineConfig, setLineConfig] = useState({
    channelId: '',
    channelSecret: '',
    accessToken: '',
  })

  const [googleConfig, setGoogleConfig] = useState({
    clientId: '',
    clientSecret: '',
    redirectUri: '',
  })

  const [zoomConfig, setZoomConfig] = useState({
    accountId: '',
    clientId: '',
    clientSecret: '',
  })

  const [sheetsConfig, setSheetsConfig] = useState({
    spreadsheetId: '',
  })

  useEffect(() => {
    if (!user) return

    const loadIntegrations = async () => {
      try {
        // 開発モードの場合は空のまま
        if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.includes('Dummy')) {
          setLoading(false)
          return
        }

        const providers: IntegrationProvider[] = ['line', 'google', 'zoom', 'sheets']

        for (const provider of providers) {
          const docRef = doc(db, 'integrations', `${user.uid}_${provider}`)
          const docSnap = await getDoc(docRef)

          if (docSnap.exists()) {
            const data = docSnap.data() as Integration

            switch (provider) {
              case 'line':
                setLineConfig(data.config)
                break
              case 'google':
                setGoogleConfig(data.config)
                break
              case 'zoom':
                setZoomConfig(data.config)
                break
              case 'sheets':
                setSheetsConfig(data.config)
                break
            }
          }
        }
      } catch (error) {
        console.error('Failed to load integrations:', error)
      } finally {
        setLoading(false)
      }
    }

    loadIntegrations()
  }, [user])

  const handleSave = async (provider: IntegrationProvider, config: any) => {
    if (!user) return

    setSaving(provider)
    setMessage(null)

    try {
      // 開発モードの場合はローカルストレージに保存
      if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.includes('Dummy')) {
        localStorage.setItem(`integration_${provider}`, JSON.stringify(config))
        setMessage({ type: 'success', text: `${getProviderName(provider)}の設定を保存しました（開発モード）` })
        setSaving(null)
        return
      }

      const integration: Integration = {
        ownerRef: user.uid,
        provider,
        config,
        active: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }

      await setDoc(doc(db, 'integrations', `${user.uid}_${provider}`), integration)

      setMessage({ type: 'success', text: `${getProviderName(provider)}の設定を保存しました` })
    } catch (error: any) {
      setMessage({ type: 'error', text: `保存に失敗しました: ${error.message}` })
    } finally {
      setSaving(null)
    }
  }

  const getProviderName = (provider: IntegrationProvider): string => {
    const names = {
      line: 'LINE Messaging API',
      google: 'Google Calendar',
      zoom: 'Zoom',
      sheets: 'Google Sheets',
    }
    return names[provider]
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">連携設定</h1>
        <p className="text-gray-600 mt-1">外部サービスとの連携を設定します</p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* LINE Messaging API */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">💬</span>
            LINE Messaging API
          </CardTitle>
          <CardDescription>
            LINE公式アカウントと連携してメッセージを自動送信
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="line-channel-id">Channel ID</Label>
            <Input
              id="line-channel-id"
              placeholder="1234567890"
              value={lineConfig.channelId}
              onChange={(e) => setLineConfig({ ...lineConfig, channelId: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="line-channel-secret">Channel Secret</Label>
            <Input
              id="line-channel-secret"
              type="password"
              placeholder="••••••••••••••••"
              value={lineConfig.channelSecret}
              onChange={(e) => setLineConfig({ ...lineConfig, channelSecret: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="line-access-token">Channel Access Token</Label>
            <Textarea
              id="line-access-token"
              placeholder="your-channel-access-token"
              value={lineConfig.accessToken}
              onChange={(e) => setLineConfig({ ...lineConfig, accessToken: e.target.value })}
              rows={3}
            />
          </div>
          <Button
            onClick={() => handleSave('line', lineConfig)}
            disabled={saving === 'line'}
            className="w-full md:w-auto"
          >
            {saving === 'line' ? '保存中...' : '保存'}
          </Button>
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
            <strong>取得方法：</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>
                <a
                  href="https://developers.line.biz/console/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline"
                >
                  LINE Developers Console
                </a>
                にアクセス
              </li>
              <li>チャネルを作成してChannel IDとChannel Secretを取得</li>
              <li>Messaging API設定からChannel Access Tokenを発行</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Google Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">📅</span>
            Google Calendar
          </CardTitle>
          <CardDescription>
            Googleカレンダーと連携して予約管理を自動化
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="google-client-id">Client ID</Label>
            <Input
              id="google-client-id"
              placeholder="your-client-id.apps.googleusercontent.com"
              value={googleConfig.clientId}
              onChange={(e) => setGoogleConfig({ ...googleConfig, clientId: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="google-client-secret">Client Secret</Label>
            <Input
              id="google-client-secret"
              type="password"
              placeholder="••••••••••••••••"
              value={googleConfig.clientSecret}
              onChange={(e) =>
                setGoogleConfig({ ...googleConfig, clientSecret: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="google-redirect-uri">Redirect URI</Label>
            <Input
              id="google-redirect-uri"
              placeholder="https://yourdomain.com/api/auth/google/callback"
              value={googleConfig.redirectUri}
              onChange={(e) => setGoogleConfig({ ...googleConfig, redirectUri: e.target.value })}
            />
          </div>
          <Button
            onClick={() => handleSave('google', googleConfig)}
            disabled={saving === 'google'}
            className="w-full md:w-auto"
          >
            {saving === 'google' ? '保存中...' : '保存'}
          </Button>
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
            <strong>取得方法：</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>
                <a
                  href="https://console.cloud.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline"
                >
                  Google Cloud Console
                </a>
                でプロジェクト作成
              </li>
              <li>Google Calendar APIを有効化</li>
              <li>OAuth 2.0クライアントIDを作成</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Zoom */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">🎥</span>
            Zoom
          </CardTitle>
          <CardDescription>
            Zoom会議を自動作成して予約者に送信
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="zoom-account-id">Account ID</Label>
            <Input
              id="zoom-account-id"
              placeholder="your-account-id"
              value={zoomConfig.accountId}
              onChange={(e) => setZoomConfig({ ...zoomConfig, accountId: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zoom-client-id">Client ID</Label>
            <Input
              id="zoom-client-id"
              placeholder="your-zoom-client-id"
              value={zoomConfig.clientId}
              onChange={(e) => setZoomConfig({ ...zoomConfig, clientId: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zoom-client-secret">Client Secret</Label>
            <Input
              id="zoom-client-secret"
              type="password"
              placeholder="••••••••••••••••"
              value={zoomConfig.clientSecret}
              onChange={(e) => setZoomConfig({ ...zoomConfig, clientSecret: e.target.value })}
            />
          </div>
          <Button
            onClick={() => handleSave('zoom', zoomConfig)}
            disabled={saving === 'zoom'}
            className="w-full md:w-auto"
          >
            {saving === 'zoom' ? '保存中...' : '保存'}
          </Button>
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
            <strong>取得方法：</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>
                <a
                  href="https://marketplace.zoom.us/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline"
                >
                  Zoom App Marketplace
                </a>
                でServer-to-Serverアプリを作成
              </li>
              <li>Account ID, Client ID, Client Secretを取得</li>
              <li>必要なスコープ（meeting:write）を追加</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Google Sheets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">📊</span>
            Google Sheets
          </CardTitle>
          <CardDescription>
            顧客情報をスプレッドシートに自動同期
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sheets-spreadsheet-id">Spreadsheet ID</Label>
            <Input
              id="sheets-spreadsheet-id"
              placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
              value={sheetsConfig.spreadsheetId}
              onChange={(e) => setSheetsConfig({ ...sheetsConfig, spreadsheetId: e.target.value })}
            />
          </div>
          <Button
            onClick={() => handleSave('sheets', sheetsConfig)}
            disabled={saving === 'sheets'}
            className="w-full md:w-auto"
          >
            {saving === 'sheets' ? '保存中...' : '保存'}
          </Button>
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
            <strong>取得方法：</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Googleスプレッドシートを作成</li>
              <li>
                URLから Spreadsheet ID を抽出
                <br />
                <span className="text-xs">
                  例: https://docs.google.com/spreadsheets/d/<strong>SPREADSHEET_ID</strong>/edit
                </span>
              </li>
              <li>サービスアカウントと共有</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
