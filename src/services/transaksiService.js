import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  runTransaction, 
  Timestamp, 
  onSnapshot 
} from "firebase/firestore";
import { db, DEFAULT_AGEN_ID } from "../firebase/config";

const COLLECTION_NAME = "transaksi";

export const generateDemoTransactions = () => {
  const now = Date.now();
  const dayMs = 86400000;
  return [
    {
      id: "TRX-DEMO-TODAY-1",
      tanggal: { toDate: () => new Date(now - 3600000), toMillis: () => now - 3600000 },
      tanggalFormatted: new Date(now - 3600000).toLocaleString("id-ID"),
      items: [
        { produkId: "prod_1", nama: "Beras Rojolele 5kg", qty: 2, hargaSatuan: 72000, subtotal: 144000, hargaModal: 65000 },
        { produkId: "prod_2", nama: "Minyak Goreng Bimoli 2L", qty: 3, hargaSatuan: 35000, subtotal: 105000, hargaModal: 31000 }
      ],
      totalBelanja: 249000,
      metodeBayar: "cash",
      uangDiterima: 250000,
      kembalian: 1000,
      kasirId: "kasir_default",
      agenId: DEFAULT_AGEN_ID
    },
    {
      id: "TRX-DEMO-TODAY-2",
      tanggal: { toDate: () => new Date(now - 7200000), toMillis: () => now - 7200000 },
      tanggalFormatted: new Date(now - 7200000).toLocaleString("id-ID"),
      items: [
        { produkId: "prod_3", nama: "Gula Pasir Gulaku 1kg", qty: 5, hargaSatuan: 18000, subtotal: 90000, hargaModal: 15500 },
        { produkId: "prod_5", nama: "Indomie Goreng Spesial", qty: 20, hargaSatuan: 3500, subtotal: 70000, hargaModal: 2900 }
      ],
      totalBelanja: 160000,
      metodeBayar: "qris",
      kasirId: "kasir_default",
      agenId: DEFAULT_AGEN_ID
    },
    {
      id: "TRX-DEMO-YEST-1",
      tanggal: { toDate: () => new Date(now - dayMs), toMillis: () => now - dayMs },
      tanggalFormatted: new Date(now - dayMs).toLocaleString("id-ID"),
      items: [
        { produkId: "prod_1", nama: "Beras Rojolele 5kg", qty: 4, hargaSatuan: 72000, subtotal: 288000, hargaModal: 65000 }
      ],
      totalBelanja: 288000,
      metodeBayar: "cash",
      kasirId: "kasir_default",
      agenId: DEFAULT_AGEN_ID
    },
    {
      id: "TRX-DEMO-DAY2",
      tanggal: { toDate: () => new Date(now - 2 * dayMs), toMillis: () => now - 2 * dayMs },
      tanggalFormatted: new Date(now - 2 * dayMs).toLocaleString("id-ID"),
      items: [
        { produkId: "prod_4", nama: "Telur Ayam Negeri 1kg", qty: 10, hargaSatuan: 28000, subtotal: 280000, hargaModal: 25000 }
      ],
      totalBelanja: 280000,
      metodeBayar: "bon",
      pelangganId: "cust_1",
      pelangganNama: "Warung Bu Sri",
      kasirId: "kasir_default",
      agenId: DEFAULT_AGEN_ID
    },
    {
      id: "TRX-DEMO-DAY3",
      tanggal: { toDate: () => new Date(now - 3 * dayMs), toMillis: () => now - 3 * dayMs },
      tanggalFormatted: new Date(now - 3 * dayMs).toLocaleString("id-ID"),
      items: [
        { produkId: "prod_2", nama: "Minyak Goreng Bimoli 2L", qty: 8, hargaSatuan: 35000, subtotal: 280000, hargaModal: 31000 }
      ],
      totalBelanja: 280000,
      metodeBayar: "cash",
      kasirId: "kasir_default",
      agenId: DEFAULT_AGEN_ID
    },
    {
      id: "TRX-DEMO-DAY4",
      tanggal: { toDate: () => new Date(now - 4 * dayMs), toMillis: () => now - 4 * dayMs },
      tanggalFormatted: new Date(now - 4 * dayMs).toLocaleString("id-ID"),
      items: [
        { produkId: "prod_5", nama: "Indomie Goreng Spesial", qty: 40, hargaSatuan: 3500, subtotal: 140000, hargaModal: 2900 }
      ],
      totalBelanja: 140000,
      metodeBayar: "qris",
      kasirId: "kasir_default",
      agenId: DEFAULT_AGEN_ID
    },
    {
      id: "TRX-DEMO-DAY5",
      tanggal: { toDate: () => new Date(now - 5 * dayMs), toMillis: () => now - 5 * dayMs },
      tanggalFormatted: new Date(now - 5 * dayMs).toLocaleString("id-ID"),
      items: [
        { produkId: "prod_1", nama: "Beras Rojolele 5kg", qty: 5, hargaSatuan: 72000, subtotal: 360000, hargaModal: 65000 }
      ],
      totalBelanja: 360000,
      metodeBayar: "cash",
      kasirId: "kasir_default",
      agenId: DEFAULT_AGEN_ID
    }
  ];
};

export const getTransaksiList = async (agenId = DEFAULT_AGEN_ID, limitCount = 100) => {
  if (import.meta.env.VITE_FIREBASE_API_KEY?.includes("Placeholder")) {
    const local = localStorage.getItem("demo_transaksi_aps_agen");
    if (local) return JSON.parse(local);
    const demo = generateDemoTransactions();
    localStorage.setItem("demo_transaksi_aps_agen", JSON.stringify(demo));
    return demo;
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
    const local = localStorage.getItem("demo_transaksi_aps_agen");
    return local ? JSON.parse(local) : generateDemoTransactions();
  }
};

export const subscribeTransaksi = (agenId = DEFAULT_AGEN_ID, callback, limitCount = 50) => {
  if (import.meta.env.VITE_FIREBASE_API_KEY?.includes("Placeholder")) {
    const local = localStorage.getItem("demo_transaksi_aps_agen");
    if (local) {
      callback(JSON.parse(local));
    } else {
      const demo = generateDemoTransactions();
      localStorage.setItem("demo_transaksi_aps_agen", JSON.stringify(demo));
      callback(demo);
    }
    return () => {};
  }

  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("agenId", "==", agenId),
      orderBy("tanggal", "desc"),
      limit(limitCount)
    );
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(data);
    }, (error) => {
      console.warn("subscribeTransaksi fallback:", error);
      const local = localStorage.getItem("demo_transaksi_aps_agen");
      callback(local ? JSON.parse(local) : []);
    });
  } catch (err) {
    const local = localStorage.getItem("demo_transaksi_aps_agen");
    callback(local ? JSON.parse(local) : []);
    return () => {};
  }
};

/**
 * Execute checkout as a single Firestore transaction for atomic consistency
 */
export const executeCheckout = async ({
  items, // [{ produkId, nama, qty, hargaSatuan, subtotal, hargaModal }]
  totalBelanja,
  metodeBayar, // "qris" | "cash" | "bon"
  uangDiterima = null,
  kembalian = null,
  pelangganId = null,
  pelangganNama = null,
  kasirId = "kasir_default",
  agenId = DEFAULT_AGEN_ID
}) => {
  // Demo simulation mode if credentials are placeholder
  if (import.meta.env.VITE_FIREBASE_API_KEY?.includes("Placeholder")) {
    const nowIso = new Date().toISOString();
    const newTxId = "TRX-" + Date.now().toString().slice(-6);

    // Deduct stock in demo storage
    const rawProds = localStorage.getItem("demo_produk_aps_agen");
    let prods = rawProds ? JSON.parse(rawProds) : [];
    for (const item of items) {
      prods = prods.map(p => {
        if (p.id === item.produkId) {
          const newStok = Math.max(0, (p.stok || 0) - item.qty);
          return { ...p, stok: newStok };
        }
        return p;
      });
    }
    localStorage.setItem("demo_produk_aps_agen", JSON.stringify(prods));

    // Update customer debt if bon
    let hutangId = null;
    if (metodeBayar === "bon" && pelangganId) {
      const rawPel = localStorage.getItem("demo_pelanggan_aps_agen");
      let pels = rawPel ? JSON.parse(rawPel) : [];
      pels = pels.map(pel => {
        if (pel.id === pelangganId) {
          return { ...pel, totalHutang: (pel.totalHutang || 0) + totalBelanja };
        }
        return pel;
      });
      localStorage.setItem("demo_pelanggan_aps_agen", JSON.stringify(pels));
      hutangId = "HTG-" + Date.now().toString().slice(-6);
    }

    const txPayload = {
      id: newTxId,
      tanggal: { toDate: () => new Date(), toMillis: () => Date.now() },
      tanggalFormatted: new Date().toLocaleString("id-ID"),
      items: items.map(item => ({
        produkId: item.produkId,
        nama: item.nama,
        qty: item.qty,
        hargaSatuan: item.hargaSatuan,
        subtotal: item.subtotal,
        hargaModal: item.hargaModal || 0
      })),
      totalBelanja: Number(totalBelanja),
      metodeBayar,
      uangDiterima: metodeBayar === "cash" ? Number(uangDiterima) : null,
      kembalian: metodeBayar === "cash" ? Number(kembalian) : null,
      pelangganId: metodeBayar === "bon" ? pelangganId : null,
      pelangganNama: metodeBayar === "bon" ? pelangganNama : null,
      kasirId,
      agenId,
      createdAt: nowIso,
      hutangId
    };

    const rawTxs = localStorage.getItem("demo_transaksi_aps_agen");
    const txs = rawTxs ? JSON.parse(rawTxs) : [];
    txs.unshift(txPayload);
    localStorage.setItem("demo_transaksi_aps_agen", JSON.stringify(txs));

    return txPayload;
  }

  // Live Firebase Firestore Transaction
  return await runTransaction(db, async (transaction) => {
    // 1. Read phase: verify and get current stock of all products
    const productRefs = [];
    const productSnaps = [];

    for (const item of items) {
      const pRef = doc(db, "produk", item.produkId);
      productRefs.push({ ref: pRef, item });
      const snap = await transaction.get(pRef);
      if (!snap.exists()) {
        throw new Error(`Produk "${item.nama}" tidak ditemukan di database.`);
      }
      const currentStock = snap.data().stok || 0;
      if (currentStock < item.qty) {
        throw new Error(`Stok "${item.nama}" tidak mencukupi (Tersisa: ${currentStock}, Diminta: ${item.qty}).`);
      }
      productSnaps.push({ snap, item, ref: pRef });
    }

    // 2. Read customer if payment method is "bon"
    let customerRef = null;
    let customerSnap = null;
    if (metodeBayar === "bon") {
      if (!pelangganId) throw new Error("Pelanggan harus dipilih untuk pembayaran bon.");
      customerRef = doc(db, "pelanggan", pelangganId);
      customerSnap = await transaction.get(customerRef);
      if (!customerSnap.exists()) {
        throw new Error("Data pelanggan tidak ditemukan.");
      }
    }

    // --- WRITE PHASE ---
    const nowTimestamp = Timestamp.now();
    const newTxRef = doc(collection(db, COLLECTION_NAME));

    // A. Deduct product stocks and create stokLog entries
    for (const { ref, snap, item } of productSnaps) {
      const prevStock = snap.data().stok || 0;
      const newStock = prevStock - item.qty;
      transaction.update(ref, { 
        stok: newStock,
        updatedAt: new Date().toISOString()
      });

      const logRef = doc(collection(db, "stokLog"));
      transaction.set(logRef, {
        produkId: item.produkId,
        namaProduk: item.nama,
        perubahan: -item.qty,
        alasan: "terjual",
        transaksiId: newTxRef.id,
        tanggal: nowTimestamp,
        agenId: agenId
      });
    }

    // B. If bon: create hutang record and update customer totalHutang
    let hutangId = null;
    if (metodeBayar === "bon" && customerRef && customerSnap) {
      const currentHutang = customerSnap.data().totalHutang || 0;
      const newTotalHutang = currentHutang + totalBelanja;
      transaction.update(customerRef, {
        totalHutang: newTotalHutang,
        updatedAt: new Date().toISOString()
      });

      const newHutangRef = doc(collection(db, "hutang"));
      hutangId = newHutangRef.id;
      transaction.set(newHutangRef, {
        pelangganId: pelangganId,
        transaksiId: newTxRef.id,
        jumlah: totalBelanja,
        tipe: "bon_baru",
        tanggal: nowTimestamp,
        catatan: `Belanja kasir: ${items.map(i => `${i.nama} (${i.qty})`).join(", ")}`,
        dicatatOleh: kasirId,
        agenId: agenId
      });
    }

    // C. Insert transaction record
    const txPayload = {
      tanggal: nowTimestamp,
      items: items.map(item => ({
        produkId: item.produkId,
        nama: item.nama,
        qty: item.qty,
        hargaSatuan: item.hargaSatuan,
        subtotal: item.subtotal,
        hargaModal: item.hargaModal || 0
      })),
      totalBelanja: Number(totalBelanja),
      metodeBayar: metodeBayar,
      uangDiterima: metodeBayar === "cash" ? Number(uangDiterima) : null,
      kembalian: metodeBayar === "cash" ? Number(kembalian) : null,
      pelangganId: metodeBayar === "bon" ? pelangganId : null,
      pelangganNama: metodeBayar === "bon" ? (pelangganNama || customerSnap?.data()?.nama || "") : null,
      kasirId: kasirId,
      agenId: agenId,
      createdAt: new Date().toISOString()
    };

    transaction.set(newTxRef, txPayload);

    return {
      id: newTxRef.id,
      ...txPayload,
      hutangId
    };
  });
};
