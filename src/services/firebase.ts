import { getApp, getApps, initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'AIzaSyDyKd1c6VkqDu88QFfxczxkYmhbwjA5jSs',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'forms-react-app.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'forms-react-app',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'forms-react-app.firebasestorage.app',
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '196476017256',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '1:196476017256:web:2a607dc8a53c859a95f9dd',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? 'G-M6Q8HXPVHP',
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

export const db = getFirestore(app)
