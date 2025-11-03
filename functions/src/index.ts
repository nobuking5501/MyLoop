/**
 * MyLoop Cloud Functions
 *
 * This file exports all Cloud Functions for the MyLoop application.
 * Functions are organized by feature area and deployed to Firebase.
 */

import * as admin from 'firebase-admin'

// Initialize Firebase Admin
// 本番環境ではデフォルト認証を使用
// ローカル環境では.envから環境変数を読み込む（dotenvが必要）
if (process.env.FIREBASE_PRIVATE_KEY) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  })
} else {
  // Firebase Functions環境では自動的にサービスアカウントを使用
  admin.initializeApp()
}

// Export functions by feature area
export * from './line/webhook'
export * from './scenarios/dispatcher'
export * from './bookings/reminder'
export * from './ai/generator'
