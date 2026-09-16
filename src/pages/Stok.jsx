import React, { useState, useEffect } from "react";
import { 
  Package, Plus, Search, Filter, Edit, PackagePlus, 
  History, AlertTriangle 
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { subscribeProduk, addProduk, updateProduk } from "../services/produkService";
import { addStokLog } from "../services/stokLogService";

import ProdukFormModal from "../components/Stok/ProdukFormModal";
import RestockModal from "../components/Stok/RestockModal";
import StokLogModal from "../components/Stok/StokLogModal";

export default function Stok() {
  const { agenId, nama: currentUserNama } = useAuth();
  
  const [produkList, setProdukList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [kategoriFilter, setKategoriFilter] = useState("Semua");
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [selectedProduk, setSelectedProduk] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!agenId) return;
    setLoading(true);
    const unsubscribe = subscribeProduk(agenId, (data) => {
      setProdukList(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [agenId]);

  // Categories for filter
  const KATEGORIS = ["Semua", ...new Set(produkList.map(p => p.kategori))];

  const filteredProduk = produkList.filter(p => {
    const matchSearch = p.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (p.kodeBarcode && p.kodeBarcode.includes(searchQuery));
    const matchKategori = kategoriFilter === "Semua" || p.kategori === kategoriFilter;
    return matchSearch && matchKategori;
  });

  // Handlers
  const handleOpenAdd = () => {
    setSelectedProduk(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (produk) => {
    setSelectedProduk(produk);
    setIsFormOpen(true);
  };

  const handleOpenRestock = (produk) => {
    setSelectedProduk(produk);
    setIsRestockOpen(true);
  };

  const handleOpenLog = (produk) => {
    setSelectedProduk(produk);
    setIsLogOpen(true);
  };

  const handleSaveProduk = async (produkData) => {
    if (!agenId) return;
    setIsSaving(true);
    try {
      if (selectedProduk) {
        // Edit existing
        const isStokChanged = selectedProduk.stok !== produkData.stok;
        await updateProduk(selectedProduk.id, produkData);
        
        if (isStokChanged) {
          const diff = produkData.stok - selectedProduk.stok;
          await addStokLog({
            agenId,
            produkId: selectedProduk.id,
            namaProduk: produkData.nama,
            alasan: "koreksi",
            perubahan: diff,
            catatan: "Edit stok via form produk",
          });
        }
      } else {
        // Add new
        const newProd = await addProduk(produkData, agenId);
        const pId = newProd.id;
        if (produkData.stok > 0) {
          await addStokLog({
            agenId,
            produkId: pId,
            namaProduk: produkData.nama,
            alasan: "restock",
            perubahan: produkData.stok,
            catatan: "Stok awal produk baru",
          });
        }
      }
      setIsFormOpen(false);
    } catch (err) {
      alert("Gagal menyimpan produk: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveRestock = async (restockData) => {
    if (!agenId) return;
    setIsSaving(true);
    try {
      const { produkId, jenis, jumlah, keterangan, stokAwal } = restockData;
      let perubahan = jenis === "restock" ? jumlah : -jumlah;
      const stokAkhir = stokAwal + perubahan;

      await updateProduk(produkId, { stok: stokAkhir });
      await addStokLog({
        agenId,
        produkId,
        namaProduk: selectedProduk.nama,
        alasan: jenis,
        perubahan,
        catatan: keterangan,
      });
      setIsRestockOpen(false);
    } catch (err) {
      alert("Gagal update stok: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  return (
    <div className="space-y-4">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <Package className="w-6 h-6 text-emerald-600" />
          <h1 className="text-xl font-bold text-slate-800">Kelola Stok & Produk</h1>
        </div>
        <button onClick={handleOpenAdd} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition flex items-center justify-center space-x-1">
          <Plus className="w-4 h-4" />
          <span>Tambah Produk</span>
        </button>
      </div>

      {/* Filter & Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari nama produk atau scan barcode..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="relative">
          <Filter className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select 
            value={kategoriFilter}
            onChange={(e) => setKategoriFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
          >
            {KATEGORIS.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
      </div>

      {/* Product List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : filteredProduk.length === 0 ? (
          <div className="text-center p-10 text-slate-500">
            <Package className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p>Tidak ada produk ditemukan.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Produk</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Kategori</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Harga Jual</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Stok</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProduk.map((p) => {
                    const isLowStock = p.stok <= p.stokMinimum;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-4">
                          <div className="font-bold text-slate-800">{p.nama}</div>
                          {p.kodeBarcode && <div className="text-xs text-slate-500 font-mono mt-0.5">{p.kodeBarcode}</div>}
                        </td>
                        <td className="p-4">
                          <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg">
                            {p.kategori}
                          </span>
                        </td>
                        <td className="p-4 text-right font-semibold text-slate-700">
                          {formatRp(p.hargaJual)}
                          <div className="text-[10px] text-slate-400 font-normal">Modal: {formatRp(p.hargaModal)}</div>
                        </td>
                        <td className="p-4 text-center">
                          <div className={`inline-flex items-center space-x-1 font-bold text-sm ${isLowStock ? 'text-red-600' : 'text-slate-700'}`}>
                            <span>{p.stok}</span>
                            <span className="text-xs font-medium opacity-75">{p.satuan}</span>
                            {isLowStock && <AlertTriangle className="w-4 h-4 ml-1" />}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center space-x-2">
                            <button onClick={() => handleOpenRestock(p)} className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition tooltip" title="Restock/Koreksi">
                              <PackagePlus className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleOpenEdit(p)} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition tooltip" title="Edit Produk">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleOpenLog(p)} className="p-1.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition tooltip" title="Riwayat Stok">
                              <History className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredProduk.map((p) => {
                const isLowStock = p.stok <= p.stokMinimum;
                return (
                  <div key={p.id} className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-slate-800 leading-tight">{p.nama}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                            {p.kategori}
                          </span>
                          {p.kodeBarcode && <span className="text-[10px] font-mono text-slate-400">{p.kodeBarcode}</span>}
                        </div>
                      </div>
                      <div className={`text-right ${isLowStock ? 'text-red-600' : 'text-slate-700'}`}>
                        <div className="font-bold flex items-center justify-end">
                          {p.stok} <span className="text-xs font-medium opacity-75 ml-1">{p.satuan}</span>
                          {isLowStock && <AlertTriangle className="w-3 h-3 ml-1" />}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-end mt-3">
                      <div>
                        <div className="font-bold text-emerald-600 text-sm">{formatRp(p.hargaJual)}</div>
                        <div className="text-[10px] text-slate-400">Modal: {formatRp(p.hargaModal)}</div>
                      </div>
                      <div className="flex space-x-2">
                        <button onClick={() => handleOpenLog(p)} className="p-2 text-slate-600 bg-slate-100 rounded-lg">
                          <History className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleOpenEdit(p)} className="p-2 text-blue-600 bg-blue-50 rounded-lg">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleOpenRestock(p)} className="p-2 text-emerald-600 bg-emerald-50 rounded-lg">
                          <PackagePlus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <ProdukFormModal 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        onSave={handleSaveProduk}
        editData={selectedProduk}
        isSaving={isSaving}
      />

      <RestockModal 
        isOpen={isRestockOpen}
        onClose={() => setIsRestockOpen(false)}
        onSave={handleSaveRestock}
        produk={selectedProduk}
        isSaving={isSaving}
      />

      <StokLogModal 
        isOpen={isLogOpen}
        onClose={() => setIsLogOpen(false)}
        produk={selectedProduk}
      />
    </div>
  );
}
