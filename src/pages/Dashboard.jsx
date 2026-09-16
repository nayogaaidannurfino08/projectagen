import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { 
  ShoppingCart, Package, BookOpen, BarChart3, TrendingUp, 
  AlertCircle, AlertTriangle, CheckCircle2, ArrowRight, 
  Calendar, Flame, Wallet, Users 
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { subscribeTransaksi } from "../services/transaksiService";
import { subscribePelanggan } from "../services/pelangganService";
import { subscribeProduk } from "../services/produkService";

export default function Dashboard() {
  const { nama, role, agenId } = useAuth();

  const [transaksiList, setTransaksiList] = useState([]);
  const [pelangganList, setPelangganList] = useState([]);
  const [produkList, setProdukList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!agenId) return;
    setLoading(true);

    const unsubTx = subscribeTransaksi(agenId, (txs) => {
      setTransaksiList(txs);
      setLoading(false);
    });

    const unsubCust = subscribePelanggan(agenId, (custs) => {
      setPelangganList(custs);
    });

    const unsubProd = subscribeProduk(agenId, (prods) => {
      setProdukList(prods);
    });

    return () => {
      unsubTx();
      unsubCust();
      unsubProd();
    };
  }, [agenId]);

  // Helper date matching for today (local time)
  const isToday = (dateValue) => {
    if (!dateValue) return false;
    let d;
    if (typeof dateValue.toDate === "function") {
      d = dateValue.toDate();
    } else {
      d = new Date(dateValue);
    }
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  const parseDate = (dateValue) => {
    if (!dateValue) return new Date();
    if (typeof dateValue.toDate === "function") return dateValue.toDate();
    return new Date(dateValue);
  };

  // 1. Calculations: Hari Ini
  const todayMetrics = useMemo(() => {
    const todayTxs = transaksiList.filter((tx) => isToday(tx.tanggal || tx.createdAt));
    const totalPenjualan = todayTxs.reduce((sum, tx) => sum + (Number(tx.totalBelanja) || 0), 0);
    const jumlahTransaksi = todayTxs.length;

    // Produk Terlaris hari ini
    const productCountMap = {};
    todayTxs.forEach((tx) => {
      if (Array.isArray(tx.items)) {
        tx.items.forEach((item) => {
          const key = item.nama || item.produkId;
          productCountMap[key] = (productCountMap[key] || 0) + (Number(item.qty) || 0);
        });
      }
    });

    let bestSellerName = "-";
    let bestSellerQty = 0;
    Object.entries(productCountMap).forEach(([name, qty]) => {
      if (qty > bestSellerQty) {
        bestSellerName = name;
        bestSellerQty = qty;
      }
    });

    return {
      totalPenjualan,
      jumlahTransaksi,
      bestSellerName,
      bestSellerQty
    };
  }, [transaksiList]);

  // 2. Calculations: Total Hutang Beredar
  const totalHutangBeredar = useMemo(() => {
    return pelangganList.reduce((sum, cust) => sum + (Number(cust.totalHutang) || 0), 0);
  }, [pelangganList]);

  const jumlahPelangganBerhutang = useMemo(() => {
    return pelangganList.filter((p) => (p.totalHutang || 0) > 0).length;
  }, [pelangganList]);

  // 3. Low stock alert products (stok <= stokMinimum)
  const lowStockProducts = useMemo(() => {
    return produkList.filter((p) => (p.stok || 0) <= (p.stokMinimum || 5));
  }, [produkList]);

  // 4. Calculations: Traffic 7 Hari Terakhir
  const last7DaysData = useMemo(() => {
    const days = [];
    const now = new Date();
    const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dayName = dayNames[d.getDay()];
      const dayDate = `${d.getDate()}/${d.getMonth() + 1}`;

      // Sum all transactions on this day
      let dayTotal = 0;
      transaksiList.forEach((tx) => {
        const txDate = parseDate(tx.tanggal || tx.createdAt);
        if (
          txDate.getDate() === d.getDate() &&
          txDate.getMonth() === d.getMonth() &&
          txDate.getFullYear() === d.getFullYear()
        ) {
          dayTotal += Number(tx.totalBelanja) || 0;
        }
      });

      days.push({
        label: i === 0 ? "Hari Ini" : dayName,
        date: dayDate,
        total: dayTotal,
        isToday: i === 0
      });
    }

    const maxTotal = Math.max(...days.map((d) => d.total), 1);
    return { days, maxTotal };
  }, [transaksiList]);

  const formatRp = (num) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(num || 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header Sambutan */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dashboard Ringkasan</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Selamat datang, <span className="font-bold text-slate-800">{nama}</span> ({role === "admin" ? "Pemilik / Admin" : "Kasir"})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/kasir"
            className="inline-flex items-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-md transition transform active:scale-95"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Buka Kasir (POS)
          </Link>
        </div>
      </div>

      {/* Low Stock Alert Banner (Jika ada produk kritis) */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-xl shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                Peringatan: {lowStockProducts.length} Produk Menipis di Bawah Batas Minimum!
              </h4>
              <p className="text-xs text-amber-700 mt-0.5 line-clamp-1">
                {lowStockProducts.map((p) => `${p.nama} (${p.stok} ${p.satuan})`).join(", ")}
              </p>
            </div>
          </div>
          <Link
            to="/stok"
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shrink-0 transition"
          >
            Restock
          </Link>
        </div>
      )}

      {/* 4 Kartu Ringkasan Utama */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Penjualan Hari Ini */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Penjualan Hari Ini</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              {formatRp(todayMetrics.totalPenjualan)}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center space-x-1">
              <span>{todayMetrics.jumlahTransaksi} transaksi hari ini</span>
            </div>
          </div>
        </div>

        {/* 2. Jumlah Transaksi Hari Ini */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Transaksi Hari Ini</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              {todayMetrics.jumlahTransaksi} Struk
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Rata-rata: {todayMetrics.jumlahTransaksi > 0 ? formatRp(Math.round(todayMetrics.totalPenjualan / todayMetrics.jumlahTransaksi)) : "Rp 0"}
            </div>
          </div>
        </div>

        {/* 3. Produk Terlaris Hari Ini */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Produk Terlaris</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-lg font-black text-slate-800 truncate" title={todayMetrics.bestSellerName}>
              {todayMetrics.bestSellerName}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {todayMetrics.bestSellerQty > 0 ? `Terjual ${todayMetrics.bestSellerQty} item hari ini` : "Belum ada penjualan hari ini"}
            </div>
          </div>
        </div>

        {/* 4. TOTAL HUTANG BEREDAR (Aksen Khusus Sesuai Spesifikasi) */}
        <Link
          to="/bon"
          className="bg-gradient-to-br from-red-500 to-rose-600 text-white p-5 rounded-2xl shadow-md hover:shadow-lg transition transform active:scale-95 flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-red-100">
              Total Hutang Beredar
            </span>
            <div className="p-2 bg-white/20 rounded-xl text-white">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white">
              {formatRp(totalHutangBeredar)}
            </div>
            <div className="text-xs text-red-100 mt-1 flex items-center justify-between">
              <span>{jumlahPelangganBerhutang} warung belum lunas</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
            </div>
          </div>
        </Link>
      </div>

      {/* Preview Grafik Traffic Penjualan 7 Hari Terakhir & Transaksi Terkini */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grafik 7 Hari */}
        <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">Traffic Penjualan (7 Hari Terakhir)</h3>
              <p className="text-xs text-slate-400">Ringkasan performa omzet harian toko</p>
            </div>
            <Link
              to="/laporan"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center space-x-1"
            >
              <span>Laporan Lengkap</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Bar Chart Sederhana */}
          <div className="pt-4 pb-2">
            <div className="flex items-end justify-between gap-2 h-44 border-b border-slate-200 px-2">
              {last7DaysData.days.map((item, idx) => {
                const heightPercent = Math.max(8, Math.round((item.total / last7DaysData.maxTotal) * 100));

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center group relative">
                    {/* Tooltip on Hover */}
                    <div className="absolute -top-10 bg-slate-900 text-white text-[10px] font-bold py-1 px-2 rounded-lg opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-10 shadow-md">
                      {formatRp(item.total)}
                    </div>

                    {/* Bar */}
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full max-w-[40px] rounded-t-lg transition-all duration-300 ${
                        item.isToday
                          ? "bg-emerald-600 group-hover:bg-emerald-700 shadow-sm"
                          : "bg-slate-200 group-hover:bg-emerald-300"
                      }`}
                    />

                    {/* Day Label */}
                    <div className="mt-2 text-center">
                      <span className={`block text-[11px] font-bold ${item.isToday ? "text-emerald-700" : "text-slate-600"}`}>
                        {item.label}
                      </span>
                      <span className="block text-[9px] text-slate-400">{item.date}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Transaksi Terkini */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-800">Aktivitas Terkini</h3>
              <Link to="/laporan" className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
                Semua
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {transaksiList.slice(0, 4).map((tx) => (
                <div key={tx.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-800">{tx.id}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {tx.tanggalFormatted || "Baru saja"} • {tx.items?.length || 0} item
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-black text-slate-800">{formatRp(tx.totalBelanja)}</div>
                    <span
                      className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5 uppercase ${
                        tx.metodeBayar === "qris"
                          ? "bg-purple-100 text-purple-700"
                          : tx.metodeBayar === "bon"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {tx.metodeBayar}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <Link
              to="/kasir"
              className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1 border border-slate-200"
            >
              <span>Mulai Transaksi Baru</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Pintasan Menu Utama */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="text-base font-bold text-slate-800 mb-4">Pintasan Menu</h3>
        <div className={`grid grid-cols-2 ${role === "admin" ? "sm:grid-cols-5" : "sm:grid-cols-4"} gap-4`}>
          <Link
            to="/kasir"
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-800 transition-all text-center group"
          >
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl mb-2 group-hover:scale-110 transition">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold">Kasir (POS)</span>
            <span className="text-[11px] text-slate-400 mt-0.5">Input penjualan</span>
          </Link>

          <Link
            to="/stok"
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-800 transition-all text-center group"
          >
            <div className="p-3 bg-blue-100 text-blue-700 rounded-2xl mb-2 group-hover:scale-110 transition">
              <Package className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold">Kelola Stok</span>
            <span className="text-[11px] text-slate-400 mt-0.5">{produkList.length} produk katalog</span>
          </Link>

          <Link
            to="/bon"
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-slate-700 hover:text-amber-800 transition-all text-center group"
          >
            <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl mb-2 group-hover:scale-110 transition">
              <BookOpen className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold">Hutang / Bon</span>
            <span className="text-[11px] text-slate-400 mt-0.5">{pelangganList.length} pelanggan</span>
          </Link>

          <Link
            to="/laporan"
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-300 text-slate-700 hover:text-purple-800 transition-all text-center group"
          >
            <div className="p-3 bg-purple-100 text-purple-700 rounded-2xl mb-2 group-hover:scale-110 transition">
              <BarChart3 className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold">Laporan Omzet</span>
            <span className="text-[11px] text-slate-400 mt-0.5">Analisis & Laba</span>
          </Link>

          {role === "admin" && (
            <Link
              to="/pengguna"
              className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-800 transition-all text-center group"
            >
              <div className="p-3 bg-indigo-100 text-indigo-700 rounded-2xl mb-2 group-hover:scale-110 transition">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold">Kelola User</span>
              <span className="text-[11px] text-slate-400 mt-0.5">Akses & Kasir</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
