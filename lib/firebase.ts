import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Created on first use so the build doesn't need the env vars.
export function app(): FirebaseApp {
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  return getApps().length
    ? getApp()
    : initializeApp({
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        appId,
        // Phone alerts need this. It's the middle part of the app ID (1:THIS:web:...)
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || appId?.split(':')[1],
      })
}

export const getAuthInstance = () => getAuth(app())
export const getDb = () => getFirestore(app())
export const googleProvider = () => new GoogleAuthProvider()