import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import * as dotenv from "dotenv";
dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "aps-mobile-agen-a0755.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "aps-mobile-agen-a0755",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "aps-mobile-agen-a0755.appspot.com",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const ADMIN_EMAIL = "admin@apsagen.com";
const ADMIN_PASS = "admin123456";
const AGEN_ID = process.env.VITE_DEFAULT_AGEN_ID || "agen_utama_01";

async function seedAdmin() {
  console.log(`Menginisialisasi akun admin: ${ADMIN_EMAIL}...`);
  let user;
  try {
    const cred = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASS);
    user = cred.user;
    console.log("Berhasil membuat user di Firebase Auth:", user.uid);
  } catch (error) {
    if (error.code === "auth/email-already-in-use") {
      console.log("Email sudah terdaftar di Firebase Auth. Melakukan sign in untuk sinkronisasi Firestore...");
      const cred = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASS);
      user = cred.user;
    } else {
      console.error("Error Firebase Auth:", error.message);
      return;
    }
  }

  // Buat dokumen di koleksi users
  const userRef = doc(db, "users", user.uid);
  const adminData = {
    uid: user.uid,
    nama: "Admin Utama Agen Sembako",
    email: ADMIN_EMAIL,
    role: "admin",
    agenId: AGEN_ID,
    isActive: true,
    createdAt: new Date().toISOString()
  };

  await setDoc(userRef, adminData, { merge: true });
  console.log("Berhasil menyimpan profil admin di Firestore koleksi 'users':", adminData);
  console.log("\nAkun siap digunakan:");
  console.log("Email   : " + ADMIN_EMAIL);
  console.log("Password: " + ADMIN_PASS);
  process.exit(0);
}

seedAdmin().catch(console.error);
