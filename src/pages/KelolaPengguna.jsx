import React, { useState, useEffect } from "react";
import { 
  Users, UserPlus, Shield, User, KeyRound, 
  CheckCircle2, XCircle, Power, RefreshCw, AlertTriangle, 
  Search, Mail, Calendar 
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { 
  subscribeUsers, 
  createKasirAccount, 
  toggleUserStatus, 
  updateUserRole, 
  sendResetPassword 
} from "../services/userService";
import UserFormModal from "../components/Pengguna/UserFormModal";

export default function KelolaPengguna() {
  const { currentUser, agenId } = useAuth();

  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState({ text: "", type: "" });

  useEffect(() => {
    if (!agenId) return;
    setLoading(true);
    const unsubscribe = subscribeUsers(agenId, (data) => {
      setUsersList(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [agenId]);

  const showFeedback = (text, type = "success") => {
    setFeedbackMsg({ text, type });
    setTimeout(() => {
      setFeedbackMsg({ text: "", type: "" });
    }, 4000);
  };

  const handleCreateUser = async (formData) => {
    setIsSaving(true);
    try {
      await createKasirAccount({
        ...formData,
        agenId
      });
      setIsModalOpen(false);
      showFeedback(`Akun ${formData.nama} (${formData.email}) berhasil dibuat!`);
    } catch (err) {
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (user) => {
    if (user.email === currentUser?.email) {
      alert("Anda tidak dapat menonaktifkan akun Anda sendiri yang sedang aktif.");
      return;
    }

    const currentStatus = user.status || "aktif";
    const nextStatus = currentStatus === "aktif" ? "nonaktif" : "aktif";
    const confirmMsg = `Yakin ingin mengubah status akun ${user.nama} menjadi ${nextStatus.toUpperCase()}?`;

    if (window.confirm(confirmMsg)) {
      try {
        await toggleUserStatus(user.uid, currentStatus);
        showFeedback(`Status akun ${user.nama} diubah menjadi ${nextStatus}.`);
      } catch (err) {
        showFeedback("Gagal mengubah status: " + err.message, "error");
      }
    }
  };

  const handleRoleChange = async (user, newRole) => {
    if (user.email === currentUser?.email) {
      alert("Anda tidak dapat mengubah role akun Anda sendiri.");
      return;
    }

    try {
      await updateUserRole(user.uid, newRole);
      showFeedback(`Role ${user.nama} diubah menjadi ${newRole.toUpperCase()}.`);
    } catch (err) {
      showFeedback("Gagal mengubah role: " + err.message, "error");
    }
  };

  const handleResetPassword = async (user) => {
    const confirmMsg = `Kirim instruksi reset password ke email ${user.email}?`;
    if (window.confirm(confirmMsg)) {
      try {
        const res = await sendResetPassword(user.email);
        showFeedback(res.message);
      } catch (err) {
        showFeedback("Gagal mengirim reset password: " + err.message, "error");
      }
    }
  };

  const filteredUsers = usersList.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.nama?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="w-6 h-6 text-indigo-600" />
            <h1 className="text-xl font-black text-slate-900">Kelola Pengguna & Kasir</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Manajemen hak akses, role, dan keamanan akun kasir toko agen
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition flex items-center justify-center space-x-1.5 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Akun Kasir</span>
        </button>
      </div>

      {/* Feedback Toast */}
      {feedbackMsg.text && (
        <div
          className={`p-3.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-xs transition ${
            feedbackMsg.type === "error"
              ? "bg-red-50 text-red-700 border border-red-200"
              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
          }`}
        >
          {feedbackMsg.type === "error" ? (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama pengguna atau email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="text-xs text-slate-400 font-semibold px-2">
          Total: {filteredUsers.length} Akun
        </div>
      </div>

      {/* Users List Table / Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center p-12 text-slate-400">
            <Users className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium">Tidak ada pengguna yang sesuai.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredUsers.map((u) => {
              const isCurrentUser = u.email === currentUser?.email;
              const isAktif = (u.status || "aktif") === "aktif";

              return (
                <div
                  key={u.uid}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition"
                >
                  {/* User Profile */}
                  <div className="flex items-start space-x-3.5">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 font-black text-sm ${
                        u.role === "admin"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-indigo-100 text-indigo-700"
                      }`}
                    >
                      {u.role === "admin" ? <Shield className="w-5 h-5" /> : <User className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-slate-800 text-base leading-snug">
                          {u.nama}
                        </h3>
                        {isCurrentUser && (
                          <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                            Akun Anda
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                            isAktif
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {isAktif ? "Aktif" : "Nonaktif"}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                        <span className="flex items-center space-x-1">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{u.email}</span>
                        </span>
                        {u.createdAt && (
                          <span className="flex items-center space-x-1 text-slate-400">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Dibuat: {new Date(u.createdAt).toLocaleDateString("id-ID")}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Role Select */}
                  <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                    {/* Role Selector */}
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[11px] font-semibold text-slate-400">Role:</span>
                      <select
                        disabled={isCurrentUser}
                        value={u.role || "kasir"}
                        onChange={(e) => handleRoleChange(u, e.target.value)}
                        className="py-1 px-2.5 text-xs font-bold rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:opacity-60"
                      >
                        <option value="kasir">Kasir</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>

                    {/* Reset Password Button */}
                    <button
                      onClick={() => handleResetPassword(u)}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition text-xs font-semibold flex items-center space-x-1"
                      title="Kirim Link Reset Password"
                    >
                      <KeyRound className="w-4 h-4" />
                      <span className="hidden md:inline">Reset Password</span>
                    </button>

                    {/* Active / Deactivate Button */}
                    <button
                      disabled={isCurrentUser}
                      onClick={() => handleToggleStatus(u)}
                      className={`p-2 rounded-xl transition text-xs font-bold flex items-center space-x-1 disabled:opacity-30 ${
                        isAktif
                          ? "bg-red-50 hover:bg-red-100 text-red-700 border border-red-200"
                          : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
                      }`}
                      title={isAktif ? "Nonaktifkan Akun" : "Aktifkan Akun"}
                    >
                      <Power className="w-4 h-4" />
                      <span className="hidden md:inline">{isAktif ? "Nonaktifkan" : "Aktifkan"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Tambah Pengguna */}
      <UserFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreateUser}
        isSaving={isSaving}
      />
    </div>
  );
}
