import React, { useState, useEffect, useMemo } from "react";
import { 
  BarChart3, Calendar, Filter, DollarSign, TrendingUp, 
  Wallet, ShoppingBag, ArrowUpRight, ArrowDownRight, 
  ChevronDown, ChevronUp, Search, Download, Clock, 
  User, CheckCircle2, AlertCircle, FileText 
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { subscribeTransaksi } from "../services/transaksiService";
import { subscribePelanggan } from "../services/pelangganService";
import { getAllHutang } from "../services/hutangService";

export default function Laporan() {
  const { agenId } = useAuth();

  const [transaksiList, setTransaksiList] = useState([]);
  const [pelangganList, setPelangganList] = useState([]);
  const [hutangList, setHutangList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [rentangPeriode, setRentangPeriode] = useState("7_hari"); // hari_ini, 7_hari, 30_hari, custom
  const [customStartDate, setCustomStartDate] = useState(
    new Date(Date.now() - 6 * 86400000).toISOString().split("T")[0]
  );
  const [customEndDate, setCustomEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [filterMetode, setFilterMetode] = useState("semua"); // semua, cash, qris, bon
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedTxId, setExpandedTxId] = useState(null);
  const [activeTab, setActiveTab] = useState("penjualan"); // penjualan, hutang

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

    getAllHutang(agenId).then((huts) => {
      setHutangList(huts);
    });

    return () => {
      unsubTx();
      unsubCust();
    };
  }, [agenId]);

  // Helper date parse
  const parseDate = (dateVal) => {
    if (!dateVal) return new Date();
    if (typeof dateVal.toDate === "function") return dateVal.toDate();
    return new Date(dateVal);
  };

  // Date range filter boundaries
  const dateRangeBounds = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    if (rentangPeriode === "hari_ini") {
      return { start, end };
    } else if (rentangPeriode === "7_hari") {
      start.setDate(start.getDate() - 6);
      return { start, end };
    } else if (rentangPeriode === "30_hari") {
      start.setDate(start.getDate() - 29);
      return { start, end };
    } else if (rentangPeriode === "custom") {
      const s = new Date(customStartDate + "T00:00:00");
      const e = new Date(customEndDate + "T23:59:59");
      return { start: s, end: e };
    }
    return { start, end };
  }, [rentangPeriode, customStartDate, customEndDate]);

  // Filtered transactions based on date and method
  const filteredTransaksi = useMemo(() => {
    return transaksiList.filter((tx) => {
      const txDate = parseDate(tx.tanggal || tx.createdAt);
      const inDateRange = txDate >= dateRangeBounds.start && txDate <= dateRangeBounds.end;
      const matchMetode = filterMetode === "semua" || tx.metodeBayar === filterMetode;

      const query = searchQuery.toLowerCase();
      const matchSearch =
        !searchQuery ||
        tx.id.toLowerCase().includes(query) ||
        (tx.pelangganNama && tx.pelangganNama.toLowerCase().includes(query)) ||
        (tx.items && tx.items.some((i) => i.nama.toLowerCase().includes(query)));

      return inDateRange && matchMetode && matchSearch;
    });
  }, [transaksiList, dateRangeBounds, filterMetode, searchQuery]);

  // Summary Metrics: Total Omzet, Total Modal, Laba Kotor
  const ringkasanKeuangan = useMemo(() => {
    let totalPenjualan = 0;
    let totalModal = 0;

    filteredTransaksi.forEach((tx) => {
      totalPenjualan += Number(tx.totalBelanja) || 0;
      if (Array.isArray(tx.items)) {
        tx.items.forEach((item) => {
          const modal = Number(item.hargaModal) || 0;
          const qty = Number(item.qty) || 0;
          totalModal += modal * qty;
        });
      }
    });

    const labaKotor = totalPenjualan - totalModal;
    const marginLaba = totalPenjualan > 0 ? ((labaKotor / totalPenjualan) * 100).toFixed(1) : 0;
    const jumlahTransaksi = filteredTransaksi.length;
    const rataRata = jumlahTransaksi > 0 ? Math.round(totalPenjualan / jumlahTransaksi) : 0;

    return {
      totalPenjualan,
      totalModal,
      labaKotor,
      marginLaba,
      jumlahTransaksi,
      rataRata
    };
  }, [filteredTransaksi]);

  // Traffic Chart Data for the selected date range
  const trafficChartData = useMemo(() => {
    const diffTime = Math.abs(dateRangeBounds.end - dateRangeBounds.start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    const daysCount = Math.min(diffDays, 30); // Max 30 bars

    const points = [];
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(dateRangeBounds.end.getTime() - i * 86400000);
      const dateKey = `${d.getDate()}/${d.getMonth() + 1}`;
      const dayName = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"][d.getDay()];

      let dayTotal = 0;
      let dayLaba = 0;

      transaksiList.forEach((tx) => {
        const txDate = parseDate(tx.tanggal || tx.createdAt);
        if (
          txDate.getDate() === d.getDate() &&
          txDate.getMonth() === d.getMonth() &&
          txDate.getFullYear() === d.getFullYear()
        ) {
          dayTotal += Number(tx.totalBelanja) || 0;
          if (Array.isArray(tx.items)) {
            tx.items.forEach((item) => {
              const modal = Number(item.hargaModal) || 0;
              const qty = Number(item.qty) || 0;
              dayLaba += (Number(item.hargaSatuan) - modal) * qty;
            });
          }
        }
      });

      points.push({
        label: daysCount <= 7 ? `${dayName} (${dateKey})` : dateKey,
        date: dateKey,
        total: dayTotal,
        laba: dayLaba
      });
    }

    const maxVal = Math.max(...points.map((p) => p.total), 1);
    return { points, maxVal };
  }, [transaksiList, dateRangeBounds]);

  // Pelunasan & Hutang dalam periode
  const cicilanDalamPeriode = useMemo(() => {
    return hutangList.filter((h) => {
      const d = parseDate(h.tanggal || h.createdAt);
      return (
        d >= dateRangeBounds.start &&
        d <= dateRangeBounds.end &&
        (h.tipe === "cicilan" || h.tipe === "lunas" || h.jumlah < 0)
      );
    });
  }, [hutangList, dateRangeBounds]);

  const totalCicilanDiterima = useMemo(() => {
    return cicilanDalamPeriode.reduce((sum, c) => sum + Math.abs(c.jumlah), 0);
  }, [cicilanDalamPeriode]);

  const totalHutangBeredar = useMemo(() => {
    return pelangganList.reduce((sum, p) => sum + (p.totalHutang || 0), 0);
  }, [pelangganList]);

  const formatRp = (num) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(num || 0);

  const toggleExpand = (id) => {
    setExpandedTxId(expandedTxId === id ? null : id);
  };

  const handleExportCSV = () => {
    if (filteredTransaksi.length === 0) {
      alert("Tidak ada data transaksi untuk diekspor.");
      return;
    }

    const headers = ["ID Transaksi", "Tanggal", "Metode Bayar", "Pelanggan", "Rincian Barang", "Total Belanja (Rp)"];
    const rows = filteredTransaksi.map((tx) => [
      tx.id,
      `"${tx.tanggalFormatted || "-"}"`,
      tx.metodeBayar.toUpperCase(),
      `"${tx.pelangganNama || "-"}"`,
      `"${tx.items ? tx.items.map(i => `${i.nama} (${i.qty}x)`).join("; ") : "-"}"`,
      tx.totalBelanja
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Transaksi_${rentangPeriode}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-purple-600" />
            <h1 className="text-xl font-black text-slate-900">Laporan & Analisis Penjualan</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Pantau traffic omzet, estimasi laba kotor, dan arus kas hutang piutang toko
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeTab === "penjualan" && (
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-xs"
              title="Unduh file Excel/CSV"
            >
              <Download className="w-4 h-4" />
              <span>Ekspor CSV</span>
            </button>
          )}

          {/* Tab Switcher: Penjualan vs Hutang */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
            <button
              onClick={() => setActiveTab("penjualan")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
                activeTab === "penjualan"
                  ? "bg-white text-purple-700 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Laporan Penjualan
            </button>
            <button
              onClick={() => setActiveTab("hutang")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
                activeTab === "hutang"
                  ? "bg-white text-amber-700 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Laporan Hutang & Cicilan
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar: Periode & Tanggal */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Quick Period Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
              Periode:
            </span>
            {[
              { id: "hari_ini", label: "Hari Ini" },
              { id: "7_hari", label: "7 Hari Terakhir" },
              { id: "30_hari", label: "30 Hari Terakhir" },
              { id: "custom", label: "Kustom Tanggal" }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setRentangPeriode(p.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                  rentangPeriode === p.id
                    ? "bg-purple-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom Date Inputs if 'custom' is active */}
          {rentangPeriode === "custom" && (
            <div className="flex items-center space-x-2 text-xs">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="p-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
              <span className="text-slate-400">s/d</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="p-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {activeTab === "penjualan" ? (
        <>
          {/* 4 Financial Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Penjualan */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Total Penjualan (Omzet)
                </span>
                <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900">
                  {formatRp(ringkasanKeuangan.totalPenjualan)}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {ringkasanKeuangan.jumlahTransaksi} transaksi tercatat
                </div>
              </div>
            </div>

            {/* Total Modal HPP */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Total Modal (HPP)
                </span>
                <div className="p-2 bg-slate-100 text-slate-600 rounded-xl">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-700">
                  {formatRp(ringkasanKeuangan.totalModal)}
                </div>
                <div className="text-xs text-slate-400 mt-1">Estimasi belanja modal barang</div>
              </div>
            </div>

            {/* Estimasi Laba Kotor */}
            <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800">
                  Laba Kotor
                </span>
                <div className="p-2 bg-emerald-200/60 text-emerald-800 rounded-xl">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-emerald-900">
                  {formatRp(ringkasanKeuangan.labaKotor)}
                </div>
                <div className="text-xs font-bold text-emerald-700 mt-1">
                  Margin: {ringkasanKeuangan.marginLaba}% dari omzet
                </div>
              </div>
            </div>

            {/* Rata-Rata Nilai Struk */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Rata-Rata Struk
                </span>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900">
                  {formatRp(ringkasanKeuangan.rataRata)}
                </div>
                <div className="text-xs text-slate-400 mt-1">Per satu struk belanja</div>
              </div>
            </div>
          </div>

          {/* Traffic Chart Card */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Grafik Traffic Penjualan Real-time
                </h3>
                <p className="text-xs text-slate-400">
                  Visualisasi volume omzet penjualan toko per hari
                </p>
              </div>
              <div className="text-xs font-semibold text-slate-500 flex items-center space-x-2">
                <span className="inline-block w-3 h-3 bg-purple-600 rounded"></span>
                <span>Omzet Penjualan</span>
              </div>
            </div>

            {/* Responsive Visual Bar Chart */}
            <div className="pt-6 pb-2">
              <div className="flex items-end justify-between gap-2 h-52 border-b border-slate-200 px-2 overflow-x-auto">
                {trafficChartData.points.map((pt, idx) => {
                  const heightPct = Math.max(
                    6,
                    Math.round((pt.total / trafficChartData.maxVal) * 100)
                  );

                  return (
                    <div
                      key={idx}
                      className="flex-1 min-w-[28px] max-w-[50px] flex flex-col items-center group relative"
                    >
                      {/* Hover Tooltip */}
                      <div className="absolute -top-12 bg-slate-900 text-white text-[10px] font-bold py-1 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-10 shadow-lg text-center">
                        <div>{formatRp(pt.total)}</div>
                        <div className="text-emerald-400 text-[9px]">Laba: {formatRp(pt.laba)}</div>
                      </div>

                      {/* Bar Column */}
                      <div
                        style={{ height: `${heightPct}%` }}
                        className="w-full bg-purple-600 hover:bg-purple-700 rounded-t-lg transition-all duration-300 shadow-xs"
                      />

                      {/* Label Axis */}
                      <div className="mt-2 text-center">
                        <span className="block text-[10px] font-bold text-slate-600 truncate">
                          {pt.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Tabel Riwayat Transaksi & Detail Item */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Rincian Transaksi ({filteredTransaksi.length})
                </h3>
                <p className="text-xs text-slate-400">Klik baris transaksi untuk melihat detail barang</p>
              </div>

              {/* Filter Metode & Search */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari ID/Produk/Pelanggan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <select
                  value={filterMetode}
                  onChange={(e) => setFilterMetode(e.target.value)}
                  className="py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold text-slate-600"
                >
                  <option value="semua">Semua Metode</option>
                  <option value="cash">Tunai (Cash)</option>
                  <option value="qris">QRIS</option>
                  <option value="bon">Bon (Hutang)</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : filteredTransaksi.length === 0 ? (
              <div className="text-center p-12 text-slate-400">
                <FileText className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-medium">Tidak ada data transaksi pada periode ini.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredTransaksi.map((tx) => {
                  const isExpanded = expandedTxId === tx.id;
                  const itemsCount = tx.items?.length || 0;

                  return (
                    <div key={tx.id} className="transition hover:bg-slate-50/50">
                      {/* Summary Row */}
                      <div
                        onClick={() => toggleExpand(tx.id)}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`p-2 rounded-xl text-xs font-black uppercase ${
                              tx.metodeBayar === "qris"
                                ? "bg-purple-100 text-purple-700"
                                : tx.metodeBayar === "bon"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {tx.metodeBayar}
                          </div>

                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-slate-800 text-sm">{tx.id}</span>
                              {tx.pelangganNama && (
                                <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                                  {tx.pelangganNama}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              {tx.tanggalFormatted || "Tanggal -"} • {itemsCount} barang
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end space-x-4">
                          <div className="text-right">
                            <div className="text-base font-black text-slate-900">
                              {formatRp(tx.totalBelanja)}
                            </div>
                            {tx.uangDiterima && tx.kembalian !== null && (
                              <div className="text-[11px] text-slate-400">
                                Kembalian: {formatRp(tx.kembalian)}
                              </div>
                            )}
                          </div>

                          <button className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5" />
                            ) : (
                              <ChevronDown className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Details: Items list */}
                      {isExpanded && (
                        <div className="bg-slate-50/80 p-4 border-t border-slate-100 space-y-2">
                          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Rincian Item Belanja
                          </div>
                          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                            <table className="w-full text-xs text-left">
                              <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                                <tr>
                                  <th className="p-2.5">Produk</th>
                                  <th className="p-2.5 text-center">Qty</th>
                                  <th className="p-2.5 text-right">Harga</th>
                                  <th className="p-2.5 text-right">Subtotal</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {tx.items?.map((item, iIdx) => (
                                  <tr key={iIdx}>
                                    <td className="p-2.5 font-medium text-slate-800">
                                      {item.nama}
                                    </td>
                                    <td className="p-2.5 text-center font-bold text-slate-600">
                                      {item.qty}
                                    </td>
                                    <td className="p-2.5 text-right text-slate-500">
                                      {formatRp(item.hargaSatuan)}
                                    </td>
                                    <td className="p-2.5 text-right font-bold text-slate-800">
                                      {formatRp(item.subtotal)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        /* TAB LAPORAN HUTANG & CICILAN */
        <div className="space-y-4">
          {/* Ringkasan Hutang & Cicilan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-red-50 p-5 rounded-2xl border border-red-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
                  Total Hutang Beredar Saat Ini
                </span>
                <div className="text-2xl font-black text-red-900 mt-1">
                  {formatRp(totalHutangBeredar)}
                </div>
                <div className="text-xs text-red-700 mt-1">
                  Akumulasi piutang seluruh pelanggan
                </div>
              </div>
              <div className="p-3 bg-red-100 text-red-600 rounded-2xl">
                <AlertCircle className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                  Cicilan Masuk (Periode Ini)
                </span>
                <div className="text-2xl font-black text-emerald-900 mt-1">
                  {formatRp(totalCicilanDiterima)}
                </div>
                <div className="text-xs text-emerald-700 mt-1">
                  {cicilanDalamPeriode.length} kali pembayaran diterima
                </div>
              </div>
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Riwayat Pembayaran / Cicilan dalam periode */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <h3 className="text-base font-bold text-slate-800 mb-3">
              Riwayat Pembayaran & Cicilan Diterima
            </h3>

            {cicilanDalamPeriode.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm">
                Belum ada pembayaran cicilan yang tercatat pada rentang periode ini.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {cicilanDalamPeriode.map((h) => {
                  const nominal = Math.abs(h.jumlah);
                  const cust = pelangganList.find((p) => p.id === h.pelangganId);

                  return (
                    <div key={h.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                          <ArrowDownRight className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-800">
                            {cust ? cust.nama : "Pelanggan"}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {h.tanggalFormatted || "Tanggal -"} • {h.catatan || "Pembayaran cicilan"}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-black text-emerald-600">
                          + {formatRp(nominal)}
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full uppercase">
                          {h.tipe}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
