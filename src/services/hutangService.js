import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  runTransaction, 
  Timestamp, 
  onSnapshot 
} from "firebase/firestore";
import { db, DEFAULT_AGEN_ID } from "../firebase/config";

const COLLECTION_NAME = "hutang";

export const DEFAULT_DEMO_HUTANG = [
  {
    id: "htg_1",
    pelangganId: "cust_1",
    transaksiId: "TRX-DEMO-01",
    jumlah: 350000,
    tipe: "bon_baru",
    tanggalFormatted: new Date(Date.now() - 3 * 86400000).toLocaleString("id-ID"),
    catatan: "Bon belanja sembako mingguan",
    dicatatOleh: "Kasir Toko",
    agenId: DEFAULT_AGEN_ID
  },
  {
    id: "htg_2",
    pelangganId: "cust_2",
    transaksiId: "TRX-DEMO-02",
    jumlah: 1000000,
    tipe: "bon_baru",
    tanggalFormatted: new Date(Date.now() - 5 * 86400000).toLocaleString("id-ID"),
    catatan: "Beras Rojolele & Minyak Bimoli 5 dus",
    dicatatOleh: "Kasir Toko",
    agenId: DEFAULT_AGEN_ID
  },
  {
    id: "htg_3",
    pelangganId: "cust_2",
    transaksiId: null,
    jumlah: -280000,
    tipe: "cicilan",
    tanggalFormatted: new Date(Date.now() - 1 * 86400000).toLocaleString("id-ID"),
    catatan: "Cicilan transfer via BCA",
    dicatatOleh: "Admin",
    agenId: DEFAULT_AGEN_ID
  },
  {
    id: "htg_4",
    pelangganId: "cust_3",
    transaksiId: "TRX-DEMO-03",
    jumlah: 150000,
    tipe: "bon_baru",
    tanggalFormatted: new Date(Date.now() - 2 * 86400000).toLocaleString("id-ID"),
    catatan: "Gula pasir 5kg & Telur 2kg",
    dicatatOleh: "Kasir Toko",
    agenId: DEFAULT_AGEN_ID
  }
];

export const getHutangByPelanggan = async (pelangganId) => {
  if (import.meta.env.VITE_FIREBASE_API_KEY?.includes("Placeholder")) {
    const raw = localStorage.getItem("demo_hutang_aps_agen");
    const data = raw ? JSON.parse(raw) : DEFAULT_DEMO_HUTANG;
    if (!raw) localStorage.setItem("demo_hutang_aps_agen", JSON.stringify(DEFAULT_DEMO_HUTANG));
    return data.filter(h => h.pelangganId === pelangganId);
  }

  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("pelangganId", "==", pelangganId),
      orderBy("tanggal", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.warn("getHutangByPelanggan fallback to demo storage:", err);
    const raw = localStorage.getItem("demo_hutang_aps_agen");
    const data = raw ? JSON.parse(raw) : DEFAULT_DEMO_HUTANG;
    return data.filter(h => h.pelangganId === pelangganId);
  }
};

export const subscribeHutangByPelanggan = (pelangganId, callback) => {
  if (import.meta.env.VITE_FIREBASE_API_KEY?.includes("Placeholder")) {
    const raw = localStorage.getItem("demo_hutang_aps_agen");
    const data = raw ? JSON.parse(raw) : DEFAULT_DEMO_HUTANG;
    if (!raw) localStorage.setItem("demo_hutang_aps_agen", JSON.stringify(DEFAULT_DEMO_HUTANG));
    callback(data.filter(h => h.pelangganId === pelangganId));
    return () => {};
  }

  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("pelangganId", "==", pelangganId)
    );
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => {
        const dateA = a.tanggal?.toMillis?.() || new Date(a.createdAt || 0).getTime();
        const dateB = b.tanggal?.toMillis?.() || new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });
      callback(data);
    }, (error) => {
      console.warn("subscribeHutangByPelanggan error, fallback:", error);
      const raw = localStorage.getItem("demo_hutang_aps_agen");
      const data = raw ? JSON.parse(raw) : DEFAULT_DEMO_HUTANG;
      callback(data.filter(h => h.pelangganId === pelangganId));
    });
  } catch (err) {
    const raw = localStorage.getItem("demo_hutang_aps_agen");
    const data = raw ? JSON.parse(raw) : DEFAULT_DEMO_HUTANG;
    callback(data.filter(h => h.pelangganId === pelangganId));
    return () => {};
  }
};

export const getAllHutang = async (agenId = DEFAULT_AGEN_ID) => {
  if (import.meta.env.VITE_FIREBASE_API_KEY?.includes("Placeholder")) {
    const raw = localStorage.getItem("demo_hutang_aps_agen");
    return raw ? JSON.parse(raw) : DEFAULT_DEMO_HUTANG;
  }

  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("agenId", "==", agenId),
      orderBy("tanggal", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    const raw = localStorage.getItem("demo_hutang_aps_agen");
    return raw ? JSON.parse(raw) : DEFAULT_DEMO_HUTANG;
  }
};

/**
 * Catat pembayaran cicilan atau pelunasan hutang pelanggan secara atomik
 */
export const recordPembayaranCicilan = async ({
  pelangganId,
  jumlahBayar,
  catatan = "Pembayaran cicilan",
  dicatatOleh = "Kasir",
  agenId = DEFAULT_AGEN_ID
}) => {
  const nominal = Math.abs(Number(jumlahBayar));
  if (nominal <= 0) throw new Error("Nominal pembayaran harus lebih besar dari 0");

  if (import.meta.env.VITE_FIREBASE_API_KEY?.includes("Placeholder")) {
    const rawPel = localStorage.getItem("demo_pelanggan_aps_agen");
    let pels = rawPel ? JSON.parse(rawPel) : [];
    const cust = pels.find(p => p.id === pelangganId);
    if (!cust) throw new Error("Pelanggan tidak ditemukan");

    const currentHutang = cust.totalHutang || 0;
    const newTotalHutang = Math.max(0, currentHutang - nominal);
    const isLunas = newTotalHutang === 0;

    // Update customer
    pels = pels.map(p => p.id === pelangganId ? { ...p, totalHutang: newTotalHutang } : p);
    localStorage.setItem("demo_pelanggan_aps_agen", JSON.stringify(pels));

    // Add hutang document
    const rawHut = localStorage.getItem("demo_hutang_aps_agen");
    let huts = rawHut ? JSON.parse(rawHut) : [...DEFAULT_DEMO_HUTANG];
    const newRecord = {
      id: "htg_" + Date.now(),
      pelangganId,
      transaksiId: null,
      jumlah: -nominal,
      tipe: isLunas ? "lunas" : "cicilan",
      tanggalFormatted: new Date().toLocaleString("id-ID"),
      catatan: catatan || (isLunas ? "Pelunasan Hutang" : "Pembayaran Cicilan"),
      dicatatOleh,
      agenId,
      createdAt: new Date().toISOString()
    };
    huts.unshift(newRecord);
    localStorage.setItem("demo_hutang_aps_agen", JSON.stringify(huts));

    return {
      ...newRecord,
      sisaHutang: newTotalHutang,
      isLunas
    };
  }

  // Live Firebase Firestore
  return await runTransaction(db, async (transaction) => {
    const custRef = doc(db, "pelanggan", pelangganId);
    const custSnap = await transaction.get(custRef);
    if (!custSnap.exists()) {
      throw new Error("Data pelanggan tidak ditemukan.");
    }

    const currentHutang = custSnap.data().totalHutang || 0;
    const newTotalHutang = Math.max(0, currentHutang - nominal);
    const isLunas = newTotalHutang === 0;

    // Update data pelanggan
    transaction.update(custRef, {
      totalHutang: newTotalHutang,
      statusHutang: isLunas ? "lunas" : "belum_lunas",
      updatedAt: new Date().toISOString()
    });

    // Buat riwayat pembayaran di koleksi hutang
    const nowTimestamp = Timestamp.now();
    const hutangRef = doc(collection(db, COLLECTION_NAME));
    const recordPayload = {
      pelangganId,
      transaksiId: null,
      jumlah: -nominal,
      tipe: isLunas ? "lunas" : "cicilan",
      tanggal: nowTimestamp,
      tanggalFormatted: new Date().toLocaleString("id-ID"),
      catatan: catatan || (isLunas ? "Pelunasan Hutang" : "Pembayaran Cicilan"),
      dicatatOleh,
      agenId,
      createdAt: new Date().toISOString()
    };

    transaction.set(hutangRef, recordPayload);

    return {
      id: hutangRef.id,
      ...recordPayload,
      sisaHutang: newTotalHutang,
      isLunas
    };
  });
};
