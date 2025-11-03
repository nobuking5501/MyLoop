# Firebase Emulator クイックスタート

## Emulatorで開発する（実プロジェクト不要）

```bash
# Firebase CLIをインストール
npm install -g firebase-tools

# Emulatorを起動
firebase emulators:start

# 別のターミナルで開発サーバーを起動
npm run dev
```

## .env.localを更新

Emulator用の設定に変更：

```env
NEXT_PUBLIC_FIREBASE_API_KEY=demo-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=localhost
NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-myloop
```

## Emulator UI

http://localhost:4000 でEmulatorの管理画面にアクセスできます。

