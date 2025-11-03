'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth'
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase/config'
import { User } from '@/types/firestore'

interface AuthContextType {
  user: User | null
  firebaseUser: FirebaseUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// 開発モード判定
const isDevelopmentMode = process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.includes('Dummy') ||
                          process.env.NEXT_PUBLIC_FIREBASE_API_KEY === ''

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 開発モード: ローカルストレージからユーザーを復元
    if (isDevelopmentMode) {
      const savedUser = localStorage.getItem('mock_user')
      if (savedUser) {
        setUser(JSON.parse(savedUser))
      }
      setLoading(false)
      return
    }

    // 本番モード: Firebase認証
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser)

      if (firebaseUser) {
        try {
          // Fetch user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
          if (userDoc.exists()) {
            setUser(userDoc.data() as User)
          } else {
            // Create user document if it doesn't exist
            const newUser: User = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || '',
              roles: ['user'],
              createdAt: Timestamp.now(),
            }
            await setDoc(doc(db, 'users', firebaseUser.uid), newUser)
            setUser(newUser)
          }
        } catch (error) {
          console.error('Firestore error:', error)
        }
      } else {
        setUser(null)
      }

      setLoading(false)
    })

    return unsubscribe
  }, [])

  const signIn = async (email: string, password: string) => {
    if (isDevelopmentMode) {
      // 開発モード: モックログイン
      const mockUser: User = {
        uid: 'dev-user-001',
        email: email || 'dev@example.com',
        name: '開発ユーザー',
        roles: ['user', 'admin'],
        createdAt: Timestamp.now(),
      }
      setUser(mockUser)
      localStorage.setItem('mock_user', JSON.stringify(mockUser))
      return
    }

    // 本番モード: Firebase認証
    await signInWithEmailAndPassword(auth, email, password)
  }

  const signUp = async (email: string, password: string, name: string) => {
    if (isDevelopmentMode) {
      // 開発モード: モックサインアップ
      const mockUser: User = {
        uid: 'dev-user-' + Date.now(),
        email: email,
        name: name,
        roles: ['user'],
        createdAt: Timestamp.now(),
      }
      setUser(mockUser)
      localStorage.setItem('mock_user', JSON.stringify(mockUser))
      return
    }

    // 本番モード: Firebase認証
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)

    // Create user document in Firestore
    const newUser: User = {
      uid: userCredential.user.uid,
      email: email,
      name: name,
      roles: ['user'],
      createdAt: Timestamp.now(),
    }

    await setDoc(doc(db, 'users', userCredential.user.uid), newUser)
  }

  const signOut = async () => {
    if (isDevelopmentMode) {
      // 開発モード: モックログアウト
      setUser(null)
      localStorage.removeItem('mock_user')
      return
    }

    // 本番モード: Firebase認証
    await firebaseSignOut(auth)
  }

  const resetPassword = async (email: string) => {
    if (isDevelopmentMode) {
      // 開発モード: 何もしない
      console.log('Mock password reset for:', email)
      return
    }

    // 本番モード: Firebase認証
    await sendPasswordResetEmail(auth, email)
  }

  const value = {
    user,
    firebaseUser,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
