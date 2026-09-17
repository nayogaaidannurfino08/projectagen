import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyCss4pe9JSKiHi06NSLm-20vfgLoE2eL9g",
  authDomain: "aps-mobile-agen.firebaseapp.com",
  projectId: "aps-mobile-agen",
  storageBucket: "aps-mobile-agen.firebasestorage.app",
  messagingSenderId: "349786174588",
  appId: "1:349786174588:web:8672bd4c99533a377785f9"
};

export const DEFAULT_AGEN_ID = "agen_utama_01";

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
