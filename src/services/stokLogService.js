import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  Timestamp 
} from "firebase/firestore";
import { db, DEFAULT_AGEN_ID } from "../firebase/config";

const COLLECTION_NAME = "stokLog";

export const getStokLogsByProduk = async (produkId, limitCount = 50) => {
  if (import.meta.env.VITE_FIREBASE_API_KEY?.includes("Placeholder")) {
    const raw = localStorage.getItem("demo_stokLog_aps_agen");
    const logs = raw ? JSON.parse(raw) : [];
    return logs.filter(l => l.produkId === produkId).slice(0, limitCount);
  }

  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("produkId", "==", produkId),
      orderBy("tanggal", "desc"),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    const raw = localStorage.getItem("demo_stokLog_aps_agen");
    const logs = raw ? JSON.parse(raw) : [];
    return logs.filter(l => l.produkId === produkId).slice(0, limitCount);
  }
};

export const getAllStokLogs = async (agenId = DEFAULT_AGEN_ID, limitCount = 100) => {
  if (import.meta.env.VITE_FIREBASE_API_KEY?.includes("Placeholder")) {
    const raw = localStorage.getItem("demo_stokLog_aps_agen");
    return raw ? JSON.parse(raw) : [];
  }

  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("agenId", "==", agenId),
      orderBy("tanggal", "desc"),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    const raw = localStorage.getItem("demo_stokLog_aps_agen");
    return raw ? JSON.parse(raw) : [];
  }
};

export const addStokLog = async ({
  produkId,
  namaProduk = "",
  perubahan,
  alasan, // "restock" | "terjual" | "koreksi"
  transaksiId = null,
  catatan = "",
  agenId = DEFAULT_AGEN_ID
}) => {
  const payload = {
    produkId,
    namaProduk,
    perubahan: Number(perubahan),
    alasan,
    transaksiId,
    catatan,
    tanggal: Timestamp.now(),
    tanggalFormatted: new Date().toLocaleString("id-ID"),
    agenId
  };

  if (import.meta.env.VITE_FIREBASE_API_KEY?.includes("Placeholder")) {
    const raw = localStorage.getItem("demo_stokLog_aps_agen");
    const logs = raw ? JSON.parse(raw) : [];
    const newLog = { id: "log_" + Date.now(), ...payload, tanggal: { toDate: () => new Date(), toMillis: () => Date.now() } };
    logs.unshift(newLog);
    localStorage.setItem("demo_stokLog_aps_agen", JSON.stringify(logs));
    return newLog;
  }

  const docRef = await addDoc(collection(db, COLLECTION_NAME), payload);
  return { id: docRef.id, ...payload };
};
