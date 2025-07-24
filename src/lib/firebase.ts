
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, memoryLocalCache, persistentLocalCache, memoryLruGarbageCollector } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  localCache: typeof window === 'undefined'
    ? memoryLocalCache()
    : persistentLocalCache({
        cacheSizeBytes: 40 * 1024 * 1024, // 40 MB
        garbageCollector: memoryLruGarbageCollector(),
      }),
});
