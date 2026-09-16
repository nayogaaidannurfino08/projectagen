import React from "react";
import { CheckCircle2, Printer, X, ShoppingBag } from "lucide-react";

export default function ReceiptModal({
  isOpen,
  onClose,
  transaksiData,
  onNewTransaction
}) {
  if (!isOpen || !transaksiData) return null;

  const formatRupiah = (num) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(num || 0);
  };

  const handlePrint = () => {
    window.print();
  };

  const isCash = transaksiData.metodeBayar === "cash";
  const isBon = transaksiData.metodeBayar === "bon";
  const isQris = transaksiData.metodeBayar === "qris";

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Top Success Banner */}
        <div className="bg-emerald-600 text-white p-4 text-center">
          <div className="inline-flex p-2 bg-white/20 rounded-full mb-1">
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-extrabold text-base">Transaksi Berhasil!</h3>
          <p className="text-xs text-emerald-100">Stok otomatis diperbarui di database.</p>
        </div>

        {/* Receipt Slip Container (Thermal Paper style) */}
        <div id="thermal-receipt" className="p-5 font-mono text-xs text-slate-800 space-y-3 bg-slate-50 border-y border-dashed border-slate-300">
          {/* Header Toko */}
          <div className="text-center space-y-0.5">
            <h4 className="font-black text-sm tracking-wider uppercase">APS AGEN SEMBAKO</h4>
            <p className="text-[10px] text-slate-500">Pusat Grosir & Eceran Sembako</p>
            <p className="text-[10px] text-slate-400">ID Agen: {transaksiData.agenId || "agen_01"}</p>
          </div>

          <div className="border-b border-dashed border-slate-300 pt-1"></div>

          {/* Meta Information */}
          <div className="space-y-1 text-[11px] text-slate-600">
            <div className="flex justify-between">
              <span>No. Transaksi</span>
              <span className="font-semibold text-slate-800">{transaksiData.id}</span>
            </div>
            <div className="flex justify-between">
              <span>Tanggal</span>
              <span>{new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
            </div>
            <div className="flex justify-between">
              <span>Kasir</span>
              <span>{transaksiData.kasirId || "Kasir Toko"}</span>
            </div>
          </div>

          <div className="border-b border-dashed border-slate-300"></div>

          {/* Itemized list */}
          <div className="space-y-1.5 py-1">
            {transaksiData.items?.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start text-[11px]">
                <div className="flex-1 pr-2">
                  <div className="font-semibold text-slate-800">{item.nama}</div>
                  <div className="text-slate-400 text-[10px]">
                    {item.qty} x {formatRupiah(item.hargaSatuan)}
                  </div>
                </div>
                <div className="font-bold text-slate-900">
                  {formatRupiah(item.subtotal)}
                </div>
              </div>
            ))}
          </div>

          <div className="border-b border-dashed border-slate-300"></div>

          {/* Totals & Payment info */}
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between font-bold text-xs pt-1">
              <span>TOTAL</span>
              <span className="text-sm font-black text-slate-900">{formatRupiah(transaksiData.totalBelanja)}</span>
            </div>

            <div className="flex justify-between text-slate-600">
              <span>Metode Bayar</span>
              <span className="uppercase font-semibold text-slate-800">
                {isCash ? "Tunai" : isQris ? "QRIS" : "Bon / Hutang"}
              </span>
            </div>

            {isCash && (
              <>
                <div className="flex justify-between text-slate-600">
                  <span>Tunai Diterima</span>
                  <span>{formatRupiah(transaksiData.uangDiterima)}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-700">
                  <span>Kembalian</span>
                  <span>{formatRupiah(transaksiData.kembalian)}</span>
                </div>
              </>
            )}

            {isBon && (
              <div className="mt-1 p-2 bg-amber-100/70 rounded text-[10px] text-amber-900 space-y-0.5">
                <div className="font-bold">Dicatat atas nama: {transaksiData.pelangganNama || "Pelanggan"}</div>
                <div>Status: Ditambahkan ke buku hutang</div>
              </div>
            )}
          </div>

          {/* Footer Receipt Note */}
          <div className="border-t border-dashed border-slate-300 pt-2 text-center text-[10px] text-slate-400 space-y-0.5">
            <p>Terima kasih atas kunjungan Anda!</p>
            <p>Barang yang dibeli tidak dapat ditukar.</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-white flex flex-col sm:flex-row gap-2">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Cetak / Screenshot</span>
          </button>

          <button
            onClick={onNewTransaction}
            className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-md transition"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Transaksi Baru</span>
          </button>
        </div>
      </div>
    </div>
  );
}
