import React, { useState, useMemo } from "react";
import { Search, Package, Plus, Check, AlertTriangle, Sparkles } from "lucide-react";

export default function ProductGrid({ 
  products = [], 
  cartItems = [], 
  onAddToCart, 
  onSeedDemo,
  isSeeding = false 
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");

  // Extract categories dynamically
  const categories = useMemo(() => {
    const set = new Set(["Semua"]);
    products.forEach((p) => {
      if (p.kategori) set.add(p.kategori);
    });
    return Array.from(set);
  }, [products]);

  // Filter products by search & category
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchQuery = 
        (p.nama || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.kodeBarcode || "").includes(searchQuery);
      const matchCategory = 
        selectedCategory === "Semua" || p.kategori === selectedCategory;
      return matchQuery && matchCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const getCartQuantity = (productId) => {
    const item = cartItems.find((i) => i.produkId === productId);
    return item ? item.qty : 0;
  };

  const formatRupiah = (num) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(num || 0);
  };

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Top Search & Filter Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm space-y-2.5">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama produk sembako / barcode..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              Hapus
            </button>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid List of Products */}
      <div className="flex-1 overflow-y-auto pr-1">
        {products.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-300 text-center flex flex-col items-center justify-center min-h-[300px]">
            <Package className="w-12 h-12 text-slate-300 mb-2" />
            <h3 className="font-semibold text-slate-700 text-base">Katalog Produk Kosong</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4">
              Belum ada data barang di toko ini. Anda dapat menginisialisasi 10 produk sembako populer secara otomatis.
            </p>
            <button
              onClick={onSeedDemo}
              disabled={isSeeding}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition flex items-center space-x-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSeeding ? "Menginisialisasi..." : "Inisialisasi 10 Produk Sembako"}</span>
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center py-12">
            <Search className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-600">Tidak ada produk yang cocok</p>
            <p className="text-xs text-slate-400 mt-1">Coba gunakan kata kunci pencarian yang lain.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
            {filteredProducts.map((p) => {
              const inCartQty = getCartQuantity(p.id);
              const isOutOfStock = (p.stok || 0) <= 0;
              const isLowStock = !isOutOfStock && (p.stok || 0) <= (p.stokMinimum || 5);
              const isCartMax = inCartQty >= (p.stok || 0);

              return (
                <div
                  key={p.id}
                  onClick={() => !isOutOfStock && onAddToCart(p)}
                  className={`group relative bg-white p-3 rounded-xl border transition-all text-left flex flex-col justify-between select-none ${
                    isOutOfStock
                      ? "opacity-50 border-slate-200 cursor-not-allowed bg-slate-50"
                      : inCartQty > 0
                      ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm cursor-pointer"
                      : "border-slate-200/80 hover:border-emerald-500 hover:shadow-md cursor-pointer"
                  }`}
                >
                  {/* Category & in-cart badge */}
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase">
                      {p.kategori || "Sembako"}
                    </span>
                    {inCartQty > 0 && (
                      <span className="inline-flex items-center text-[11px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full shadow-sm">
                        {inCartQty} {p.satuan || "pcs"}
                      </span>
                    )}
                  </div>

                  {/* Product Name */}
                  <div className="my-1">
                    <h4 className="font-semibold text-slate-800 text-sm leading-snug line-clamp-2">
                      {p.nama}
                    </h4>
                  </div>

                  {/* Price & Stock info */}
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-end justify-between">
                    <div>
                      <div className="text-[11px] text-slate-400">Harga</div>
                      <div className="font-bold text-slate-900 text-sm">
                        {formatRupiah(p.hargaJual)}
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${
                          isOutOfStock
                            ? "bg-rose-100 text-rose-700"
                            : isLowStock
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {isOutOfStock ? "Habis" : `Stok: ${p.stok}`}
                      </span>
                    </div>
                  </div>

                  {/* Warning if cart reached stock limit */}
                  {isCartMax && inCartQty > 0 && (
                    <div className="mt-1 text-[10px] text-amber-600 font-medium flex items-center space-x-1">
                      <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                      <span>Maksimal stok tercapai</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
