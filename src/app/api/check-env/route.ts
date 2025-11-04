import { NextResponse } from 'next/server'

/**
 * 環境変数チェック用APIエンドポイント
 * ブラウザで /api/check-env にアクセスして環境変数の読み込み状況を確認
 */
export async function GET() {
  // NEXT_PUBLIC_ プレフィックスの環境変数を確認
  const envVars = {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY
      ? process.env.NEXT_PUBLIC_FIREBASE_API_KEY.substring(0, 10) + '...'
      : undefined,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
      ? process.env.NEXT_PUBLIC_FIREBASE_APP_ID.substring(0, 15) + '...'
      : undefined,
  }

  // すべての環境変数が設定されているかチェック
  const allPresent = Object.values(envVars).every(v => v !== undefined && v !== 'undefined...')

  // 設定されていない環境変数をリストアップ
  const missingVars = Object.entries(envVars)
    .filter(([_, value]) => value === undefined || value === 'undefined...')
    .map(([key, _]) => key)

  return NextResponse.json({
    status: allPresent ? 'OK' : 'ERROR',
    message: allPresent
      ? '✅ すべての環境変数が正しく設定されています'
      : `❌ 以下の環境変数が設定されていません: ${missingVars.join(', ')}`,
    envVars,
    missingVars: missingVars.length > 0 ? missingVars : null,
    tips: allPresent ? null : [
      '1. .env.localファイルがプロジェクトのルートディレクトリ（package.jsonと同じ階層）にあるか確認してください',
      '2. ファイル名が .env.local（ドットで始まる）であることを確認してください',
      '3. 環境変数を追加・変更した場合は、必ず開発サーバーを再起動してください（Ctrl+C → npm run dev）',
      '4. .nextフォルダを削除してから再起動してみてください（rm -rf .next）'
    ]
  }, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    }
  })
}
