import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyPlaceholderKeyForSparkPlan",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "aps-mobile-agen-a0755.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "aps-mobile-agen-a0755",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "aps-mobile-agen-a0755.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789012:web:abcdef1234567890"
};

export const DEFAULT_AGEN_ID = import.meta.env.VITE_DEFAULT_AGEN_ID || "agen_utama_01";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

let firestoreDb;
try {
  firestoreDb = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  });
} catch (error) {
  console.warn("Fallback persistent cache:", error);
  firestoreDb = initializeFirestore(app, {});
}

export const db = firestoreDb;
export default app;
