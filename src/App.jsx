import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute, AdminRoute } from "./components/ProtectedRoute";
import AppLayout from "./components/Layout/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Kasir from "./pages/Kasir";
import Stok from "./pages/Stok";
import Bon from "./pages/Bon";
import Laporan from "./pages/Laporan";
import KelolaPengguna from "./pages/KelolaPengguna";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Protected Routes inside AppLayout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/kasir" element={<Kasir />} />
              <Route path="/stok" element={<Stok />} />
              <Route path="/bon" element={<Bon />} />
              <Route path="/laporan" element={<Laporan />} />

              {/* Admin Only Route */}
              <Route element={<AdminRoute />}>
                <Route path="/pengguna" element={<KelolaPengguna />} />
              </Route>
            </Route>
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
