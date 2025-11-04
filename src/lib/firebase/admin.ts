import * as admin from 'firebase-admin'

// エミュレーター使用フラグ
const useEmulator = process.env.FIREBASE_USE_EMULATOR === 'true'

// エミュレーター設定（Admin SDKは環境変数 FIRESTORE_EMULATOR_HOST で自動接続）
if (useEmulator) {
  const host = process.env.FIREBASE_EMU_HOST || 'localhost'
  const firestorePort = process.env.FIREBASE_EMU_FIRESTORE_PORT || '8080'
  const authPort = process.env.FIREBASE_EMU_AUTH_PORT || '9099'

  // Admin SDKはこの環境変数を自動的に検出
  process.env.FIRESTORE_EMULATOR_HOST = `${host}:${firestorePort}`
  process.env.FIREBASE_AUTH_EMULATOR_HOST = `${host}:${authPort}`

  console.log('🔥 Using Firebase Emulators (Admin SDK)')
  console.log(`   Firestore: ${process.env.FIRESTORE_EMULATOR_HOST}`)
  console.log(`   Auth: ${process.env.FIREBASE_AUTH_EMULATOR_HOST}`)
}

// Initialize Firebase Admin SDK for server-side operations
if (!admin.apps.length) {
  const initConfig: admin.AppOptions = useEmulator
    ? {
        projectId: process.env.FIREBASE_PROJECT_ID || 'demo-project',
      }
    : {
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      }

  admin.initializeApp(initConfig)
}

export const adminAuth = admin.auth()
export const adminDb = admin.firestore()
export default admin
export { useEmulator }
