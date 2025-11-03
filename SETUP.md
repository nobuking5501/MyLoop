# MyLoop セットアップガイド

## 🚀 クイックスタート

### Windows PowerShell での起動

```powershell
# 1. プロジェクトディレクトリに移動
cd C:\Users\user\Desktop\MyLoop

# 2. 依存関係をインストール（初回のみ）
npm install

# 3. 開発サーバー起動
npm run dev

# 4. ブラウザでアクセス
# http://localhost:3000
```

### WSL (推奨) での起動

```bash
# 1. WSLターミナルを開く
cd /mnt/c/Users/user/Desktop/MyLoop

# 2. 開発サーバー起動
npm run dev

# 3. ブラウザでアクセス
# http://localhost:3000
```

## ⚙️ 初期設定

### 1. 環境変数の設定

```powershell
# .env.exampleをコピー
copy .env.example .env.local

# .env.localを編集してAPIキーを設定
notepad .env.local
```

必要なAPIキー：
- ✅ Firebase（必須）- プロジェクト作成後、設定から取得
- ⏳ LINE Messaging API（任意）- LINE Developers Consoleで取得
- ⏳ Claude API（任意）- Anthropic Consoleで取得
- ⏳ Google Calendar/Sheets（任意）- Google Cloud Consoleで取得
- ⏳ Zoom（任意）- Zoom App Marketplaceで取得

### 2. Firebaseプロジェクト作成

1. [Firebase Console](https://console.firebase.google.com/)にアクセス
2. 「プロジェクトを追加」をクリック
3. プロジェクト名: `myloop` (または任意の名前)
4. Analyticsは任意で有効化
5. プロジェクト設定 → 全般 → マイアプリ → ウェブアプリを追加
6. 表示される設定値を`.env.local`にコピー

#### Firebase設定値の例：
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=myloop-xxxxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=myloop-xxxxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=myloop-xxxxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:xxxxx
```

### 3. Firebase Authenticationを有効化

1. Firebase Console → Authentication
2. 「始める」をクリック
3. 「Sign-in method」タブ
4. 「メール/パスワード」を有効化

### 4. Firestoreを有効化

1. Firebase Console → Firestore Database
2. 「データベースを作成」
3. 「本番環境モードで開始」を選択
4. ロケーション: `asia-northeast1` (東京)
5. Security Rulesをデプロイ:

```bash
# Firebase CLIをインストール（初回のみ）
npm install -g firebase-tools

# Firebaseにログイン
firebase login

# Firebaseプロジェクトを初期化
firebase init

# Firestoreのみを選択
# - Firestore Rules: firestore-rules/firestore.rules
# - Firestore Indexes: firestore-rules/firestore.indexes.json

# デプロイ
firebase deploy --only firestore
```

## 🧪 動作確認

### 1. ログイン画面の確認
- http://localhost:3000/login にアクセス
- 「アカウントを作成」からサインアップ

### 2. ダッシュボードの確認
- ログイン後、自動的にダッシュボードに遷移
- KPIカードが表示されることを確認

### 3. 各機能の確認
- ✅ シナリオ管理: http://localhost:3000/scenarios
- ✅ 予約管理: http://localhost:3000/events
- ✅ 連携設定: http://localhost:3000/settings/integrations
- ✅ メッセージプレビュー: http://localhost:3000/messages/preview

## 🔧 トラブルシューティング

### `next: command not found` エラー

```powershell
# node_modulesを削除して再インストール
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

### ポート3000が使用中

```powershell
# 別のポートで起動
$env:PORT=3001
npm run dev
```

### Firebase接続エラー

1. `.env.local`のFirebase設定値を確認
2. Firebase Consoleで認証とFirestoreが有効化されているか確認
3. ブラウザのコンソールでエラーメッセージを確認

## 📦 Firebase Functionsのデプロイ（オプション）

```bash
# Functionsディレクトリに移動
cd functions

# 依存関係をインストール
npm install

# ビルド
npm run build

# デプロイ
firebase deploy --only functions
```

## 🎯 次のステップ

1. ✅ Firebase設定完了
2. ✅ ローカルで動作確認
3. ⏳ LINE Messaging API連携（実際のLINEアカウントと連携）
4. ⏳ Claude API連携（AI文案生成を有効化）
5. ⏳ 本番環境へのデプロイ

## 📚 参考リンク

- [Next.js ドキュメント](https://nextjs.org/docs)
- [Firebase ドキュメント](https://firebase.google.com/docs)
- [LINE Messaging API](https://developers.line.biz/ja/docs/messaging-api/)
- [Claude API](https://docs.anthropic.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Shadcn UI](https://ui.shadcn.com/)

---

**困ったときは README.md も確認してください！**
