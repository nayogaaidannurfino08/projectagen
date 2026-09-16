import React, { useState, useEffect } from "react";
import { 
  X, User, Phone, MapPin, Plus, ArrowUpRight, 
  ArrowDownRight, MessageCircle, Wallet, CheckCircle2 
} from "lucide-react";
import { subscribeHutangByPelanggan } from "../../services/hutangService";

export default function DetailHutangModal({
  isOpen,
  onClose,
  pelanggan,
  onOpenBayar
}) {
  const [riwayat, setRiwayat] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe;
    if (isOpen && pelanggan?.id) {
      setLoading(true);
      unsubscribe = subscribeHutangByPelanggan(pelanggan.id, (data) => {
        setRiwayat(data);
        setLoading(false);
      });
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isOpen, pelanggan?.id]);

  if (!isOpen || !pelanggan) return null;

  const totalHutang = pelanggan.totalHutang || 0;
  const isLunas = totalHutang === 0;

  const formatRp = (num) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(num || 0);

  const formatDate = (dateValue, fallbackFormatted) => {
    if (fallbackFormatted) return fallbackFormatted;
    if (!dateValue) return "-";
    let d = dateValue;
    if (typeof dateValue.toDate === "function") {
      d = dateValue.toDate();
    } else if (typeof dateValue === "string") {
      d = new Date(dateValue);
    }
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(d);
  };

  // WhatsApp share link generator
  const handleKirimWhatsApp = () => {
    if (!pelanggan.noHp) {
      alert("Nomor WhatsApp pelanggan belum dicatat. Silakan edit data pelanggan terlebih dahulu.");
      return;
    }

    let cleanPhone = pelanggan.noHp.replace(/\D/g, "");
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "62" + cleanPhone.slice(1);
    } else if (!cleanPhone.startsWith("62")) {
      cleanPhone = "62" + cleanPhone;
    }

    const pesan = `Halo ${pelanggan.nama}, kami dari Toko Sembako Agen ingin mengonfirmasikan catatan bon/hutang belanja Anda saat ini adalah sebesar *${formatRp(totalHutang)}*.\n\nMohon dicek kembali ya. Terima kasih banyak!`;
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(pesan)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold">Detail Hutang & Riwayat Bon</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customer Profile Banner */}
        <div className="p-5 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="text-lg font-black text-slate-800">{pelanggan.nama}</h4>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    isLunas
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {isLunas ? "LUNAS" : "BELUM LUNAS"}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                {pelanggan.noHp && (
                  <span className="flex items-center space-x-1">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{pelanggan.noHp}</span>
                  </span>
                )}
                {pelanggan.alamat && (
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{pelanggan.alamat}</span>
                  </span>
                )}
              </div>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                Total Hutang Berjalan
              </div>
              <div
                className={`text-2xl font-black ${
                  isLunas ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {formatRp(totalHutang)}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex flex-wrap gap-2">
            {!isLunas && (
              <button
                onClick={() => {
                  onClose();
                  onOpenBayar(pelanggan);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center space-x-1.5"
              >
                <Wallet className="w-4 h-4" />
                <span>Catat Pembayaran / Cicilan</span>
              </button>
            )}

            {!isLunas && (
              <button
                onClick={handleKirimWhatsApp}
                className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>Kirim Pengingat WhatsApp</span>
              </button>
            )}
          </div>
        </div>

        {/* History List */}
        <div className="p-5 overflow-y-auto flex-1">
          <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            Riwayat Bon & Pembayaran ({riwayat.length})
          </h5>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
          ) : riwayat.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <CheckCircle2 className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium">Belum ada riwayat transaksi hutang.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {riwayat.map((h) => {
                const isHutangBaru = h.tipe === "bon_baru" || h.jumlah > 0;
                const nominal = Math.abs(h.jumlah);

                return (
                  <div
                    key={h.id}
                    className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-start justify-between gap-3 shadow-xs hover:border-slate-300 transition"
                  >
                    <div className="flex items-start space-x-3">
                      <div
                        className={`p-2 rounded-xl mt-0.5 ${
                          isHutangBaru
                            ? "bg-red-50 text-red-600 border border-red-200"
                            : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                        }`}
                      >
                        {isHutangBaru ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                              isHutangBaru
                                ? "bg-red-100 text-red-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {isHutangBaru ? "Bon Baru (+)" : "Cicilan / Lunas (-)"}
                          </span>
                          <span className="text-xs text-slate-400">
                            {formatDate(h.tanggal, h.tanggalFormatted)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 font-medium mt-1">
                          {h.catatan || "-"}
                        </p>
                        {h.dicatatOleh && (
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Dicatat oleh: {h.dicatatOleh}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-sm font-black ${
                          isHutangBaru ? "text-red-600" : "text-emerald-600"
                        }`}
                      >
                        {isHutangBaru ? "+" : "-"} {formatRp(nominal)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
