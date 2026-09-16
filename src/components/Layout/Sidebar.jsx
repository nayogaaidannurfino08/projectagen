import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  BookOpen, 
  BarChart3, 
  Users, 
  LogOut,
  Store
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function Sidebar() {
  const { userProfile, isAdmin, logout, nama } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/kasir", label: "Kasir (POS)", icon: ShoppingCart },
    { to: "/stok", label: "Kelola Stok", icon: Package },
    { to: "/bon", label: "Hutang / Bon", icon: BookOpen },
    { to: "/laporan", label: "Laporan Penjualan", icon: BarChart3 },
  ];

  if (isAdmin) {
    navItems.push({ to: "/pengguna", label: "Kelola Pengguna", icon: Users });
  }

  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-200 min-h-screen border-r border-slate-800 flex-shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
        <div className="p-2 bg-emerald-600 rounded-lg text-white shadow-sm">
          <Store className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-white text-base tracking-wide leading-tight">APS AGEN</h1>
          <p className="text-xs text-slate-400 font-medium">Kasir Toko Sembako</p>
        </div>
      </div>

      {/* User Info Card */}
      <div className="mx-4 my-4 p-3 bg-slate-800/80 rounded-lg border border-slate-700/60">
        <div className="text-xs text-slate-400">Masuk sebagai:</div>
        <div className="font-semibold text-white text-sm truncate">{nama}</div>
        <div className="mt-1 flex items-center justify-between">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium tracking-wide uppercase ${
            isAdmin ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
          }`}>
            {userProfile?.role || "kasir"}
          </span>
          <span className="text-[11px] text-slate-400">ID: {userProfile?.agenId || "agen_01"}</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Logout button */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-3 py-2 text-sm font-medium text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3 text-rose-400" />
          <span>Keluar Akun</span>
        </button>
      </div>
    </aside>
  );
}
