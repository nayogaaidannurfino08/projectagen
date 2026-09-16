import React, { useState, useEffect } from "react";
import { X, History, ArrowUpRight, ArrowDownRight, Package } from "lucide-react";
import { getStokLogsByProduk } from "../../services/stokLogService";
import { useAuth } from "../../context/AuthContext";

export default function StokLogModal({ isOpen, onClose, produk }) {
  const { agenId } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      if (isOpen && produk && agenId) {
        setLoading(true);
        const data = await getStokLogsByProduk(produk.id);
        setLogs(data);
        setLoading(false);
      }
    };
    fetchLogs();
  }, [isOpen, produk, agenId]);

  if (!isOpen || !produk) return null;

  const formatDate = (dateValue) => {
    if (!dateValue) return "-";
    let d = dateValue;
    if (typeof dateValue.toDate === 'function') {
      d = dateValue.toDate();
    } else if (typeof dateValue === 'string') {
      d = new Date(dateValue);
    }
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(d);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[85vh]">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5" />
            <h3 className="text-base font-bold">Riwayat Stok</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 bg-slate-50 border-b border-slate-200 shrink-0">
          <h4 className="font-bold text-slate-800">{produk.nama}</h4>
          <p className="text-sm text-slate-500 flex items-center mt-1">
            <Package className="w-4 h-4 mr-1" /> Stok saat ini: <span className="font-bold text-slate-700 ml-1">{produk.stok} {produk.satuan}</span>
          </p>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <History className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p>Belum ada riwayat perubahan stok</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => {
                const isMasuk = log.alasan === "restock" || log.alasan === "pembelian";
                const isKeluar = log.alasan === "penjualan" || log.alasan === "koreksi";
                
                const isPositive = log.perubahan > 0;
                
                return (
                  <div key={log.id} className="flex justify-between items-start p-3 bg-white border border-slate-200 rounded-xl">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase ${
                          log.alasan === 'penjualan' ? 'bg-blue-100 text-blue-700' :
                          log.alasan === 'restock' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {log.alasan}
                        </span>
                        <span className="text-xs text-slate-500">{formatDate(log.tanggal)}</span>
                      </div>
                      <p className="text-sm text-slate-700 mt-2">{log.catatan || "-"}</p>
                      <p className="text-xs text-slate-500 mt-1">Oleh: Sistem</p>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <div className={`flex items-center font-bold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                        {isPositive ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
                        {Math.abs(log.perubahan)}
                      </div>
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
