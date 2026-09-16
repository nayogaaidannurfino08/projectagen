import React from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import { useAuth } from "../../context/AuthContext";
import { Store, LogOut } from "lucide-react";

export default function AppLayout() {
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Mode kasir fullscreen / landscape check if needed
  const isKasirPage = location.pathname === "/kasir";

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900 font-sans">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Mobile Top Header */}
        <header className="md:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800 sticky top-0 z-40">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-emerald-600 rounded-md">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-wide leading-tight">APS AGEN</h1>
              <p className="text-[10px] text-slate-400">Agen Sembako</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs bg-slate-800 text-emerald-400 px-2 py-0.5 rounded border border-slate-700">
              {userProfile?.role || "kasir"}
            </span>
            <button
              onClick={handleLogout}
              title="Keluar"
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-md"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className={`flex-1 overflow-y-auto ${isKasirPage ? "p-2 md:p-4 pb-20 md:pb-4" : "p-4 md:p-6 pb-20 md:pb-6"}`}>
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation */}
        <BottomNav />
      </div>
    </div>
  );
}
