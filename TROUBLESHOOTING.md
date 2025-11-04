# 環境変数が認識されない問題のトラブルシューティング

`.env.local`ファイルは存在するのに、環境変数が認識されない場合の診断手順です。

## 🔍 ステップ1: 基本確認

### 1-1. ファイルの配置場所を再確認

VSCodeで開いた状態で、サイドバーを確認してください：

```
MyLoop/
├── .env.local          ← この位置にあるか？
├── package.json        ← この2つが同じ階層
├── next.config.js
├── src/
└── node_modules/
```

**確認方法:**
- VSCodeのサイドバーで、`.env.local`と`package.json`が同じインデントになっているか確認
- もし`.env.local`が`src/`の中や、他のフォルダの中にあったら、ドラッグして一番上の階層に移動

### 1-2. ファイル名を確認

- ファイル名: `.env.local`（小文字、ドットで始まる）
- ❌ 間違い: `.ENV.LOCAL`, `env.local`, `.env.local.txt`

### 1-3. ファイルの内容を確認

VSCodeで`.env.local`を開いて、以下の行が**すべて**含まれているか確認：

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyB-s4NBzE_CUhyh9f3vsjosIv9xPCxPDco
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=myloop-fafd7.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=myloop-fafd7
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=myloop-fafd7.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=47288709729
NEXT_PUBLIC_FIREBASE_APP_ID=1:47288709729:web:6533b9c9c7e0730288b020
```

**チェックポイント:**
- ✅ 各行の`=`の前後にスペースがない
- ✅ 行の最後に余分なスペースがない
- ✅ 値をクォート（`"`や`'`）で囲んでいない（`=`の後はそのまま値を書く）

---

## 🔍 ステップ2: 診断ツールを実行

ターミナルで以下を実行：

```bash
npm run check-env
```

**結果を確認してください：**

### ケース1: 「✅ すべての環境変数が正しく設定されています」

→ ファイルは正しいです。ステップ3に進んでください。

### ケース2: 「❌ .env.localファイルが見つかりません」

→ 配置場所が間違っています。ステップ1-1に戻ってください。

### ケース3: 「⚠️ 一部の環境変数が設定されていません」

→ ファイルの内容を確認してください。ステップ1-3に戻ってください。

---

## 🔍 ステップ3: キャッシュのクリアとサーバー再起動

Next.jsは起動時に環境変数を読み込むため、ファイルを追加・変更した後は必ずサーバーを再起動する必要があります。

### 3-1. 開発サーバーを完全に停止

ターミナルで`Ctrl + C`を押して、サーバーを停止します。

### 3-2. Next.jsのキャッシュをクリア

```bash
rm -rf .next
```

Windowsの場合（PowerShellまたはコマンドプロンプト）：
```bash
rmdir /s .next
```

### 3-3. node_modulesを再インストール（念のため）

```bash
rm -rf node_modules
npm install
```

Windowsの場合：
```bash
rmdir /s node_modules
npm install
```

### 3-4. サーバーを再起動

```bash
npm run dev
```

---

## 🔍 ステップ4: ブラウザで動作確認

### 4-1. ブラウザをリフレッシュ

`http://localhost:3000`を開いて、**強制リロード**します：
- Windows/Linux: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

### 4-2. 開発者ツールでエラー確認

1. `F12`キーを押して開発者ツールを開く
2. `Console`タブを選択
3. エラーメッセージを確認

#### 期待される動作

**正常な場合:**
- エラーなし、または軽微な警告のみ
- ログイン画面が表示される

**まだ問題がある場合:**
- 以下のようなエラーが表示される：
  ```
  Firebase: Error (auth/invalid-api-key)
  ```
  または
  ```
  Firebase: Firebase App named '[DEFAULT]' already exists
  ```

---

## 🔍 ステップ5: ファイルのエンコーディング確認

ファイルのエンコーディングが原因で読み込めないことがあります。

### VSCodeで確認・修正する方法

1. `.env.local`ファイルをVSCodeで開く
2. 画面右下を確認（ステータスバー）
3. エンコーディングが表示されています（例: `UTF-8`）
4. もし`UTF-8`以外（`UTF-16`, `Shift-JIS`など）だった場合：
   - エンコーディング表示をクリック
   - 「エンコーディングを指定して保存」を選択
   - `UTF-8`を選択
5. ファイルを保存（`Ctrl + S`または`Cmd + S`）

### 改行コードを確認

1. `.env.local`ファイルをVSCodeで開く
2. 画面右下で改行コードを確認（`LF`または`CRLF`）
3. もし`CRLF`だった場合、クリックして`LF`に変更
4. ファイルを保存

---

## 🔍 ステップ6: 手動で環境変数を確認

ターミナルで以下を実行して、環境変数がNext.jsに認識されているか確認します：

```bash
npm run dev
```

サーバーが起動したら、**別のターミナルを開いて**以下を実行：

```bash
curl http://localhost:3000/api/check-env
```

このエンドポイントを作成していない場合は、次のセクションで作成します。

---

## 🛠️ デバッグ用APIエンドポイントの作成

環境変数が実際に読み込まれているか確認するためのエンドポイントを作ります。

### ファイルを作成: `src/app/api/check-env/route.ts`

```typescript
import { NextResponse } from 'next/server'

export async function GET() {
  const envVars = {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.substring(0, 10) + '...',
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.substring(0, 15) + '...',
  }

  const allPresent = Object.values(envVars).every(v => v !== undefined)

  return NextResponse.json({
    status: allPresent ? 'OK' : 'ERROR',
    envVars,
    message: allPresent
      ? 'すべての環境変数が設定されています'
      : '一部の環境変数が設定されていません'
  })
}
```

### 確認方法

1. ファイルを保存
2. ブラウザで `http://localhost:3000/api/check-env` を開く
3. 結果を確認：

**正常な場合:**
```json
{
  "status": "OK",
  "message": "すべての環境変数が設定されています",
  "envVars": {
    "NEXT_PUBLIC_FIREBASE_API_KEY": "AIzaSyB-s4...",
    ...
  }
}
```

**エラーの場合:**
```json
{
  "status": "ERROR",
  "message": "一部の環境変数が設定されていません",
  "envVars": {
    "NEXT_PUBLIC_FIREBASE_API_KEY": undefined,
    ...
  }
}
```

---

## 🔍 ステップ7: 最終確認

もし上記すべてを試してもうまくいかない場合、以下の情報を収集してください：

### ターミナルで実行してスクリーンショットを撮る

```bash
# 1. 現在のディレクトリ
pwd

# 2. .env.localの存在確認
ls -la .env.local

# 3. ファイルの内容（最初の5行のみ）
head -5 .env.local

# 4. 診断ツールの結果
npm run check-env

# 5. Node.jsのバージョン
node --version

# 6. npmのバージョン
npm --version
```

### VSCodeのスクリーンショット

1. ファイルツリーの全体（`.env.local`の位置が分かるように）
2. `.env.local`ファイルを開いた状態（内容が見えるように）
3. 右下のステータスバー（エンコーディングと改行コードが分かるように）

---

## 💡 よくある原因と解決方法まとめ

| 問題 | 原因 | 解決方法 |
|------|------|----------|
| ファイルはあるのに認識されない | サーバー起動後にファイルを追加した | サーバーを再起動 |
| 一部の変数だけ認識されない | ファイル内にタイポがある | ファイルの内容を再確認 |
| エラーは出ないが動作しない | キャッシュが残っている | `.next`フォルダを削除して再起動 |
| Windowsで動作しない | 改行コードがCRLFになっている | LFに変更して保存 |
| 値が文字列として認識されない | 値がクォートで囲まれている | クォートを削除 |

---

## 📞 サポート情報

上記すべてを試してもうまくいかない場合は、ステップ7で収集した情報を講師に共有してください。
