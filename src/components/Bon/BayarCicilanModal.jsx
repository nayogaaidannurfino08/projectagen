import React, { useState, useEffect } from "react";
import { X, CheckCircle, Wallet, AlertCircle } from "lucide-react";

export default function BayarCicilanModal({
  isOpen,
  onClose,
  onSave,
  pelanggan,
  isSaving = false
}) {
  const [nominal, setNominal] = useState("");
  const [catatan, setCatatan] = useState("");

  useEffect(() => {
    if (isOpen) {
      setNominal("");
      setCatatan("");
    }
  }, [isOpen, pelanggan]);

  if (!isOpen || !pelanggan) return null;

  const totalHutang = pelanggan.totalHutang || 0;
  const inputNominal = Number(nominal) || 0;
  const sisaHutang = Math.max(0, totalHutang - inputNominal);
  const isLunas = inputNominal >= totalHutang && totalHutang > 0;

  const formatRp = (num) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(num || 0);

  const handleSetLunas = () => {
    setNominal(String(totalHutang));
    setCatatan("Pelunasan Hutang");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputNominal <= 0) return;
    onSave({
      pelangganId: pelanggan.id,
      jumlahBayar: inputNominal,
      catatan: catatan.trim() || (isLunas ? "Pelunasan Hutang" : "Pembayaran Cicilan")
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
        <div className="p-4 bg-emerald-600 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Wallet className="w-5 h-5" />
            <h3 className="text-base font-bold">Catat Pembayaran / Cicilan</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-1 rounded-lg text-emerald-100 hover:text-white hover:bg-emerald-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {/* Info Pelanggan & Hutang */}
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl mb-4 text-center">
            <h4 className="font-bold text-slate-800 text-base">{pelanggan.nama}</h4>
            <div className="mt-1 text-xs text-slate-500 uppercase tracking-wider">Total Hutang Berjalan</div>
            <div className="text-xl font-black text-red-600 mt-0.5">
              {formatRp(totalHutang)}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Nominal Pembayaran (Rp) *
                </label>
                {totalHutang > 0 && (
                  <button
                    type="button"
                    onClick={handleSetLunas}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 underline"
                  >
                    Bayar Lunas
                  </button>
                )}
              </div>
              <input
                type="number"
                required
                autoFocus
                min="1"
                max={totalHutang}
                value={nominal}
                onChange={(e) => setNominal(e.target.value)}
                placeholder="0"
                className="w-full p-2.5 border border-slate-300 rounded-xl text-lg font-bold text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Sisa Hutang Kalkulasi */}
            {inputNominal > 0 && (
              <div className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-between ${
                isLunas ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-blue-50 border-blue-200 text-blue-800"
              }`}>
                <span>{isLunas ? "Status setelah bayar:" : "Sisa hutang:"}</span>
                <span className="font-bold text-sm">
                  {isLunas ? "LUNAS (Rp 0)" : formatRp(sisaHutang)}
                </span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                Catatan / Cara Bayar (Opsional)
              </label>
              <input
                type="text"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Contoh: Tunai, Transfer BCA, Dititipkan"
                className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSaving || inputNominal <= 0}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center space-x-2"
              >
                <CheckCircle className="w-5 h-5" />
                <span>{isSaving ? "Menyimpan..." : "Konfirmasi Pembayaran"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
