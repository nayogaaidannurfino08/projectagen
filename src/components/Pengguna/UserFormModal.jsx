import React, { useState } from "react";
import { X, UserPlus, Save, Lock, Mail, User, Shield } from "lucide-react";

export default function UserFormModal({
  isOpen,
  onClose,
  onSave,
  isSaving = false
}) {
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("kasir");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!nama.trim() || !email.trim() || !password) {
      setError("Semua field wajib diisi.");
      return;
    }

    if (password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }

    try {
      await onSave({
        nama: nama.trim(),
        email: email.trim(),
        password,
        role
      });
      setNama("");
      setEmail("");
      setPassword("");
      setRole("kasir");
    } catch (err) {
      setError(err.message || "Gagal membuat akun pengguna.");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <UserPlus className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold">Tambah Akun Kasir / Pengguna</h3>
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
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
              Nama Lengkap Kasir / Pengguna *
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                autoFocus
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Contoh: Rian Pratama (Shift Pagi)"
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
              Email Login *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="kasir1@apsagen.com"
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
              Password Awal *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
              Peran (Role) *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("kasir")}
                className={`p-3 rounded-xl border text-left flex items-center space-x-2.5 transition ${
                  role === "kasir"
                    ? "border-indigo-600 bg-indigo-50 text-indigo-900"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className={`p-1.5 rounded-lg ${role === "kasir" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold">Kasir</div>
                  <div className="text-[10px] text-slate-400">POS & Bon</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole("admin")}
                className={`p-3 rounded-xl border text-left flex items-center space-x-2.5 transition ${
                  role === "admin"
                    ? "border-indigo-600 bg-indigo-50 text-indigo-900"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className={`p-1.5 rounded-lg ${role === "admin" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold">Admin</div>
                  <div className="text-[10px] text-slate-400">Akses Penuh</div>
                </div>
              </button>
            </div>
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
              disabled={isSaving}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center space-x-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? "Menyimpan..." : "Buat Akun"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
