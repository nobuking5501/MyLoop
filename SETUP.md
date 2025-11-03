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

✅ **完了済み**: Firebase本番環境の設定が`.env.local`に設定されています。

```bash
# 設定内容を確認
cat .env.local
```

必要なAPIキー：
- ✅ **Firebase（設定済み）** - プロジェクトID: `myloop-fafd7`
- ⏳ LINE Messaging API（任意）- LINE Developers Consoleで取得
- ⏳ Claude API（任意）- Anthropic Consoleで取得
- ⏳ Google Calendar/Sheets（任意）- Google Cloud Consoleで取得
- ⏳ Zoom（任意）- Zoom App Marketplaceで取得

### 2. Firebaseプロジェクト作成

✅ **完了済み**: Firebaseプロジェクト `myloop-fafd7` が作成されています。

プロジェクトURL: https://console.firebase.google.com/project/myloop-fafd7/overview

#### 設定済みの内容：
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyB-s4NBzE_CUhyh9f3vsjosIv9xPCxPDco
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=myloop-fafd7.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=myloop-fafd7
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=myloop-fafd7.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=47288709729
NEXT_PUBLIC_FIREBASE_APP_ID=1:47288709729:web:6533b9c9c7e0730288b020
```

### 3. Firebase Authenticationを有効化

⚠️ **要対応**: 以下のステップでAuthenticationを有効化してください。

1. [Firebase Console](https://console.firebase.google.com/project/myloop-fafd7/authentication) にアクセス
2. 「始める」をクリック
3. 「Sign-in method」タブ
4. 「メール/パスワード」を有効化
5. 保存

### 4. Firestoreを有効化

✅ **完了済み**: Firestoreデータベースが作成され、セキュリティルールとインデックスがデプロイされています。

```bash
# デプロイ済みの内容
✔ Firestore database (default) created
✔ Security rules deployed
✔ Indexes deployed
```

確認URL: https://console.firebase.google.com/project/myloop-fafd7/firestore

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
