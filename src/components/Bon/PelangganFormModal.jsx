import React, { useState } from "react";
import { X, UserPlus, Save } from "lucide-react";

export default function PelangganFormModal({
  isOpen,
  onClose,
  onSave,
  isSaving = false
}) {
  const [form, setForm] = useState({
    nama: "",
    noHp: "",
    alamat: ""
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nama.trim()) return;
    onSave({
      nama: form.nama.trim(),
      noHp: form.noHp.trim() || null,
      alamat: form.alamat.trim() || null,
      totalHutang: 0
    });
    setForm({ nama: "", noHp: "", alamat: "" });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <UserPlus className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold">Tambah Pelanggan Baru</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
              Nama Pelanggan / Warung *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
              placeholder="Contoh: Warung Bu Sri / Mas Budi"
              className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
              Nomor WhatsApp / HP (Opsional)
            </label>
            <input
              type="tel"
              value={form.noHp}
              onChange={(e) => setForm({ ...form, noHp: e.target.value })}
              placeholder="Contoh: 081234567890"
              className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Digunakan untuk mengirim pengingat hutang otomatis via WhatsApp.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
              Alamat Singkat / Lokasi (Opsional)
            </label>
            <textarea
              rows={2}
              value={form.alamat}
              onChange={(e) => setForm({ ...form, alamat: e.target.value })}
              placeholder="Contoh: RT 03 / RW 02, Dekat Masjid"
              className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving || !form.nama.trim()}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center space-x-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? "Menyimpan..." : "Simpan Pelanggan"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
