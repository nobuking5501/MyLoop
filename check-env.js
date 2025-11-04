#!/usr/bin/env node

/**
 * 環境変数チェックスクリプト
 * 生徒さんの環境で.env.localが正しく読み込まれているか確認するためのツール
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(60));
console.log('🔍 MyLoop 環境変数チェックツール');
console.log('='.repeat(60));
console.log();

// 1. プロジェクトのルートディレクトリを確認
const rootDir = process.cwd();
console.log('📁 プロジェクトディレクトリ:');
console.log(`   ${rootDir}`);
console.log();

// 2. .env.localファイルの存在確認
const envLocalPath = path.join(rootDir, '.env.local');
const envLocalExists = fs.existsSync(envLocalPath);

console.log('📄 .env.localファイルの確認:');
if (envLocalExists) {
  console.log('   ✅ .env.local ファイルが見つかりました');

  // ファイルサイズを確認
  const stats = fs.statSync(envLocalPath);
  console.log(`   📊 ファイルサイズ: ${stats.size} bytes`);

  // ファイル内容をプレビュー（最初の5行のみ、値は隠す）
  try {
    const content = fs.readFileSync(envLocalPath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    console.log(`   📝 設定項目数: ${lines.length}行`);
    console.log();
    console.log('   環境変数のキー一覧:');
    lines.slice(0, 10).forEach(line => {
      const key = line.split('=')[0];
      if (key) {
        console.log(`   - ${key}`);
      }
    });
  } catch (error) {
    console.log(`   ⚠️  ファイル読み込みエラー: ${error.message}`);
  }
} else {
  console.log('   ❌ .env.local ファイルが見つかりません');
  console.log('   📍 配置すべき場所:');
  console.log(`      ${envLocalPath}`);
}
console.log();

// 3. 他の.envファイルの確認
console.log('🔎 その他の環境ファイル:');
const envFiles = ['.env', '.env.development', '.env.production', '.env.local.txt', 'env.local'];
envFiles.forEach(fileName => {
  const filePath = path.join(rootDir, fileName);
  if (fs.existsSync(filePath)) {
    console.log(`   ⚠️  ${fileName} が見つかりました（間違ったファイル名の可能性）`);
  }
});
console.log();

// 4. Next.jsで読み込まれる環境変数を確認
console.log('🌍 環境変数の確認:');

// .env.localを手動でパースして確認
if (envLocalExists) {
  try {
    const content = fs.readFileSync(envLocalPath, 'utf8');
    const lines = content.split('\n');
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          let value = valueParts.join('=').trim();
          // クォートを削除
          if ((value.startsWith('"') && value.endsWith('"')) ||
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          process.env[key.trim()] = value;
        }
      }
    });
  } catch (error) {
    console.log(`   ⚠️  ファイル解析エラー: ${error.message}`);
  }
}

const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
];

let allPresent = true;
requiredEnvVars.forEach(key => {
  const value = process.env[key];
  if (value) {
    // 値の最初の10文字だけ表示
    const preview = value.substring(0, 10) + '...';
    console.log(`   ✅ ${key}: ${preview}`);
  } else {
    console.log(`   ❌ ${key}: 未設定`);
    allPresent = false;
  }
});
console.log();

// 5. 診断結果とアドバイス
console.log('='.repeat(60));
console.log('📋 診断結果:');
console.log('='.repeat(60));

if (!envLocalExists) {
  console.log('❌ 問題: .env.localファイルが見つかりません');
  console.log();
  console.log('📝 解決方法:');
  console.log('1. Googleドライブからダウンロードした.env.localファイルを');
  console.log('   プロジェクトのルートディレクトリに配置してください');
  console.log();
  console.log('2. ファイル名が正しいか確認してください');
  console.log('   - 正しい: .env.local (ドットで始まる)');
  console.log('   - 間違い: env.local, .env.local.txt など');
  console.log();
  console.log('3. Windowsの場合、エクスプローラーの設定で');
  console.log('   「ファイル名拡張子」を表示する設定にしてください');
} else if (!allPresent) {
  console.log('⚠️  問題: .env.localファイルは存在しますが、一部の環境変数が設定されていません');
  console.log();
  console.log('📝 解決方法:');
  console.log('1. .env.localファイルの内容を確認してください');
  console.log('2. 上記の❌マークがついている環境変数が設定されているか確認してください');
  console.log('3. 開発サーバーを再起動してください:');
  console.log('   - Ctrl+C でサーバーを停止');
  console.log('   - npm run dev で再起動');
} else {
  console.log('✅ すべての環境変数が正しく設定されています！');
  console.log();
  console.log('📝 次のステップ:');
  console.log('1. 開発サーバーを起動してください: npm run dev');
  console.log('2. ブラウザで http://localhost:3000 を開いてください');
  console.log('3. ブラウザの開発者ツール(F12)でエラーがないか確認してください');
}

console.log();
console.log('='.repeat(60));
console.log('💡 このスクリプトを実行したタイミングでの確認です。');
console.log('   Next.jsの開発サーバーは、起動時に環境変数を読み込みます。');
console.log('   .env.localを変更した場合は、必ずサーバーを再起動してください。');
console.log('='.repeat(60));
