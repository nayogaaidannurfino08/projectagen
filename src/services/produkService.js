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
  onSnapshot,
  writeBatch
} from "firebase/firestore";
import { db, DEFAULT_AGEN_ID } from "../firebase/config";

const COLLECTION_NAME = "produk";

export const DEFAULT_DEMO_PRODUK = [
  { id: "prod_1", nama: "Beras Rojolele 5kg", kategori: "Sembako", hargaJual: 72000, hargaModal: 65000, stok: 25, satuan: "karung", stokMinimum: 5, kodeBarcode: "899123456001", agenId: "agen_utama_01" },
  { id: "prod_2", nama: "Minyak Goreng Bimoli 2L", kategori: "Sembako", hargaJual: 35000, hargaModal: 31000, stok: 30, satuan: "pouch", stokMinimum: 6, kodeBarcode: "899123456002", agenId: "agen_utama_01" },
  { id: "prod_3", nama: "Gula Pasir Gulaku 1kg", kategori: "Sembako", hargaJual: 18000, hargaModal: 15500, stok: 45, satuan: "kg", stokMinimum: 10, kodeBarcode: "899123456003", agenId: "agen_utama_01" },
  { id: "prod_4", nama: "Telur Ayam Negeri 1kg", kategori: "Sembako", hargaJual: 28000, hargaModal: 25000, stok: 20, satuan: "kg", stokMinimum: 5, kodeBarcode: "899123456004", agenId: "agen_utama_01" },
  { id: "prod_5", nama: "Indomie Goreng Spesial", kategori: "Sembako", hargaJual: 3500, hargaModal: 2900, stok: 120, satuan: "bungkus", stokMinimum: 24, kodeBarcode: "899123456005", agenId: "agen_utama_01" },
  { id: "prod_6", nama: "Tepung Segitiga Biru 1kg", kategori: "Sembako", hargaJual: 12500, hargaModal: 10500, stok: 35, satuan: "kg", stokMinimum: 8, kodeBarcode: "899123456006", agenId: "agen_utama_01" },
  { id: "prod_7", nama: "Kopi Kapal Api Spesial 65g", kategori: "Minuman", hargaJual: 7500, hargaModal: 6000, stok: 50, satuan: "sachet", stokMinimum: 10, kodeBarcode: "899123456007", agenId: "agen_utama_01" },
  { id: "prod_8", nama: "Teh Celup Sariwangi Isi 25", kategori: "Minuman", hargaJual: 6500, hargaModal: 5200, stok: 40, satuan: "kotak", stokMinimum: 5, kodeBarcode: "899123456008", agenId: "agen_utama_01" },
  { id: "prod_9", nama: "Susu Frisian Flag Cokelat 370g", kategori: "Minuman", hargaJual: 13000, hargaModal: 11500, stok: 28, satuan: "kaleng", stokMinimum: 6, kodeBarcode: "899123456009", agenId: "agen_utama_01" },
  { id: "prod_10", nama: "Garam Dapur Beriodium 250g", kategori: "Sembako", hargaJual: 3000, hargaModal: 2200, stok: 60, satuan: "bungkus", stokMinimum: 12, kodeBarcode: "899123456010", agenId: "agen_utama_01" }
];

export const getProdukList = async (agenId = DEFAULT_AGEN_ID) => {
  if (import.meta.env.VITE_FIREBASE_API_KEY?.includes("Placeholder")) {
    const local = localStorage.getItem("demo_produk_aps_agen");
    if (local) return JSON.parse(local);
    localStorage.setItem("demo_produk_aps_agen", JSON.stringify(DEFAULT_DEMO_PRODUK));
    return DEFAULT_DEMO_PRODUK;
  }

  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("agenId", "==", agenId)
    );
    const snapshot = await getDocs(q);
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    list.sort((a, b) => (a.nama || "").localeCompare(b.nama || ""));
    return list;
  } catch (err) {
    console.warn("getProdukList fallback to demo cache:", err);
    const local = localStorage.getItem("demo_produk_aps_agen");
    return local ? JSON.parse(local) : DEFAULT_DEMO_PRODUK;
  }
};

export const subscribeProduk = (agenId = DEFAULT_AGEN_ID, callback) => {
  if (import.meta.env.VITE_FIREBASE_API_KEY?.includes("Placeholder")) {
    const local = localStorage.getItem("demo_produk_aps_agen");
    const data = local ? JSON.parse(local) : DEFAULT_DEMO_PRODUK;
    if (!local) localStorage.setItem("demo_produk_aps_agen", JSON.stringify(DEFAULT_DEMO_PRODUK));
    callback(data);
    return () => {};
  }

  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("agenId", "==", agenId)
    );
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => (a.nama || "").localeCompare(b.nama || ""));
      callback(data);
    }, (error) => {
      console.warn("subscribeProduk onSnapshot error:", error);
      const local = localStorage.getItem("demo_produk_aps_agen");
      callback(local ? JSON.parse(local) : DEFAULT_DEMO_PRODUK);
    });
  } catch (err) {
    const local = localStorage.getItem("demo_produk_aps_agen");
    callback(local ? JSON.parse(local) : DEFAULT_DEMO_PRODUK);
    return () => {};
  }
};

export const seedInitialProduk = async (agenId = DEFAULT_AGEN_ID) => {
  if (import.meta.env.VITE_FIREBASE_API_KEY?.includes("Placeholder")) {
    localStorage.setItem("demo_produk_aps_agen", JSON.stringify(DEFAULT_DEMO_PRODUK));
    return DEFAULT_DEMO_PRODUK;
  }

  const batch = writeBatch(db);
  for (const item of DEFAULT_DEMO_PRODUK) {
    const newDocRef = doc(collection(db, COLLECTION_NAME));
    batch.set(newDocRef, { ...item, id: newDocRef.id, agenId });
  }
  await batch.commit();
  return DEFAULT_DEMO_PRODUK;
};

export const addProduk = async (data, agenId = DEFAULT_AGEN_ID) => {
  const payload = {
    nama: data.nama || "",
    kategori: data.kategori || "Sembako",
    hargaJual: Number(data.hargaJual) || 0,
    hargaModal: Number(data.hargaModal) || 0,
    stok: Number(data.stok) || 0,
    satuan: data.satuan || "pcs",
    agenId: agenId || DEFAULT_AGEN_ID,
    kodeBarcode: data.kodeBarcode || "",
    stokMinimum: Number(data.stokMinimum) || 5,
    satuanKonversi: data.satuanKonversi || null,
    createdAt: new Date().toISOString()
  };

  if (import.meta.env.VITE_FIREBASE_API_KEY?.includes("Placeholder")) {
    const local = localStorage.getItem("demo_produk_aps_agen");
    const list = local ? JSON.parse(local) : [...DEFAULT_DEMO_PRODUK];
    const newProd = { id: "prod_" + Date.now(), ...payload };
    list.push(newProd);
    localStorage.setItem("demo_produk_aps_agen", JSON.stringify(list));
    return newProd;
  }

  const docRef = await addDoc(collection(db, COLLECTION_NAME), payload);
  return { id: docRef.id, ...payload };
};

export const updateProduk = async (id, data) => {
  if (import.meta.env.VITE_FIREBASE_API_KEY?.includes("Placeholder")) {
    const local = localStorage.getItem("demo_produk_aps_agen");
    let list = local ? JSON.parse(local) : [...DEFAULT_DEMO_PRODUK];
    list = list.map(p => p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p);
    localStorage.setItem("demo_produk_aps_agen", JSON.stringify(list));
    return { id, ...data };
  }

  const docRef = doc(db, COLLECTION_NAME, id);
  const payload = { ...data, updatedAt: new Date().toISOString() };
  await updateDoc(docRef, payload);
  return { id, ...payload };
};

export const deleteProduk = async (id) => {
  if (import.meta.env.VITE_FIREBASE_API_KEY?.includes("Placeholder")) {
    const local = localStorage.getItem("demo_produk_aps_agen");
    let list = local ? JSON.parse(local) : [...DEFAULT_DEMO_PRODUK];
    list = list.filter(p => p.id !== id);
    localStorage.setItem("demo_produk_aps_agen", JSON.stringify(list));
    return id;
  }

  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
  return id;
};
