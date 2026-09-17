import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyAeLBmDEff8X9_hF_pXTL0-kfeSuX6XD68",
  authDomain: "aps-agen-kasir.firebaseapp.com",
  projectId: "aps-agen-kasir",
  storageBucket: "aps-agen-kasir.firebasestorage.app",
  messagingSenderId: "440756010514",
  appId: "1:440756010514:web:f87c35ee568e2ad4b1e2cb",
  measurementId: "G-PHVY4J24N3"
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
