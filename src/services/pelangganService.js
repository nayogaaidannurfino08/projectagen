import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot 
} from "firebase/firestore";
import { db, DEFAULT_AGEN_ID } from "../firebase/config";

const COLLECTION_NAME = "pelanggan";

export const DEFAULT_DEMO_PELANGGAN = [
  { id: "cust_1", nama: "Warung Bu Sri", noHp: "081234567890", alamat: "Jl. Mawar No. 12", totalHutang: 350000, agenId: DEFAULT_AGEN_ID },
  { id: "cust_2", nama: "Pak Joko Sembako", noHp: "082198765432", alamat: "Pasar Baru Kios B-3", totalHutang: 720000, agenId: DEFAULT_AGEN_ID },
  { id: "cust_3", nama: "Toko Berkah Ibu Siti", noHp: "085712345678", alamat: "Gang Masjid No. 5", totalHutang: 150000, agenId: DEFAULT_AGEN_ID },
  { id: "cust_4", nama: "Ibu Ratna (Warung Kopi)", noHp: "087812340987", alamat: "Depan Lapangan", totalHutang: 0, agenId: DEFAULT_AGEN_ID }
];

export const getPelangganList = async (agenId = DEFAULT_AGEN_ID) => {
  if (import.meta.env.VITE_FIREBASE_API_KEY?.includes("Placeholder")) {
    const local = localStorage.getItem("demo_pelanggan_aps_agen");
    if (local) {
      const data = JSON.parse(local);
      return data.sort((a, b) => (b.totalHutang || 0) - (a.totalHutang || 0));
    }
    localStorage.setItem("demo_pelanggan_aps_agen", JSON.stringify(DEFAULT_DEMO_PELANGGAN));
    return [...DEFAULT_DEMO_PELANGGAN].sort((a, b) => (b.totalHutang || 0) - (a.totalHutang || 0));
  }

  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("agenId", "==", agenId)
    );
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return data.sort((a, b) => (b.totalHutang || 0) - (a.totalHutang || 0));
  } catch (err) {
    console.warn("getPelangganList fallback to demo storage:", err);
    const local = localStorage.getItem("demo_pelanggan_aps_agen");
    const data = local ? JSON.parse(local) : DEFAULT_DEMO_PELANGGAN;
    return data.sort((a, b) => (b.totalHutang || 0) - (a.totalHutang || 0));
  }
};

export const subscribePelanggan = (agenId = DEFAULT_AGEN_ID, callback) => {
  if (import.meta.env.VITE_FIREBASE_API_KEY?.includes("Placeholder")) {
    const local = localStorage.getItem("demo_pelanggan_aps_agen");
    const data = local ? JSON.parse(local) : DEFAULT_DEMO_PELANGGAN;
    if (!local) localStorage.setItem("demo_pelanggan_aps_agen", JSON.stringify(DEFAULT_DEMO_PELANGGAN));
    callback(data.sort((a, b) => (b.totalHutang || 0) - (a.totalHutang || 0)));
    return () => {};
  }

  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("agenId", "==", agenId)
    );
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => (b.totalHutang || 0) - (a.totalHutang || 0));
      callback(data);
    }, (error) => {
      console.warn("subscribePelanggan error, fallback to local:", error);
      const local = localStorage.getItem("demo_pelanggan_aps_agen");
      const data = local ? JSON.parse(local) : DEFAULT_DEMO_PELANGGAN;
      callback(data.sort((a, b) => (b.totalHutang || 0) - (a.totalHutang || 0)));
    });
  } catch (err) {
    const local = localStorage.getItem("demo_pelanggan_aps_agen");
    const data = local ? JSON.parse(local) : DEFAULT_DEMO_PELANGGAN;
    callback(data.sort((a, b) => (b.totalHutang || 0) - (a.totalHutang || 0)));
    return () => {};
  }
};

export const getPelangganById = async (id) => {
  if (import.meta.env.VITE_FIREBASE_API_KEY?.includes("Placeholder")) {
    const local = localStorage.getItem("demo_pelanggan_aps_agen");
    const list = local ? JSON.parse(local) : DEFAULT_DEMO_PELANGGAN;
    return list.find(p => p.id === id) || null;
  }

  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (err) {
    const local = localStorage.getItem("demo_pelanggan_aps_agen");
    const list = local ? JSON.parse(local) : DEFAULT_DEMO_PELANGGAN;
    return list.find(p => p.id === id) || null;
  }
};

export const addPelanggan = async (data, agenId = DEFAULT_AGEN_ID) => {
  const payload = {
    nama: data.nama?.trim() || "",
    noHp: data.noHp?.trim() || null,
    alamat: data.alamat?.trim() || null,
    totalHutang: Number(data.totalHutang) || 0,
    agenId: agenId || DEFAULT_AGEN_ID,
    createdAt: new Date().toISOString()
  };

  if (import.meta.env.VITE_FIREBASE_API_KEY?.includes("Placeholder")) {
    const local = localStorage.getItem("demo_pelanggan_aps_agen");
    const list = local ? JSON.parse(local) : [...DEFAULT_DEMO_PELANGGAN];
    const newCust = { id: "cust_" + Date.now(), ...payload };
    list.push(newCust);
    localStorage.setItem("demo_pelanggan_aps_agen", JSON.stringify(list));
    return newCust;
  }

  const docRef = await addDoc(collection(db, COLLECTION_NAME), payload);
  return { id: docRef.id, ...payload };
};

export const updatePelanggan = async (id, data) => {
  if (import.meta.env.VITE_FIREBASE_API_KEY?.includes("Placeholder")) {
    const local = localStorage.getItem("demo_pelanggan_aps_agen");
    let list = local ? JSON.parse(local) : [...DEFAULT_DEMO_PELANGGAN];
    list = list.map(p => p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p);
    localStorage.setItem("demo_pelanggan_aps_agen", JSON.stringify(list));
    return { id, ...data };
  }

  const docRef = doc(db, COLLECTION_NAME, id);
  const payload = { ...data, updatedAt: new Date().toISOString() };
  await updateDoc(docRef, payload);
  return { id, ...payload };
};

export const deletePelanggan = async (id) => {
  if (import.meta.env.VITE_FIREBASE_API_KEY?.includes("Placeholder")) {
    const local = localStorage.getItem("demo_pelanggan_aps_agen");
    let list = local ? JSON.parse(local) : [...DEFAULT_DEMO_PELANGGAN];
    list = list.filter(p => p.id !== id);
    localStorage.setItem("demo_pelanggan_aps_agen", JSON.stringify(list));
    return id;
  }

  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
  return id;
};
