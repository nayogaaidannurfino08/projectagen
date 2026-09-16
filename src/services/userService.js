import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where,
  onSnapshot
} from "firebase/firestore";
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  signOut 
} from "firebase/auth";
import { db, auth, firebaseConfig, DEFAULT_AGEN_ID } from "../firebase/config";

const COLLECTION_NAME = "users";

export const DEFAULT_DEMO_USERS = [
  {
    uid: "admin_uid_01",
    email: "admin@apsagen.com",
    nama: "Admin Toko Utama",
    role: "admin",
    status: "aktif",
    agenId: DEFAULT_AGEN_ID,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString()
  },
  {
    uid: "kasir_uid_01",
    email: "kasir@apsagen.com",
    nama: "Kasir Shift Pagi",
    role: "kasir",
    status: "aktif",
    agenId: DEFAULT_AGEN_ID,
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString()
  },
  {
    uid: "kasir_uid_02",
    email: "kasir2@apsagen.com",
    nama: "Kasir Shift Sore",
    role: "kasir",
    status: "nonaktif",
    agenId: DEFAULT_AGEN_ID,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString()
  }
];

export const getUserProfile = async (uid) => {
  if (import.meta.env.VITE_FIREBASE_API_KEY?.includes("Placeholder")) {
    const raw = localStorage.getItem("demo_users_aps_agen");
    const users = raw ? JSON.parse(raw) : DEFAULT_DEMO_USERS;
    return users.find(u => u.uid === uid) || null;
  }

  const docRef = doc(db, COLLECTION_NAME, uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { uid: docSnap.id, ...docSnap.data() };
  }
  return null;
};

export const setUserProfile = async (uid, data) => {
  const payload = {
    uid,
    nama: data.nama || "Pengguna",
    role: data.role || "kasir",
    agenId: data.agenId || DEFAULT_AGEN_ID,
    status: data.status || "aktif",
    email: data.email || "",
    updatedAt: new Date().toISOString()
  };

  if (import.meta.env.VITE_FIREBASE_API_KEY?.includes("Placeholder")) {
    const raw = localStorage.getItem("demo_users_aps_agen");
    let users = raw ? JSON.parse(raw) : [...DEFAULT_DEMO_USERS];
    const exists = users.find(u => u.uid === uid);
    if (exists) {
      users = users.map(u => u.uid === uid ? { ...u, ...payload } : u);
    } else {
      users.push(payload);
    }
    localStorage.setItem("demo_users_aps_agen", JSON.stringify(users));
    return payload;
  }

  const docRef = doc(db, COLLECTION_NAME, uid);
  await setDoc(docRef, payload, { merge: true });
  return payload;
};

export const getUsersList = async (agenId = DEFAULT_AGEN_ID) => {
  if (import.meta.env.VITE_FIREBASE_API_KEY?.includes("Placeholder")) {
    const raw = localStorage.getItem("demo_users_aps_agen");
    const users = raw ? JSON.parse(raw) : DEFAULT_DEMO_USERS;
    if (!raw) localStorage.setItem("demo_users_aps_agen", JSON.stringify(DEFAULT_DEMO_USERS));
    return users;
  }

  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("agenId", "==", agenId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
  } catch (err) {
    const raw = localStorage.getItem("demo_users_aps_agen");
    return raw ? JSON.parse(raw) : DEFAULT_DEMO_USERS;
  }
};

export const subscribeUsers = (agenId = DEFAULT_AGEN_ID, callback) => {
  if (import.meta.env.VITE_FIREBASE_API_KEY?.includes("Placeholder")) {
    const raw = localStorage.getItem("demo_users_aps_agen");
    const users = raw ? JSON.parse(raw) : DEFAULT_DEMO_USERS;
    if (!raw) localStorage.setItem("demo_users_aps_agen", JSON.stringify(DEFAULT_DEMO_USERS));
    callback(users);
    return () => {};
  }

  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("agenId", "==", agenId)
    );
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
      callback(data);
    }, (error) => {
      console.warn("subscribeUsers error, fallback:", error);
      const raw = localStorage.getItem("demo_users_aps_agen");
      callback(raw ? JSON.parse(raw) : DEFAULT_DEMO_USERS);
    });
  } catch (err) {
    const raw = localStorage.getItem("demo_users_aps_agen");
    callback(raw ? JSON.parse(raw) : DEFAULT_DEMO_USERS);
    return () => {};
  }
};

/**
 * Buat akun pengguna baru (Auth + Firestore) tanpa logout admin yang sedang aktif
 */
export const createKasirAccount = async ({
  email,
  password,
  nama,
  role = "kasir",
  agenId = DEFAULT_AGEN_ID
}) => {
  if (!email || !password || !nama) {
    throw new Error("Mohon lengkapi email, password, dan nama pengguna.");
  }

  if (password.length < 6) {
    throw new Error("Password minimal 6 karakter.");
  }

  if (import.meta.env.VITE_FIREBASE_API_KEY?.includes("Placeholder")) {
    const raw = localStorage.getItem("demo_users_aps_agen");
    let users = raw ? JSON.parse(raw) : [...DEFAULT_DEMO_USERS];
    
    // Check if email already exists
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error("Email ini sudah digunakan oleh akun lain.");
    }

    const newUser = {
      uid: "user_" + Date.now(),
      email: email.trim(),
      nama: nama.trim(),
      role,
      status: "aktif",
      agenId,
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    localStorage.setItem("demo_users_aps_agen", JSON.stringify(users));
    return newUser;
  }

  // Live Firebase: Use secondary app instance so admin remains authenticated
  const secondaryAppName = "SecondaryUserCreator_" + Date.now();
  const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
  const secondaryAuth = getAuth(secondaryApp);

  try {
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email.trim(), password);
    const newUid = userCredential.user.uid;

    const payload = {
      uid: newUid,
      email: email.trim(),
      nama: nama.trim(),
      role,
      status: "aktif",
      agenId,
      createdAt: new Date().toISOString()
    };

    // Save profile to main Firestore instance
    await setDoc(doc(db, COLLECTION_NAME, newUid), payload);

    // Sign out from secondary auth instance
    await signOut(secondaryAuth);

    return payload;
  } catch (err) {
    let msg = err.message;
    if (err.code === "auth/email-already-in-use") {
      msg = "Email sudah terdaftar di sistem. Gunakan email lain.";
    } else if (err.code === "auth/invalid-email") {
      msg = "Format email tidak valid.";
    } else if (err.code === "auth/weak-password") {
      msg = "Password terlalu lemah, minimal 6 karakter.";
    }
    throw new Error(msg);
  }
};

export const updateUserRole = async (uid, newRole) => {
  if (import.meta.env.VITE_FIREBASE_API_KEY?.includes("Placeholder")) {
    const raw = localStorage.getItem("demo_users_aps_agen");
    let users = raw ? JSON.parse(raw) : [...DEFAULT_DEMO_USERS];
    users = users.map(u => u.uid === uid ? { ...u, role: newRole, updatedAt: new Date().toISOString() } : u);
    localStorage.setItem("demo_users_aps_agen", JSON.stringify(users));
    return;
  }

  const docRef = doc(db, COLLECTION_NAME, uid);
  await updateDoc(docRef, { role: newRole, updatedAt: new Date().toISOString() });
};

export const toggleUserStatus = async (uid, currentStatus) => {
  const newStatus = currentStatus === "aktif" ? "nonaktif" : "aktif";

  if (import.meta.env.VITE_FIREBASE_API_KEY?.includes("Placeholder")) {
    const raw = localStorage.getItem("demo_users_aps_agen");
    let users = raw ? JSON.parse(raw) : [...DEFAULT_DEMO_USERS];
    users = users.map(u => u.uid === uid ? { ...u, status: newStatus, updatedAt: new Date().toISOString() } : u);
    localStorage.setItem("demo_users_aps_agen", JSON.stringify(users));
    return newStatus;
  }

  const docRef = doc(db, COLLECTION_NAME, uid);
  await updateDoc(docRef, { status: newStatus, updatedAt: new Date().toISOString() });
  return newStatus;
};

export const sendResetPassword = async (email) => {
  if (import.meta.env.VITE_FIREBASE_API_KEY?.includes("Placeholder")) {
    return { success: true, message: `Simulasi link reset password terkirim ke ${email}` };
  }

  await sendPasswordResetEmail(auth, email);
  return { success: true, message: `Email instruksi reset password berhasil dikirim ke ${email}` };
};
