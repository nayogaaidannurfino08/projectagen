import React from "react";
import { ShoppingCart, Plus, Minus, Trash2, ArrowRight } from "lucide-react";

export default function CartPanel({
  cartItems = [],
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onOpenPayment
}) {
  const totalBelanja = cartItems.reduce((acc, curr) => acc + (curr.subtotal || 0), 0);
  const totalQty = cartItems.reduce((acc, curr) => acc + (curr.qty || 0), 0);

  const formatRupiah = (num) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(num || 0);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
      {/* Panel Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base">Keranjang Kasir</h3>
            <p className="text-xs text-slate-500">{totalQty} item dipilih</p>
          </div>
        </div>

        {cartItems.length > 0 && (
          <button
            onClick={onClearCart}
            className="text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1 rounded hover:bg-rose-50 transition"
          >
            Kosongkan
          </button>
        )}
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-slate-100">
        {cartItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400">
            <div className="p-4 bg-slate-50 rounded-full mb-3">
              <ShoppingCart className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-600">Keranjang Kosong</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Klik produk pada daftar di sebelah kiri untuk menambahkan barang ke keranjang.
            </p>
          </div>
        ) : (
          cartItems.map((item) => {
            const isAtMaxStock = item.qty >= (item.stokTersedia || 9999);
            return (
              <div key={item.produkId} className="pt-2 first:pt-0 flex flex-col space-y-1">
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-2">
                    <h5 className="text-sm font-semibold text-slate-800 leading-snug line-clamp-1">
                      {item.nama}
                    </h5>
                    <div className="text-xs text-slate-400">
                      {formatRupiah(item.hargaSatuan)} / {item.satuan || "pcs"}
                    </div>
                  </div>
                  <button
                    onClick={() => onRemoveItem(item.produkId)}
                    className="text-slate-300 hover:text-rose-500 p-1 rounded transition"
                    title="Hapus dari keranjang"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Subtotal & Qty Modifier */}
                <div className="flex items-center justify-between pt-1">
                  <div className="font-bold text-sm text-slate-900">
                    {formatRupiah(item.subtotal)}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onUpdateQty(item.produkId, item.qty - 1)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-600 transition active:scale-95"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-sm font-bold w-6 text-center text-slate-800">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => onUpdateQty(item.produkId, item.qty + 1)}
                      disabled={isAtMaxStock}
                      className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent text-slate-600 transition active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {isAtMaxStock && (
                  <div className="text-[10px] text-amber-600">
                    Stok toko tersisa {item.stokTersedia} {item.satuan || "pcs"}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Cart Summary & Checkout Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-3">
        <div className="space-y-1.5 text-xs text-slate-500">
          <div className="flex justify-between">
            <span>Subtotal ({totalQty} item)</span>
            <span className="font-medium text-slate-700">{formatRupiah(totalBelanja)}</span>
          </div>
          <div className="flex justify-between items-baseline pt-1 border-t border-slate-200">
            <span className="text-sm font-bold text-slate-900">Total Belanja</span>
            <span className="text-xl font-extrabold text-emerald-600">{formatRupiah(totalBelanja)}</span>
          </div>
        </div>

        <button
          onClick={onOpenPayment}
          disabled={cartItems.length === 0}
          className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg transition flex items-center justify-between text-sm"
        >
          <span>Lanjut ke Pembayaran</span>
          <div className="flex items-center space-x-1">
            <span>{formatRupiah(totalBelanja)}</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </div>
        </button>
      </div>
    </div>
  );
}
