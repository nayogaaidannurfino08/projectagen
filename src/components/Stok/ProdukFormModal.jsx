import React, { useState, useEffect, useRef } from "react";
import { X, Save, ScanBarcode } from "lucide-react";

const KATEGORI_OPTIONS = ["Sembako", "Minuman", "Rokok", "Snack", "Bumbu", "Kebersihan", "Lainnya"];
const SATUAN_OPTIONS = ["pcs", "kg", "liter", "bungkus", "sachet", "kotak", "kaleng", "botol", "karung", "dus"];

export default function ProdukFormModal({
  isOpen,
  onClose,
  onSave,
  editData = null,
  isSaving = false
}) {
  const [form, setForm] = useState({
    nama: "",
    kategori: "Sembako",
    hargaJual: "",
    hargaModal: "",
    stok: "",
    satuan: "pcs",
    kodeBarcode: "",
    stokMinimum: "5",
    satuanKonversiNama: "",
    satuanKonversiIsi: ""
  });

  const namaRef = useRef(null);

  useEffect(() => {
    if (editData) {
      setForm({
        nama: editData.nama || "",
        kategori: editData.kategori || "Sembako",
        hargaJual: String(editData.hargaJual || ""),
        hargaModal: String(editData.hargaModal || ""),
        stok: String(editData.stok || ""),
        satuan: editData.satuan || "pcs",
        kodeBarcode: editData.kodeBarcode || "",
        stokMinimum: String(editData.stokMinimum || "5"),
        satuanKonversiNama: editData.satuanKonversi?.namaSatuan || "",
        satuanKonversiIsi: String(editData.satuanKonversi?.isiPerPcs || "")
      });
    } else {
      setForm({
        nama: "", kategori: "Sembako", hargaJual: "", hargaModal: "",
        stok: "", satuan: "pcs", kodeBarcode: "", stokMinimum: "5",
        satuanKonversiNama: "", satuanKonversiIsi: ""
      });
    }
  }, [editData, isOpen]);

  useEffect(() => {
    if (isOpen && namaRef.current) {
      setTimeout(() => namaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      nama: form.nama.trim(),
      kategori: form.kategori,
      hargaJual: Number(form.hargaJual) || 0,
      hargaModal: Number(form.hargaModal) || 0,
      stok: Number(form.stok) || 0,
      satuan: form.satuan,
      kodeBarcode: form.kodeBarcode.trim(),
      stokMinimum: Number(form.stokMinimum) || 5,
      satuanKonversi: form.satuanKonversiNama && form.satuanKonversiIsi
        ? { namaSatuan: form.satuanKonversiNama, isiPerPcs: Number(form.satuanKonversiIsi) || 1 }
        : null
    };
    onSave(payload);
  };

  const handleScanBarcode = async () => {
    // Use BarcodeDetector API if available (Chrome 83+, Android)
    if ("BarcodeDetector" in window) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        const video = document.createElement("video");
        video.srcObject = stream;
        await video.play();
        const detector = new window.BarcodeDetector({ formats: ["ean_13", "ean_8", "code_128", "code_39", "qr_code"] });
        const detect = async () => {
          try {
            const barcodes = await detector.detect(video);
            if (barcodes.length > 0) {
              handleChange("kodeBarcode", barcodes[0].rawValue);
              stream.getTracks().forEach(t => t.stop());
              return;
            }
            requestAnimationFrame(detect);
          } catch (err) {
            stream.getTracks().forEach(t => t.stop());
          }
        };
        detect();
        // Auto-stop after 10 seconds
        setTimeout(() => { stream.getTracks().forEach(t => t.stop()); }, 10000);
      } catch (err) {
        alert("Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.");
      }
    } else {
      alert("Browser ini tidak mendukung pemindaian barcode otomatis. Silakan ketik kode secara manual.");
    }
  };

  const isEdit = !!editData;

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <h3 className="text-base font-bold">
            {isEdit ? "Edit Data Produk" : "Tambah Produk Baru"}
          </h3>
          <button onClick={onClose} disabled={isSaving} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Nama Produk */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Nama Produk *</label>
            <input ref={namaRef} type="text" required value={form.nama} onChange={(e) => handleChange("nama", e.target.value)}
              placeholder="Contoh: Beras Rojolele 5kg"
              className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>

          {/* Kategori & Satuan */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Kategori</label>
              <select value={form.kategori} onChange={(e) => handleChange("kategori", e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                {KATEGORI_OPTIONS.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Satuan Jual</label>
              <select value={form.satuan} onChange={(e) => handleChange("satuan", e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                {SATUAN_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Harga Jual & Harga Modal */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Harga Jual (Rp) *</label>
              <input type="number" required min="0" value={form.hargaJual} onChange={(e) => handleChange("hargaJual", e.target.value)}
                placeholder="0" className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Harga Modal (Rp)</label>
              <input type="number" min="0" value={form.hargaModal} onChange={(e) => handleChange("hargaModal", e.target.value)}
                placeholder="0" className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>

          {/* Stok & Stok Minimum */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                {isEdit ? "Stok Saat Ini" : "Stok Awal"}
              </label>
              <input type="number" min="0" value={form.stok} onChange={(e) => handleChange("stok", e.target.value)}
                placeholder="0" className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Stok Minimum</label>
              <input type="number" min="0" value={form.stokMinimum} onChange={(e) => handleChange("stokMinimum", e.target.value)}
                placeholder="5" className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>

          {/* Barcode */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Kode Barcode (Opsional)</label>
            <div className="flex space-x-2">
              <input type="text" value={form.kodeBarcode} onChange={(e) => handleChange("kodeBarcode", e.target.value)}
                placeholder="Scan atau ketik manual"
                className="flex-1 p-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <button type="button" onClick={handleScanBarcode}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-300 transition flex items-center space-x-1 text-xs font-medium">
                <ScanBarcode className="w-4 h-4" />
                <span>Scan</span>
              </button>
            </div>
          </div>

          {/* Satuan Konversi (Opsional) */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Konversi Satuan Grosir (Opsional)</label>
            <p className="text-[11px] text-slate-400">Contoh: 1 dus = 12 pcs. Saat restock per dus, stok pcs ikut terupdate.</p>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" value={form.satuanKonversiNama} onChange={(e) => handleChange("satuanKonversiNama", e.target.value)}
                placeholder="Nama satuan grosir (mis: dus)"
                className="p-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <input type="number" min="1" value={form.satuanKonversiIsi} onChange={(e) => handleChange("satuanKonversiIsi", e.target.value)}
                placeholder="Isi per pcs (mis: 12)"
                className="p-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button type="button" onClick={onClose} disabled={isSaving}
            className="px-4 py-2.5 text-slate-600 hover:bg-slate-200 text-sm font-semibold rounded-xl transition">
            Batal
          </button>
          <button type="button" onClick={handleSubmit} disabled={isSaving || !form.nama.trim() || !form.hargaJual}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-bold rounded-xl shadow-lg transition flex items-center space-x-2">
            <Save className="w-4 h-4" />
            <span>{isSaving ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah Produk"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
