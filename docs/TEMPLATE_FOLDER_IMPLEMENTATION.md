# テンプレートフォルダ機能 実装ドキュメント

## 実装日
2025-11-15

## 概要
メッセージテンプレートを整理するためのフォルダ管理機能を実装しました。テンプレート作成ページにタブUIを追加し、テンプレート作成とフォルダ管理を1つのページで操作できるようにしました。

## 実装内容

### 1. 新規作成ファイル

#### 1.1 UIコンポーネント
- **`src/components/ui/tabs.tsx`**
  - Radix UIベースのタブコンポーネント
  - 依存パッケージ: `@radix-ui/react-tabs`

#### 1.2 テンプレートコンポーネント
- **`src/components/templates/FolderManagement.tsx`**
  - 再利用可能なフォルダ管理コンポーネント
  - フォルダの作成、表示、削除機能
  - カラーラベル選択（8色）

### 2. 変更ファイル

#### 2.1 型定義
**`src/types/firestore.ts`**
```typescript
// 追加された型
export interface TemplateFolder {
  id?: string
  ownerRef: string
  name: string
  description?: string
  color?: string
  createdAt: Timestamp
  updatedAt?: Timestamp
}

// MessageTemplate に folderId フィールドを追加
export interface MessageTemplate {
  // ... existing fields
  folderId?: string // Reference to TemplateFolder
  // ... existing fields
}
```

#### 2.2 メッセージプレビューページ
**`src/app/messages/preview/page.tsx`**
- タブUIを追加（テンプレート作成 / フォルダ管理）
- フォルダ選択機能を追加
- フォルダ一覧の読み込み機能

#### 2.3 サイドバー
**`src/components/layout/Sidebar.tsx`**
- メニュー名を「メッセージプレビュー」から「テンプレート」に変更

#### 2.4 Firestoreセキュリティルール
**`firestore-rules/firestore.rules`**
```javascript
// 追加されたルール
// Template folders collection
match /template_folders/{folderId} {
  allow read: if isAuthenticated() && isOwner(resource.data.ownerRef);
  allow create: if isAuthenticated() && isOwner(request.resource.data.ownerRef);
  allow update: if isAuthenticated() && isOwner(resource.data.ownerRef);
  allow delete: if isAuthenticated() && isOwner(resource.data.ownerRef);
}
```

### 3. 依存パッケージ

新たにインストールが必要なパッケージ：
```bash
npm install @radix-ui/react-tabs
```

## Firestoreデータ構造

### template_folders コレクション
```javascript
{
  ownerRef: string,        // ユーザーID
  name: string,            // フォルダ名
  description?: string,    // 説明（任意）
  color?: string,          // カラーコード（例: "#3B82F6"）
  createdAt: Timestamp,
  updatedAt?: Timestamp
}
```

### message_templates コレクション（更新）
```javascript
{
  ownerRef: string,
  folderId?: string,       // 追加: フォルダID（任意）
  name: string,
  body: string,
  variables: string[],
  channel: 'line' | 'email' | 'sms',
  createdAt: Timestamp,
  updatedAt?: Timestamp
}
```

## 使用方法

### フォルダ作成
1. `/messages/preview` ページにアクセス
2. 「フォルダ管理」タブをクリック
3. 「新規フォルダ作成」ボタンをクリック
4. フォルダ名、説明、カラーを設定
5. 「作成」ボタンをクリック

### テンプレート保存
1. `/messages/preview` ページにアクセス
2. 「テンプレート作成」タブでテンプレートを編集
3. 「💾 テンプレート保存」ボタンをクリック
4. テンプレート名、チャンネル、保存先フォルダを選択
5. 「保存」ボタンをクリック

## トラブルシューティング

### フォルダ作成が失敗する場合

**原因**: Firestoreセキュリティルールが設定されていない

**解決方法**:
1. Firebaseコンソールを開く: https://console.firebase.google.com/project/myloop-fafd7/firestore/rules
2. ルールエディタで `// Message templates collection` の前に以下を追加:
```javascript
// Template folders collection
match /template_folders/{folderId} {
  allow read: if isAuthenticated() && isOwner(resource.data.ownerRef);
  allow create: if isAuthenticated() && isOwner(request.resource.data.ownerRef);
  allow update: if isAuthenticated() && isOwner(resource.data.ownerRef);
  allow delete: if isAuthenticated() && isOwner(resource.data.ownerRef);
}
```
3. 「公開」ボタンをクリック
4. ブラウザをリロード

### ChunkLoadError が発生する場合

**原因**: Next.jsのビルドキャッシュの問題

**解決方法**:
```bash
rm -rf .next
npm run dev
```

ブラウザでハードリフレッシュ（Cmd+Shift+R / Ctrl+Shift+R）

## ファイル構成

```
src/
├── app/
│   └── messages/
│       └── preview/
│           └── page.tsx          # メインページ（タブUI統合）
├── components/
│   ├── layout/
│   │   └── Sidebar.tsx           # サイドバー（メニュー名変更）
│   ├── templates/
│   │   └── FolderManagement.tsx  # フォルダ管理コンポーネント
│   └── ui/
│       └── tabs.tsx              # タブコンポーネント
└── types/
    └── firestore.ts              # Firestore型定義

firestore-rules/
└── firestore.rules               # セキュリティルール
```

## 今後の拡張案

1. **フォルダ内テンプレート一覧表示**
   - フォルダをクリックすると、そのフォルダ内のテンプレート一覧を表示

2. **フォルダの編集機能**
   - フォルダ名、説明、カラーの編集

3. **ドラッグ&ドロップ**
   - テンプレートをドラッグしてフォルダに移動

4. **フォルダの並び替え**
   - 手動でフォルダの順序を変更

5. **検索・フィルター機能**
   - フォルダ名やテンプレート名で検索

## 参考リンク

- Radix UI Tabs: https://www.radix-ui.com/primitives/docs/components/tabs
- Firebase Firestore Rules: https://firebase.google.com/docs/firestore/security/rules-structure
- Next.js App Router: https://nextjs.org/docs/app

## 注意事項

- Firestoreセキュリティルールの変更は必ずFirebaseコンソールで「公開」すること
- `template_folders` コレクションのルールがないと、フォルダ作成がブロックされる
- 本番環境にデプロイする前に、必ずセキュリティルールを確認すること
