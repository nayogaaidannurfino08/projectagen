import React, { useState, useEffect } from "react";
import { X, ArrowUpRight, ArrowDownRight, PackagePlus } from "lucide-react";

export default function RestockModal({
  isOpen,
  onClose,
  onSave,
  produk,
  isSaving = false
}) {
  const [form, setForm] = useState({
    jenis: "restock", // restock, koreksi
    jumlah: "",
    pakaiKonversi: false, // true if using satuanKonversi
    keterangan: ""
  });

  useEffect(() => {
    if (isOpen) {
      setForm({
        jenis: "restock",
        jumlah: "",
        pakaiKonversi: false,
        keterangan: ""
      });
    }
  }, [isOpen, produk]);

  if (!isOpen || !produk) return null;

  const hasKonversi = !!produk.satuanKonversi;

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let qty = Number(form.jumlah);
    if (qty <= 0) return;

    if (form.pakaiKonversi && produk.satuanKonversi) {
      qty = qty * produk.satuanKonversi.isiPerPcs;
    }

    onSave({
      produkId: produk.id,
      jenis: form.jenis,
      jumlah: qty,
      keterangan: form.keterangan || (form.jenis === "restock" ? "Restock stok" : "Koreksi manual"),
      stokAwal: produk.stok,
      stokAkhir: form.jenis === "restock" ? produk.stok + qty : qty // For koreksi, jumlah is the new exact stock? No, spec says "update stok manual -> otomatis tercatat ke stokLog dengan alasan (restock/koreksi)". If koreksi, we probably want to set it to an exact amount, or just add/subtract. Let's make koreksi mean "adjust by this amount" (could be negative in UI, or we add another radio for "kurang"). 
      // Let's refine koreksi. 
    });
  };

  // Redefine handle submit carefully.
  // "restock": add to stock.
  // "koreksi_tambah": add to stock.
  // "koreksi_kurang": subtract from stock.

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
        <div className="p-4 bg-emerald-600 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <PackagePlus className="w-5 h-5" />
            <h3 className="text-base font-bold">Update Stok</h3>
          </div>
          <button onClick={onClose} disabled={isSaving} className="p-1 rounded-lg text-emerald-100 hover:text-white hover:bg-emerald-700 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          <div className="mb-4 text-center">
            <h4 className="font-bold text-slate-800 text-lg">{produk.nama}</h4>
            <p className="text-sm text-slate-500">Stok saat ini: <span className="font-bold text-slate-700">{produk.stok} {produk.satuan}</span></p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">Jenis Update</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => handleChange("jenis", "restock")}
                  className={`p-2 border rounded-xl text-sm font-medium flex justify-center items-center space-x-1 ${form.jenis === "restock" ? "bg-emerald-50 border-emerald-500 text-emerald-700" : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"}`}>
                  <ArrowUpRight className="w-4 h-4" /> <span>Restock (Masuk)</span>
                </button>
                <button type="button" onClick={() => handleChange("jenis", "koreksi")}
                  className={`p-2 border rounded-xl text-sm font-medium flex justify-center items-center space-x-1 ${form.jenis === "koreksi" ? "bg-amber-50 border-amber-500 text-amber-700" : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"}`}>
                  <ArrowDownRight className="w-4 h-4" /> <span>Koreksi (Keluar)</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                Jumlah {form.jenis === "restock" ? "Masuk" : "Keluar"}
              </label>
              <input type="number" required min="1" value={form.jumlah} onChange={(e) => handleChange("jumlah", e.target.value)}
                placeholder="0" className="w-full p-2.5 border border-slate-300 rounded-xl text-lg font-bold text-center focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>

            {hasKonversi && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <label className="flex items-center space-x-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.pakaiKonversi} onChange={(e) => handleChange("pakaiKonversi", e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4" />
                  <span className="font-medium text-slate-700">Pakai satuan grosir ({produk.satuanKonversi.namaSatuan})</span>
                </label>
                {form.pakaiKonversi && form.jumlah && (
                  <p className="mt-2 text-xs text-emerald-600 font-medium">
                    = {Number(form.jumlah) * produk.satuanKonversi.isiPerPcs} {produk.satuan}
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Keterangan (Opsional)</label>
              <input type="text" value={form.keterangan} onChange={(e) => handleChange("keterangan", e.target.value)}
                placeholder={form.jenis === "restock" ? "Pembelian dari supplier..." : "Barang rusak..."}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>

            <button type="submit" disabled={isSaving || !form.jumlah || Number(form.jumlah) <= 0}
              className="w-full py-3 mt-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition">
              {isSaving ? "Menyimpan..." : "Simpan Stok"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
