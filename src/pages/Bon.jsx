import React, { useState, useEffect, useMemo } from "react";
import { 
  BookOpen, Plus, Search, Filter, Phone, MapPin, 
  Wallet, MessageCircle, ArrowRight, UserPlus, 
  AlertCircle, CheckCircle, Users 
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { 
  subscribePelanggan, 
  addPelanggan, 
  updatePelanggan 
} from "../services/pelangganService";
import { recordPembayaranCicilan } from "../services/hutangService";

import PelangganFormModal from "../components/Bon/PelangganFormModal";
import BayarCicilanModal from "../components/Bon/BayarCicilanModal";
import DetailHutangModal from "../components/Bon/DetailHutangModal";

export default function Bon() {
  const { agenId, nama: currentUserNama } = useAuth();

  const [pelangganList, setPelangganList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, berhutang, lunas

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isBayarOpen, setIsBayarOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedPelanggan, setSelectedPelanggan] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!agenId) return;
    setLoading(true);
    const unsubscribe = subscribePelanggan(agenId, (data) => {
      setPelangganList(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [agenId]);

  // Keep selectedPelanggan updated with latest real-time data
  useEffect(() => {
    if (selectedPelanggan) {
      const updated = pelangganList.find((p) => p.id === selectedPelanggan.id);
      if (updated) setSelectedPelanggan(updated);
    }
  }, [pelangganList]);

  // Calculations
  const totalHutangBeredar = useMemo(() => {
    return pelangganList.reduce((acc, curr) => acc + (curr.totalHutang || 0), 0);
  }, [pelangganList]);

  const jumlahPelangganBerhutang = useMemo(() => {
    return pelangganList.filter((p) => (p.totalHutang || 0) > 0).length;
  }, [pelangganList]);

  // Filter & Search
  const filteredPelanggan = useMemo(() => {
    return pelangganList.filter((p) => {
      const query = searchQuery.toLowerCase();
      const matchSearch =
        p.nama.toLowerCase().includes(query) ||
        (p.noHp && p.noHp.includes(query)) ||
        (p.alamat && p.alamat.toLowerCase().includes(query));

      const hutang = p.totalHutang || 0;
      let matchStatus = true;
      if (filterStatus === "berhutang") matchStatus = hutang > 0;
      if (filterStatus === "lunas") matchStatus = hutang === 0;

      return matchSearch && matchStatus;
    });
  }, [pelangganList, searchQuery, filterStatus]);

  const formatRp = (num) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(num || 0);

  // Handlers
  const handleOpenAdd = () => {
    setIsAddOpen(true);
  };

  const handleOpenBayar = (pelanggan) => {
    setSelectedPelanggan(pelanggan);
    setIsBayarOpen(true);
  };

  const handleOpenDetail = (pelanggan) => {
    setSelectedPelanggan(pelanggan);
    setIsDetailOpen(true);
  };

  const handleSavePelanggan = async (pelangganData) => {
    if (!agenId) return;
    setIsSaving(true);
    try {
      await addPelanggan(pelangganData, agenId);
      setIsAddOpen(false);
    } catch (err) {
      alert("Gagal menambahkan pelanggan: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBayar = async ({ pelangganId, jumlahBayar, catatan }) => {
    if (!agenId) return;
    setIsSaving(true);
    try {
      await recordPembayaranCicilan({
        pelangganId,
        jumlahBayar,
        catatan,
        dicatatOleh: currentUserNama || "Kasir",
        agenId
      });
      setIsBayarOpen(false);
    } catch (err) {
      alert("Gagal mencatat pembayaran: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleWhatsAppDirect = (e, p) => {
    e.stopPropagation();
    if (!p.noHp) {
      alert("Nomor WhatsApp pelanggan belum terdaftar.");
      return;
    }
    let cleanPhone = p.noHp.replace(/\D/g, "");
    if (cleanPhone.startsWith("0")) cleanPhone = "62" + cleanPhone.slice(1);
    else if (!cleanPhone.startsWith("62")) cleanPhone = "62" + cleanPhone;

    const pesan = `Halo ${p.nama}, mengingatkan catatan bon belanja di Toko Sembako sebesar *${formatRp(p.totalHutang || 0)}*. Terima kasih banyak!`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(pesan)}`, "_blank");
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-6 h-6 text-amber-600" />
          <div>
            <h1 className="text-xl font-bold text-slate-800">Hutang & Bon Pelanggan</h1>
            <p className="text-xs text-slate-400">Pencatatan piutang warung, cicilan, dan reminder WhatsApp</p>
          </div>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition flex items-center justify-center space-x-1.5 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Pelanggan</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total Hutang Beredar */}
        <div className="bg-white p-4 rounded-2xl border border-red-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-red-600 uppercase tracking-wider">
              Total Hutang Beredar
            </div>
            <div className="text-xl font-black text-slate-800 mt-1">
              {formatRp(totalHutangBeredar)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Pelanggan Belum Lunas */}
        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-amber-600 uppercase tracking-wider">
              Pelanggan Berhutang
            </div>
            <div className="text-xl font-black text-slate-800 mt-1">
              {jumlahPelangganBerhutang} Warung
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        {/* Total Pelanggan Terdaftar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Pelanggan
            </div>
            <div className="text-xl font-black text-slate-800 mt-1">
              {pelangganList.length} Terdaftar
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama pelanggan / nomor HP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setFilterStatus("all")}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
              filterStatus === "all" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setFilterStatus("berhutang")}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
              filterStatus === "berhutang" ? "bg-red-500 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Punya Bon
          </button>
          <button
            onClick={() => setFilterStatus("lunas")}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
              filterStatus === "lunas" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Lunas
          </button>
        </div>
      </div>

      {/* Customer List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : filteredPelanggan.length === 0 ? (
          <div className="text-center p-12 text-slate-400">
            <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium">Tidak ada data pelanggan yang cocok.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredPelanggan.map((p) => {
              const hutang = p.totalHutang || 0;
              const isLunas = hutang === 0;

              return (
                <div
                  key={p.id}
                  onClick={() => handleOpenDetail(p)}
                  className="p-4 sm:p-5 hover:bg-slate-50/75 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  {/* Customer Info */}
                  <div className="flex items-start space-x-3.5">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 font-black text-sm ${
                        isLunas
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {p.nama.charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-slate-800 text-base leading-snug">
                          {p.nama}
                        </h3>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            isLunas
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {isLunas ? "LUNAS" : "BERHUTANG"}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                        {p.noHp && (
                          <span className="flex items-center space-x-1">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{p.noHp}</span>
                          </span>
                        )}
                        {p.alamat && (
                          <span className="flex items-center space-x-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{p.alamat}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Debt Amount & Action Buttons */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <div className="text-[11px] text-slate-400 uppercase font-semibold">
                        Total Hutang
                      </div>
                      <div
                        className={`text-lg font-black ${
                          isLunas ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        {formatRp(hutang)}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {!isLunas && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenBayar(p);
                          }}
                          className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition border border-emerald-200 text-xs font-bold flex items-center space-x-1 shadow-xs"
                          title="Bayar Cicilan"
                        >
                          <Wallet className="w-4 h-4" />
                          <span className="hidden md:inline">Cicil</span>
                        </button>
                      )}

                      {!isLunas && p.noHp && (
                        <button
                          onClick={(e) => handleWhatsAppDirect(e, p)}
                          className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition border border-emerald-200 text-xs font-bold flex items-center space-x-1 shadow-xs"
                          title="Kirim Pengingat WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4 text-emerald-600" />
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetail(p);
                        }}
                        className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition text-xs font-bold flex items-center space-x-1"
                        title="Lihat Riwayat Bon"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <PelangganFormModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSave={handleSavePelanggan}
        isSaving={isSaving}
      />

      <BayarCicilanModal
        isOpen={isBayarOpen}
        onClose={() => setIsBayarOpen(false)}
        onSave={handleSaveBayar}
        pelanggan={selectedPelanggan}
        isSaving={isSaving}
      />

      <DetailHutangModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        pelanggan={selectedPelanggan}
        onOpenBayar={handleOpenBayar}
      />
    </div>
  );
}
