import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  Store, 
  Lock, 
  Mail, 
  AlertCircle, 
  ArrowRight, 
  UserCheck, 
  ShieldAlert,
  Sparkles,
  CheckCircle2
} from "lucide-react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, DEFAULT_AGEN_ID } from "../firebase/config";
import { setUserProfile } from "../services/userService";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const getFriendlyErrorMessage = (code, rawMsg) => {
    switch (code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "Email atau kata sandi tidak cocok. Pastikan akun sudah didaftarkan.";
      case "auth/invalid-email":
        return "Format alamat email tidak valid.";
      case "auth/user-disabled":
        return "Akun ini telah dinonaktifkan.";
      case "auth/too-many-requests":
        return "Terlalu banyak percobaan gagal. Silakan coba beberapa saat lagi.";
      case "auth/network-request-failed":
        return "Koneksi jaringan terputus. Memeriksa status offline...";
      default:
        return rawMsg || "Gagal masuk ke aplikasi.";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setIsLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError(getFriendlyErrorMessage(err.code, err.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (role) => {
    setError("");
    if (role === "admin") {
      setEmail("admin@apsagen.com");
      setPassword("admin123456");
    } else {
      setEmail("kasir@apsagen.com");
      setPassword("kasir123456");
    }
  };

  const handleCreateInitialAdmin = async () => {
    setError("");
    setSuccessMsg("");
    setIsSeeding(true);
    try {
      const adminEmail = "admin@apsagen.com";
      const adminPass = "admin123456";

      // If in demo mode
      if (import.meta.env.VITE_FIREBASE_API_KEY?.includes("Placeholder")) {
        await login(adminEmail, adminPass);
        navigate("/dashboard");
        return;
      }

      // Create admin user in live Firebase
      const res = await createUserWithEmailAndPassword(auth, adminEmail, adminPass);
      await setUserProfile(res.user.uid, {
        uid: res.user.uid,
        nama: "Admin Utama Toko",
        email: adminEmail,
        role: "admin",
        agenId: DEFAULT_AGEN_ID,
        isActive: true
      });

      setSuccessMsg("Akun Admin berhasil diinisialisasi! Anda sekarang dapat masuk.");
      setEmail(adminEmail);
      setPassword(adminPass);
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setSuccessMsg("Akun admin sudah terdaftar sebelumnya. Silakan klik Masuk.");
        setEmail("admin@apsagen.com");
        setPassword("admin123456");
      } else {
        setError("Gagal membuat admin: " + err.message);
      }
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl text-slate-100 backdrop-blur-sm">
        {/* Header */}
        <div className="text-center mb-7">
          <div className="inline-flex p-3 bg-emerald-600/20 text-emerald-400 rounded-2xl border border-emerald-500/30 mb-3 shadow-inner">
            <Store className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">APS MOBILE AGEN</h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">
            Sistem Kasir & POS Agen Sembako
          </p>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-5 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-start space-x-2.5">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
            <span className="leading-relaxed">{successMsg}</span>
          </div>
        )}

        {/* Form Login */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Email Pengguna
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@apsagen.com"
                className="w-full pl-11 pr-4 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Kata Sandi
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="????????"
                className="w-full pl-11 pr-4 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || isSeeding}
            className="w-full mt-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg transition duration-150 flex items-center justify-center space-x-2 text-sm"
          >
            <span>{isLoading ? "Memverifikasi Kredensial..." : "Masuk ke Sistem"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Testing & Initial Seed Section */}
        <div className="mt-6 pt-5 border-t border-slate-700/60 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Pintasan Login Uji Coba:</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill("admin")}
              className="py-2 px-3 bg-slate-700/60 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-600/50 transition-colors flex items-center justify-center space-x-1.5"
            >
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Role Admin</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill("kasir")}
              className="py-2 px-3 bg-slate-700/60 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-600/50 transition-colors flex items-center justify-center space-x-1.5"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Role Kasir</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleCreateInitialAdmin}
            disabled={isSeeding || isLoading}
            className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-750 text-emerald-400 hover:text-emerald-300 text-xs font-medium rounded-xl border border-emerald-500/30 transition-colors flex items-center justify-center space-x-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isSeeding ? "Memproses..." : "Inisialisasi Akun Admin Baru di Firebase"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
