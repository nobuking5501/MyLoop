# MyLoop - AI×自動化×共創

**次世代ローンチ支援アプリ**

MyLoopは、UTAGE/Lステップの実運用で使うコア機能を軽量に再構成したサブスクSaaSです。個人起業家が自力で導線を構築できるよう、AI支援と自動化を組み合わせています。

## 🎯 コンセプト

- **AI支援**: Claude APIによるステップメッセージ自動生成、分析レポート
- **自動化**: LINE連携、予約管理、リマインダー、ファネル分析
- **共創**: GitHub + Claude Codeによる協働開発

## 📋 主な機能（MVP Phase 1）

### 1. LINE登録〜ステップ配信
- 登録直後、1日後、3日後などの日数指定配信
- タグ分岐・変数差込・テンプレプレビュー

### 2. 予約管理
- Google Calendar連携による空き時間抽出
- Zoom自動発行と通知
- LINE上でキャンセル・変更対応

### 3. 顧客DB + スプレッドシート連携
- Firestoreに顧客データ保存
- Google Sheetsへ自動反映

### 4. 簡易ダッシュボード
- LP→LINE→予約→成約のファネルKPI表示
- 日次・週次レポート

### 5. AI支援
- ステップメッセージの文案を自動生成
- 将来的に広告分析、CRMスコアリングも拡張

## 🛠 技術スタック

- **フロントエンド**: Next.js 14 (App Router), TypeScript, Shadcn UI, Tailwind CSS
- **バックエンド**: Firebase (Auth, Firestore, Functions, Scheduler)
- **連携API**: LINE Messaging, Zoom, Google Calendar, Google Sheets
- **AI**: Claude API (主要), OpenAI API (任意)
- **テスト**: Vitest, Playwright
- **開発**: TDD, ESLint, Prettier, Commitlint

## 🚀 セットアップ

### 1. 環境変数の設定

\`\`\`bash
cp .env.example .env.local
\`\`\`

`.env.local`に以下の値を設定：
- Firebase設定（API Key, Project ID, など）
- LINE Messaging API（Channel ID, Secret, Access Token）
- Google OAuth & Calendar API
- Zoom API
- Claude API Key

### 2. 依存関係のインストール

\`\`\`bash
npm install
\`\`\`

### 3. Firebase Functions のセットアップ

\`\`\`bash
cd functions
npm install
cd ..
\`\`\`

### 4. 開発サーバー起動

\`\`\`bash
npm run dev
\`\`\`

ブラウザで `http://localhost:3000` を開く

## 🔥 Firestoreルールとインデックスの設定

### ルールとインデックスのデプロイ

Firestore Security RulesとComposite Indexesは、Firebase Consoleまたは CLIでデプロイできます。

#### Firebase Console での設定

1. [Firebase Console](https://console.firebase.google.com/) を開く
2. プロジェクトを選択 → Firestore Database
3. **ルール**タブ:
   - `firestore-rules/firestore.rules` の内容をコピー
   - 公開ボタンをクリック
4. **インデックス**タブ:
   - 複合インデックスが必要な画面（例: `/events`）を開く
   - エラーメッセージ内の自動作成リンクをクリック、または
   - `firestore-rules/firestore.indexes.json` を参照して手動作成

#### CLI でのデプロイ

```bash
# Firestoreルールのみデプロイ
npm run deploy:rules

# 複合インデックスのみデプロイ
npm run deploy:indexes

# 両方まとめてデプロイ
firebase deploy --only firestore
```

### よくある問題: 複合インデックス不足エラー

予約画面（`/events`）で以下のようなエラーが表示される場合があります：

```
The query requires an index. You can create it here: https://console.firebase.google.com/...
```

**解決方法:**
1. エラーメッセージ内のリンクをクリック
2. 「インデックスを作成」ボタンをクリック
3. 数分待つ（インデックス作成には時間がかかります）
4. ページをリロード

または、事前に `npm run deploy:indexes` を実行しておくことで回避できます。

## 🧪 エミュレーター開発（APIキーを配らない運用）

生徒や共同開発者にFirebase APIキーを配布せず、ローカル開発を行う方法です。

### 1. Firebase CLIのインストール

```bash
npm install -g firebase-tools
```

### 2. Firebaseにログイン（初回のみ）

```bash
firebase login
```

### 3. エミュレーターの起動

**別のターミナル**で以下を実行:

```bash
npm run emulators:start
```

エミュレーターUIが起動します:
- UI: http://localhost:4000
- Firestore: localhost:8080
- Auth: localhost:9099
- Functions: localhost:5001

### 4. 環境変数の設定

`.env.local`ファイルに以下を追加:

```env
# エミュレーターを使用
NEXT_PUBLIC_FIREBASE_USE_EMULATOR=true
FIREBASE_USE_EMULATOR=true

# 本番のFirebase設定は不要（または空でOK）
NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-project
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

ターミナルに以下が表示されれば成功:

```
🔥 Using Firebase Emulators
   Firestore: localhost:8080
   Auth: localhost:9099
```

### 6. 動作確認

1. `http://localhost:3000` を開く
2. サインアップしてログイン
3. データがエミュレーター内に保存される（本番には影響なし）
4. エミュレーターUIで確認: `http://localhost:4000`

### エミュレーターデータの保存・復元

開発中のテストデータを保存して再利用できます:

```bash
# データをエクスポート
npm run emulators:export

# 保存したデータをインポートして起動
npm run emulators:import
```

## 🔄 本番環境とエミュレーターの切り替え

### 本番環境で開発する場合

`.env.local`:
```env
NEXT_PUBLIC_FIREBASE_USE_EMULATOR=false
FIREBASE_USE_EMULATOR=false

# 本番のFirebase設定が必要
NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_actual_project_id
# ...
```

### エミュレーターで開発する場合

`.env.local`:
```env
NEXT_PUBLIC_FIREBASE_USE_EMULATOR=true
FIREBASE_USE_EMULATOR=true

# プロジェクトIDのみあればOK
NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-project
```

### 重要な注意点

- ✅ `.env.local`を変更したら、**必ず開発サーバーを再起動**してください
- ✅ エミュレーター起動中は、別ターミナルで`npm run dev`を実行
- ✅ `.env.local`は`.gitignore`に含まれています（Gitにコミットされません）
- ⚠️ 本番APIキーは絶対にGitにコミットしないでください

## 📁 プロジェクト構造

\`\`\`
MyLoop/
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── (auth)/          # 認証関連ページ
│   │   ├── dashboard/       # ダッシュボード
│   │   ├── scenarios/       # シナリオ管理
│   │   ├── events/          # 予約管理
│   │   ├── settings/        # 設定
│   │   └── api/             # API Routes
│   ├── components/          # Reactコンポーネント
│   ├── lib/                 # ユーティリティ
│   │   ├── firebase/        # Firebase設定
│   │   ├── line/            # LINE SDK
│   │   ├── google/          # Google APIs
│   │   └── ai/              # AI統合
│   └── types/               # TypeScript型定義
├── functions/               # Firebase Functions
│   └── src/
│       ├── line/            # LINE Webhook
│       ├── scenarios/       # シナリオディスパッチャー
│       ├── bookings/        # 予約リマインダー
│       └── ai/              # AI処理
├── firestore-rules/         # Firestore Security Rules
├── tests/
│   ├── unit/               # 単体テスト
│   └── e2e/                # E2Eテスト
└── public/                  # 静的ファイル
\`\`\`

## 🧪 テスト

### 単体テスト
\`\`\`bash
npm run test
\`\`\`

### E2Eテスト
\`\`\`bash
npm run test:e2e
\`\`\`

### 動作確認テスト（本番接続）

**前提:** `.env.local`に本番Firebase設定が記載されている

1. 開発サーバー起動
   ```bash
   npm run dev
   ```

2. ブラウザで`http://localhost:3000`を開く

3. サインアップ→ログイン

4. `/events`画面を開く

5. **インデックス不足エラーが出た場合:**
   - エラーメッセージ内のリンクをクリック
   - 「インデックスを作成」ボタンをクリック
   - 数分待ってからリロード

   または事前に:
   ```bash
   npm run deploy:indexes
   ```

6. イベントの作成・編集・削除が正常に動作することを確認

### 動作確認テスト（エミュレーター接続）

**前提:** Firebase CLIがインストール済み（`npm i -g firebase-tools`）

1. `.env.local`を以下のように設定:
   ```env
   NEXT_PUBLIC_FIREBASE_USE_EMULATOR=true
   FIREBASE_USE_EMULATOR=true
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-project
   ```

2. エミュレーター起動（別ターミナル）:
   ```bash
   npm run emulators:start
   ```

3. 開発サーバー起動:
   ```bash
   npm run dev
   ```

4. ターミナルに以下が表示されることを確認:
   ```
   🔥 Using Firebase Emulators
      Firestore: localhost:8080
      Auth: localhost:9099
   ```

5. ブラウザで`http://localhost:3000`を開く

6. サインアップ→ログイン→CRUD操作が正常に動作することを確認

7. エミュレーターUI（`http://localhost:4000`）でデータが保存されていることを確認

## 🔒 セキュリティ

- Firebase Authenticationによる認証
- Firestore Security Rulesで`ownerRef`一致時のみCRUD
- Secret Managerによる機密情報管理
- 監査ログ（`audit_logs`コレクション）

## 📊 データモデル

| コレクション | 主なフィールド |
|-------------|----------------|
| users | uid, name, email, roles |
| contacts | name, lineId, tags, status |
| scenarios | steps[], active |
| message_templates | body, variables[], channel |
| events | type, start, end, zoomUrl, status |
| funnels_daily | date, lpViews, lineRegs, bookings |

詳細は `src/types/firestore.ts` を参照

## 🎨 デザインテーマ

- **カラー**: ミントグリーン系 (#66CC99ベース)
- **UI**: Shadcn UI + Tailwind CSS
- **コンセプト**: シンプルで直感的なUX

## 🤝 開発参加（共創モード）

### Phase 2以降で生徒参加を予定
- GitHub PRベースの共同開発
- Claude Codeによる自動生成・レビュー支援
- 管理画面 `/admin/students` で進捗表示

## 📅 ロードマップ

### Phase 1 (MVP) - ✅ 完了
- ✅ プロジェクト初期化（Next.js 14 + Firebase）
- ✅ 認証システム（Firebase Auth）
- ✅ LINE連携とステップ配信（Webhook + Dispatcher）
- ✅ シナリオ管理UI（ステップ設定）
- ✅ 予約管理UI（イベント表示・フィルタ）
- ✅ ダッシュボード（KPI表示・ファネル分析）
- ✅ AI文案生成（Claude API統合）
- ✅ 連携設定（LINE/Google/Zoom/Sheets）
- ✅ メッセージプレビュー（変数差込）
- ✅ Google Sheets同期機能
- ✅ Firebase Functions（Webhook/Dispatcher/Reminder）

### Phase 2
- Meta/Google広告データ統合
- 週次AIレポート
- CRMスコアリング

### Phase 3
- Stripe決済機能
- PWA化
- プッシュ通知

## 🐛 バグ報告・機能リクエスト

GitHubのIssuesで管理

## 📄 ライセンス

Private (販売用SaaS)

---

**Made with ❤️ by 北村 & 共創チーム**
