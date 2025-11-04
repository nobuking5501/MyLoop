# Firestore セキュリティルールとインデックスのデプロイ手順

予約作成機能を有効にするには、Firestoreのセキュリティルールとインデックスをデプロイする必要があります。

## 方法1: Firebase コンソールから手動デプロイ（推奨）

### セキュリティルールのデプロイ

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. プロジェクト `myloop-fafd7` を選択
3. 左メニューから「Firestore Database」を選択
4. 「ルール」タブをクリック
5. `firestore-rules/firestore.rules` ファイルの内容をコピー＆ペースト
6. 「公開」ボタンをクリック

### インデックスのデプロイ

1. Firebase Console の Firestore Database ページで「インデックス」タブをクリック
2. 以下のインデックスを手動で作成：

**Events コレクション用インデックス（降順）:**
- コレクション: `events`
- フィールド1: `ownerRef` (昇順)
- フィールド2: `start` (降順)

## 方法2: Firebase CLI でデプロイ

Firebase CLIに適切な権限がある場合：

```bash
# Firebase にログイン（まだの場合）
firebase login

# Firestore ルールとインデックスをデプロイ
firebase deploy --only firestore:rules,firestore:indexes
```

## デプロイ後の確認

1. ブラウザで開発サーバーにアクセス
2. Events ページで「新規予約」ボタンをクリック
3. 予約情報を入力して作成
4. エラーが出る場合は、ブラウザのコンソール（F12）でエラー詳細を確認

## よくあるエラーと対処法

### エラー: "Missing or insufficient permissions"
- **原因**: Firestoreのセキュリティルールがデプロイされていない
- **対処**: 上記の手順でルールをデプロイ

### エラー: "The query requires an index"
- **原因**: Firestoreのインデックスが作成されていない
- **対処**:
  1. エラーメッセージ内のリンクをクリックして自動作成
  2. または、上記の手順でインデックスを手動作成

### エラー: "User not authenticated"
- **原因**: ログインセッションが期限切れ
- **対処**: ログアウトして再度ログイン

## トラブルシューティング

デバッグ情報を確認するには：
1. ブラウザで開発者ツールを開く（F12 または Cmd+Option+I）
2. Console タブを確認
3. 予約作成時に表示されるログを確認：
   - "Creating event with user: ..."
   - "Form data: ..."
   - "New event object: ..."
   - "Event created with ID: ..." （成功時）

エラーが発生した場合、コンソールに詳細なエラーメッセージが表示されます。
