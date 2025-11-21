import { initializeApp, getApps } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getStorage, connectStorageEmulator } from 'firebase/storage'

// エミュレーター使用フラグ
const useEmulator = process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR === 'true'

// エミュレーター設定
const emulatorConfig = {
  host: process.env.NEXT_PUBLIC_FIREBASE_EMU_HOST || 'localhost',
  firestorePort: parseInt(process.env.NEXT_PUBLIC_FIREBASE_EMU_FIRESTORE_PORT || '8080'),
  authPort: parseInt(process.env.NEXT_PUBLIC_FIREBASE_EMU_AUTH_PORT || '9099'),
  storagePort: parseInt(process.env.NEXT_PUBLIC_FIREBASE_EMU_STORAGE_PORT || '9199'),
}

// 開発モード判定（モックデータ使用）
const isDevelopmentMode =
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.includes('Dummy') ||
  !process.env.NEXT_PUBLIC_FIREBASE_API_KEY

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'localhost',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'demo-project.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789:web:abcdef',
}

// Initialize Firebase only once
let app: any
let auth: any
let db: any
let storage: any

if (typeof window !== 'undefined') {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
  auth = getAuth(app)
  db = getFirestore(app)
  storage = getStorage(app)

  // エミュレーター接続
  if (useEmulator) {
    try {
      connectFirestoreEmulator(db, emulatorConfig.host, emulatorConfig.firestorePort)
      connectAuthEmulator(auth, `http://${emulatorConfig.host}:${emulatorConfig.authPort}`, {
        disableWarnings: true,
      })
      connectStorageEmulator(storage, emulatorConfig.host, emulatorConfig.storagePort)
      console.log('🔥 Using Firebase Emulators')
      console.log(`   Firestore: ${emulatorConfig.host}:${emulatorConfig.firestorePort}`)
      console.log(`   Auth: ${emulatorConfig.host}:${emulatorConfig.authPort}`)
      console.log(`   Storage: ${emulatorConfig.host}:${emulatorConfig.storagePort}`)
    } catch (error) {
      console.warn('⚠️  Emulator connection failed:', error)
    }
  } else if (isDevelopmentMode) {
    // 開発モードの場合、Firestoreの接続エラーを無効化
    console.log('🔧 開発モード: Firebase接続は無効化されています（モックデータ使用）')
  }
}

export { auth, db, storage, useEmulator }
export default app
export { isDevelopmentMode }
